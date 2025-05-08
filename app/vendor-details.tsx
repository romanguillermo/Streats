import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Image,
  FlatList,
  SectionList,
  Linking,
  Platform,
  Alert,
  ActivityIndicator, 
  Modal,
} from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import Colors from '../constants/colors';
import { Vendor, MenuItem, isVendorOpen, VendorPhoto, getTodayHours, Review, formatTo12Hour } from '../models/Vendor';
import ReviewModal from '../components/ReviewModal';
import { doc, getDoc, onSnapshot, DocumentSnapshot, DocumentData,
  collection, addDoc, updateDoc, deleteDoc, serverTimestamp, 
  getDocs, query, orderBy, Timestamp, increment, arrayUnion, arrayRemove,
 } from 'firebase/firestore';
import MenuCategorySection from '../components/MenuCategorySection';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export default function VendorDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id } = params;
  const { isFavorite, addFavorite, removeFavorite, favorites } = useFavorites();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  const [isImageViewVisible, setImageViewVisible] = useState(false); 
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<VendorPhoto | null>(null); 

  const currentUser = auth.currentUser;
  const CATEGORY_ORDER = ["Food", "Drinks", "Add Ons"];

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setError("Invalid Vendor ID.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true); 
    setError(null);

    const vendorDocRef = doc(db, "vendors", id);

    // --- onSnapshot for real time updates of vendor document ---
    const unsubscribeVendor = onSnapshot(
      vendorDocRef,
      async (docSnap) => {
        // Make callback async
        console.log(
          "Vendor snapshot listener fired. Document exists:",
          docSnap.exists()
        );
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Map the latest vendor data
          let currentVendorData: Vendor = {
            id: docSnap.id,
            name: data.name || "Unnamed Vendor",
            description: data.description || "",
            cuisineType: data.cuisineType || "Unknown",
            category: data.category,
            location: {
              latitude: data.location?.latitude || 0,
              longitude: data.location?.longitude || 0,
            },
            menu: data.menu || {},
            photos: data.photos || [], 
            rating: data.rating !== undefined ? data.rating : null,
            reviews: vendor?.reviews || [], 
            reviewCount: data.reviewCount,
            operatingHours: data.operatingHours || {},
            contactInfo: data.contactInfo || {},
          };

          // --- Fetch the associated reviews *inside* the snapshot callback ---
          try {
            const reviewsCollectionRef = collection(
              db,
              "vendors",
              id,
              "reviews"
            );
            const reviewsQuery = query(
              reviewsCollectionRef,
              orderBy("date", "desc")
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);

            const fetchedReviews: Review[] = [];
            reviewsSnapshot.forEach((reviewDoc) => {
              const reviewData = reviewDoc.data();
              const reviewDate =
                reviewData.date instanceof Timestamp
                  ? reviewData.date.toDate().toISOString()
                  : new Date().toISOString();
              fetchedReviews.push({
                id: reviewDoc.id,
                userId: reviewData.userId || "",
                userName: reviewData.userName || "Anonymous",
                rating: reviewData.rating || 0,
                comment: reviewData.comment || "",
                date: reviewDate,
              });
            });

            // Combine the latest vendor data with the just-fetched reviews
            currentVendorData.reviews = fetchedReviews;

            // Update user-specific reviews state based on the fetched reviews
            if (currentUser) {
              const userReviewList = fetchedReviews.filter(
                (review) => review.userId === currentUser.uid
              );
              setUserReviews(userReviewList); // Update userReviews state
            } else {
              setUserReviews([]); // Clear if user logged out
            }

            // Update the main vendor state
            setVendor(currentVendorData);
            setError(null); // Clear error on successful update
          } catch (reviewsError: any) {
            console.error(
              "Error fetching reviews subcollection inside snapshot:",
              reviewsError
            );
            setError("Could not load reviews for this vendor.");
            // Still update vendor state, but reviews array will be empty
            currentVendorData.reviews = [];
            setVendor(currentVendorData);
            setUserReviews([]);
          } finally {
            // false only after vendor data AND review fetch attempt finish
            setIsLoading(false);
          }
        } else {
          // Vendor document doesn't exist or was deleted
          console.log("Vendor document does not exist.");
          setError("Vendor not found.");
          setVendor(null);
          setUserReviews([]);
          setIsLoading(false);
        }
      },
      (error) => {
        // Error callback for snapshot listener itself
        console.error("Error listening to vendor document:", error);
        setError("Failed to load vendor details.");
        setVendor(null);
        setUserReviews([]);
        setIsLoading(false);
      }
    );

    // --- Return the unsubscribe function for cleanup ---
    return () => {
      console.log("Unsubscribing from vendor snapshot listener for ID:", id);
      unsubscribeVendor();
    };
  }, [id, currentUser]);

  const toggleFavorite = useCallback(() => {
    if (vendor) {
      if (isFavorite(vendor.id)) {
        removeFavorite(vendor.id);
      } else {
        addFavorite(vendor.id);
      }
    }
  }, [vendor, isFavorite, addFavorite, removeFavorite]);

  const navigateToVendor = () => {
    if (vendor && Platform.OS !== 'web') {
      const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
      const latLng = `${vendor.location.latitude},${vendor.location.longitude}`;
      const label = vendor.name;
      const url = Platform.select({
        ios: `${scheme}?q=${label}&ll=${latLng}`,
        android: `${scheme}0,0?q=${latLng}(${label})`
      });

      if (url) {
        Linking.openURL(url);
      }
    }
  };  

  const callVendor = () => {
    if (vendor?.contactInfo.phone) {
      Linking.openURL(`tel:${vendor.contactInfo.phone}`);
    } else {
      Alert.alert('No Phone Number', 'This vendor has not provided a phone number.');
    }
  };

  const openInstagram = () => {
    if (vendor?.contactInfo.instagram) {
      const instagramHandle = vendor.contactInfo.instagram.replace('@', '');
      Linking.openURL(`https://instagram.com/${instagramHandle}`);
    }
  };

  const openWebsite = () => {
    if (vendor?.contactInfo.website) {
      Linking.openURL(`https://${vendor.contactInfo.website}`);
    }
  };

  const renderDay = (day: string, hours: any) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isToday = today === day.toLowerCase();
    
    return (
      <View style={[styles.dayRow, isToday && styles.todayRow]}>
        <Text style={[styles.dayText, isToday && styles.todayText]}>
          {day.charAt(0).toUpperCase() + day.slice(1)}
        </Text>
        <Text style={[styles.hoursText, isToday && styles.todayText]}>
        {hours ? `${formatTo12Hour(hours.open)} - ${formatTo12Hour(hours.close)}` : 'Closed'}
        </Text>
      </View>
    );
  };

  if (!vendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Submit review
  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!vendor || !currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    // --- Logic for editing an existing review ---
    if (editingReview && editingReview.id) {
      console.log("Submitting EDIT for review ID:", editingReview.id);
      const reviewDocRef = doc(db, 'vendors', vendor.id, 'reviews', editingReview.id); 

      try {
        // --- Update the document in Firestore ---
        await updateDoc(reviewDocRef, {
          rating: rating,
          comment: comment,
          date: serverTimestamp(), 
        });
        console.log("Review updated successfully in Firestore.");

        // --- Client-side state update ---
        // 1. Find the index of the review being edited in the local state
        const reviewIndex = vendor.reviews.findIndex(r => r.id === editingReview.id);

        if (reviewIndex !== -1) {
          // 2. Create the updated review object for local state
          const updatedReviewForState: Review = {
            ...editingReview,
            rating,
            comment,
            date: new Date().toISOString(),
          };
          // 3. Create a new array with the updated review
          const updatedReviews = [...vendor.reviews];
          updatedReviews[reviewIndex] = updatedReviewForState;

          // 4. Recalculate average rating
          const newAverageRating = calculateAverageRating(updatedReviews);

          // 5. Update local vendor state
          setVendor((prevVendor) =>
            prevVendor
              ? {
                  ...prevVendor,
                  reviews: updatedReviews,
                  rating: newAverageRating,
                }
              : null
          );

          // 6. Update the vendor document's rating in Firestore only if changed
          const currentVendorRating = vendor.rating;
          const vendorDocRef = doc(db, "vendors", vendor.id);
          // Check if the new average rating is actually different from the current one
          const ratingChanged = newAverageRating !== currentVendorRating;

          if (ratingChanged) {
            console.log(
              `Rating changed: ${currentVendorRating} -> ${newAverageRating}. Updating vendor doc.`
            );
            // Only attempt the update if the rating actually changed
            await updateDoc(vendorDocRef, {
              rating: newAverageRating,
            });
          } else {
            console.log(
              `Rating unchanged (${newAverageRating}). Skipping vendor doc rating update.`
            );
          }

          Alert.alert("Success", "Your review has been updated!");
        } else {
          console.error(
            "Edited review not found in local state, might be out of sync."
          );
        }

      } catch (error) {
        console.error("Error updating review:", error);
        Alert.alert('Error', 'Could not update your review.');
      } finally {
        setEditingReview(null); 
        setShowReviewModal(false); 
      }

    } else {
      // --- Logic for creating new review ---
      console.log("Submitting NEW review");
      const newReviewData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        rating: rating,
        comment: comment,
        date: serverTimestamp(),
        vendorId: vendor.id,
        vendorName: vendor.name
      };
      const reviewsCollectionRef = collection(db, 'vendors', vendor.id, 'reviews');

      try {
         const addedReviewRef = await addDoc(reviewsCollectionRef, newReviewData);
         console.log("Review added with ID: ", addedReviewRef.id);

         // Client-side update
         const addedReviewForState: Review = {
             userId: newReviewData.userId,
             userName: newReviewData.userName,
             rating: newReviewData.rating,
             comment: newReviewData.comment,
             id: addedReviewRef.id,
             date: new Date().toISOString(),
         };

         const updatedReviews = [...vendor.reviews, addedReviewForState];
         const newAverageRating = calculateAverageRating(updatedReviews);

         setVendor(prevVendor => prevVendor ? ({
           ...prevVendor,
           reviews: updatedReviews,
           rating: newAverageRating
         }) : null);

          if (userReviews.filter(r => r.userId === currentUser.uid).length === 0) {
            setUserReviews([addedReviewForState]);
         }


         const vendorDocRef = doc(db, 'vendors', vendor.id);
         await updateDoc(vendorDocRef, {
           rating: newAverageRating,
            reviewCount: increment(1)
         });

         Alert.alert('Success', 'Your review has been submitted!');

      } catch (error) {
        console.error("Error submitting review: ", error);
        Alert.alert('Error', 'Could not submit your review.');
      } finally {
         setShowReviewModal(false);
      }
    }
  };
  
  // Calculate average rating
  const calculateAverageRating = (reviews: Review[]): number | null => {
    if (reviews.length === 0) return null;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const avg = sum / reviews.length;
    return Number(avg.toFixed(1));
  };
  
  // Edit a review
  const handleEditReview = (reviewToEdit: Review) => {
    // Ensure we have the necessary data to pre-fill the modal
    if (!reviewToEdit || !reviewToEdit.id) {
        console.error("Cannot edit review: Invalid review object passed.");
        Alert.alert("Error", "Could not start editing the review.");
        return;
    }
    console.log("Editing review:", reviewToEdit); // Log the review being edited
    setEditingReview(reviewToEdit); // Store the review object (including its Firestore ID 'id')
    setShowReviewModal(true); // Open the moda
  };
  
  // Delete a review
  const handleDeleteReview = async (reviewIdToDelete: string) => {
    if (!vendor || !reviewIdToDelete) {
      console.error("Cannot delete review: Missing vendor or review ID.");
      return;
    }

    console.log("Attempting to delete review ID:", reviewIdToDelete);
    const reviewDocRef = doc(db, 'vendors', vendor.id, 'reviews', reviewIdToDelete);

    // Double-check with user
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { 
          // --- Deletion Logic Starts Here ---
          try {
            // --- Delete document from Firestore ---
            await deleteDoc(reviewDocRef);
            console.log("Review deleted successfully from Firestore.");

            // --- Client-side state update ---
            // 1. Filter out the deleted review from local state
            const updatedReviews = vendor.reviews.filter(r => r.id !== reviewIdToDelete);

            // 2. Recalculate average rating
            const newAverageRating = calculateAverageRating(updatedReviews);

            // 3. Update local vendor state
            setVendor(prevVendor => prevVendor ? ({
              ...prevVendor,
              reviews: updatedReviews,
              rating: newAverageRating
            }) : null);

             // 4. Update user-specific reviews state
            setUserReviews(prevUserReviews => prevUserReviews.filter(r => r.id !== reviewIdToDelete));

            // 5. Update the vendor document's rating in Firestore
            const vendorDocRef = doc(db, 'vendors', vendor.id);
            await updateDoc(vendorDocRef, {
              rating: newAverageRating,
              reviewCount: increment(-1)
            });

            Alert.alert('Success', 'Your review has been deleted.');

          } catch (error) {
            console.error("Error deleting review:", error);
            Alert.alert('Error', 'Could not delete your review.');
          }
        }}, 
      ]
    );
  };
  
  const renderReviewItem = (review: Review) => {
    const isUserReview = currentUser && review.userId === currentUser.uid;

    // Convert date for display, handling both Timestamp and string
    let displayDate: Date | null = null;
    try {
      if (review.date instanceof Timestamp) {
        displayDate = review.date.toDate();
      } else if (typeof review.date === 'string') {
        displayDate = new Date(review.date);
      }
    } catch (e) {
      console.error("Error parsing review date:", e);
    }
    
    return (
      <View key={review.id} style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewUser}>
            <FontAwesome name="user-circle" size={24} color="#ccc" />
            <Text style={styles.reviewUsername}>
              {review.userName}
              {isUserReview && <Text style={styles.userReviewLabel}> (You)</Text>}
            </Text>
          </View>
          <View style={styles.reviewRating}>
            {[1, 2, 3, 4, 5].map(star => (
              <FontAwesome
                key={star}
                name="star"
                size={14}
                color={star <= review.rating ? Colors.primary : '#ddd'}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {displayDate ? displayDate.toLocaleDateString() : 'Date unavailable'}
        </Text>
        <Text style={styles.reviewComment}>{review.comment}</Text>
        
        {isUserReview && (
          <View style={styles.reviewActions}>
            <TouchableOpacity 
              style={styles.reviewActionButton}
              onPress={() => handleEditReview(review)}
            >
              <FontAwesome name="pencil" size={14} color="#666" />
              <Text style={styles.reviewActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.reviewActionButton}
              onPress={() => handleDeleteReview(review.id)}
            >
              <FontAwesome name="trash" size={14} color="#666" />
              <Text style={styles.reviewActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={40} color={Colors.secondary.red || 'red'} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Vendor data could not be loaded.</Text>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backButtonText}>Go Back</Text>
         </TouchableOpacity>
      </View>
    );
  }

  const renderPhotoItem = ({ item, index }: { item: VendorPhoto, index: number }) => {
    const handlePhotoPress = () => {
      setSelectedImageUri(item.url); 
      setPhotoToDelete(item);
      //setSelectedPhotoObject(item);
      setImageViewVisible(true);
    };
    return (
      <TouchableOpacity style={styles.photoItemContainer} onPress={handlePhotoPress}>
        <Image source={{ uri: item.url }} style={styles.photoItem} resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  // Function to upload image and return URL
  const uploadImageAsync = async (uri: string): Promise<{ downloadURL: string; storagePath: string }> => {
    if (!vendor) throw new Error("Vendor data is not available.");

    // Convert image URI to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    // Create a unique filename (e.g., using timestamp)
    const filename = `${Date.now()}_${uri.substring(uri.lastIndexOf('/') + 1)}`;
    // Create a storage reference (e.g., vendors/vendorId/images/filename.jpg)
    const storage = getStorage();
    const storageRef = ref(storage, `vendors/${vendor.id}/images/${filename}`);

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // track progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error);
          reject(error);
          (blob as any).close();
        },
        async () => {
          console.log("Upload successful");
          (blob as any).close();
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const storagePath = uploadTask.snapshot.ref.fullPath; 
            resolve({ downloadURL, storagePath });
          } catch (getUrlError) {
            console.error("Failed to get download URL/Path:", getUrlError);
            reject(getUrlError);
          }
        }
      );
    });
  };

  // Function to update Firestore document
  const updateVendorPhotos = async (imageUrl: string, storagePath: string) => {
    if (!vendor) return;
    const vendorDocRef = doc(db, "vendors", vendor.id);

    const newPhotoObject: VendorPhoto = {
      url: imageUrl,
      storagePath: storagePath,
      // uploadedBy: currentUser?.uid,
      // uploadedAt: serverTimestamp()
    };

    try {
      await updateDoc(vendorDocRef, {
        photos: arrayUnion(newPhotoObject),
      });
      console.log("Firestore updated successfully with new photo object.");
      // Optimistically update local state to refresh UI immediately
      /*
      setVendor((prevVendor) => {
        if (!prevVendor) return null;
        const optimisticPhotoObject = {
          ...newPhotoObject,
        };
        return {
          ...prevVendor,
          photos: [...prevVendor.photos, optimisticPhotoObject], // Add URL to local photos array
        };
      });
      */
      Alert.alert("Success", "Photo added!");
    } catch (error) {
      console.error("Error updating vendor photos in Firestore:", error);
      Alert.alert("Error", "Could not save the photo reference.");
      throw error;
    }
  };

  // Function to handle the "Add Photo" button press
  const handleAddPhotoPress = async () => {
    if (isUploading) return; // Prevent multiple uploads

    // 1. Request Permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload images.");
      return;
    }

    // 2. Launch Image Picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow basic editing
      aspect: [4, 3], // Enforce aspect ratio
      quality: 0.7, // Reduce quality slightly to save storage/bandwidth (0 to 1)
    });

    // 3. Handle Result
    if (pickerResult.canceled) {
      console.log("Image selection cancelled");
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;

      // 4. Upload & Update
      setIsUploading(true);
      try {
        console.log("Starting upload for:", selectedImageUri);
        const { downloadURL, storagePath } = await uploadImageAsync(selectedImageUri);
        console.log("Got download URL:", downloadURL);
        console.log("Got storage Path:", storagePath);
        await updateVendorPhotos(downloadURL, storagePath);
      } catch (error) {
        console.error("Error adding photo:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
       console.log("No image assets found in picker result.");
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete || !vendor || isDeleting || !currentUser) {
      console.log("Deletion conditions not met:", {
        photoToDelete,
        vendor,
        isDeleting,
        currentUser,
      });
      return;
    }

    Alert.alert(
      "Delete Photo",
      "Are you sure you want to permanently delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setPhotoToDelete(null),
        }, // Clear photoToDelete if cancelled
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            setImageViewVisible(false); // Close modal immediately

            try {
              // 1. Delete from Storage
              console.log("Deleting from Storage:", photoToDelete.storagePath);
              const storage = getStorage();
              const storageRef = ref(storage, photoToDelete.storagePath);
              await deleteObject(storageRef);
              console.log("Successfully deleted from Storage.");

              // 2. Delete from Firestore
              console.log(
                "Removing from Firestore photos array:",
                photoToDelete
              );
              const vendorDocRef = doc(db, "vendors", vendor.id);
              await updateDoc(vendorDocRef, {
                photos: arrayRemove(photoToDelete),
              });
              console.log("Successfully removed from Firestore.");

              Alert.alert("Success", "Photo deleted.");
            } catch (error: any) {
              console.error("Error deleting photo:", error);
              if (error.code === "storage/object-not-found") {
                Alert.alert(
                  "Error",
                  "Photo already deleted from storage, removing from list."
                );
                try {
                  const vendorDocRef = doc(db, "vendors", vendor.id);
                  await updateDoc(vendorDocRef, {
                    photos: arrayRemove(photoToDelete),
                  });
                } catch (fsError) {
                  console.error(
                    "Error removing from Firestore after Storage error:",
                    fsError
                  );
                }
              } else {
                Alert.alert(
                  "Error",
                  "Could not delete photo. Please try again."
                );
              }
            } finally {
              setIsDeleting(false);
              setPhotoToDelete(null); // Clear selected photo
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          backgroundColor: "white",
          borderRadius: 20,
          padding: 8,
        }}
        onPress={toggleFavorite}
      >
        <FontAwesome
          name={isFavorite(vendor.id) ? "heart" : "heart-o"}
          size={24}
          color={isFavorite(vendor.id) ? Colors.primary : "#888"}
        />
      </TouchableOpacity>
      {/* Vendor Header */}
      <View style={styles.header}>
        <View style={styles.vendorImageContainer}>
          {vendor.photos && vendor.photos.length > 0 && vendor.photos[0] ? (
            <Image
              source={{ uri: vendor.photos[0].url }}
              style={styles.vendorImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="cutlery" size={40} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorCuisine}>{vendor.cuisineType}</Text>

          <View style={styles.ratingContainer}>
            {vendor.rating !== undefined &&
            vendor.rating !== null &&
            vendor.rating > 0 ? (
              <>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name="star"
                    size={18}
                    color={star <= vendor.rating! ? Colors.primary : "#ddd"}
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text style={styles.ratingText}>
                  {" "}
                  {vendor.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewCountText}>
                  {" "}
                  ({vendor.reviews.length})
                </Text>
              </>
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            )}
          </View>

          <View style={styles.statusContainer}>
            {isVendorOpen(vendor) ? (
              <Text style={styles.openStatus}>
                Open Now • {getTodayHours(vendor)}
              </Text>
            ) : (
              <Text style={styles.closedStatus}>
                Closed • Opens {getTodayHours(vendor)}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToVendor}
            >
              <FontAwesome name="map-marker" size={20} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>

            {vendor.contactInfo.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={callVendor}
              >
                <FontAwesome name="phone" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {/* Menu tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === "menu" && styles.activeTab]}
          onPress={() => setActiveTab("menu")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "menu" && styles.activeTabText,
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
        {/* Info tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === "info" && styles.activeTab]}
          onPress={() => setActiveTab("info")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "info" && styles.activeTabText,
            ]}
          >
            Info
          </Text>
        </TouchableOpacity>
        {/* Reviews tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
          onPress={() => setActiveTab("reviews")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reviews" && styles.activeTabText,
            ]}
          >
            Reviews
          </Text>
        </TouchableOpacity>
        {/* Photos tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === "photos" && styles.activeTab]}
          onPress={() => setActiveTab("photos")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "photos" && styles.activeTabText,
            ]}
          >
            Photos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Menu Tab */}
        {activeTab === "menu" && (
          <ScrollView>
            {vendor.menu && Object.keys(vendor.menu).length > 0 ? (
              Object.keys(vendor.menu)
                // Sort the available category names based on our predefined order
                .sort((a, b) => {
                  const indexA = CATEGORY_ORDER.indexOf(a);
                  const indexB = CATEGORY_ORDER.indexOf(b);
                  // If both in list, sort by that order
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                  }
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;

                  return 0;
                })
                // Map over sortedmcategory names
                .map((categoryName) => {
                  const categoryData = vendor.menu![categoryName];
                  return (
                    <MenuCategorySection
                      key={categoryName}
                      categoryName={categoryName}
                      categoryData={categoryData}
                    />
                  );
                })
            ) : (
              <View style={styles.emptyState}>
                <Text>Menu information not available.</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <ScrollView style={styles.infoScrollView}>
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About</Text>
                <Text style={styles.infoText}>{vendor.description}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Hours</Text>
                {renderDay("Monday", vendor.operatingHours.monday)}
                {renderDay("Tuesday", vendor.operatingHours.tuesday)}
                {renderDay("Wednesday", vendor.operatingHours.wednesday)}
                {renderDay("Thursday", vendor.operatingHours.thursday)}
                {renderDay("Friday", vendor.operatingHours.friday)}
                {renderDay("Saturday", vendor.operatingHours.saturday)}
                {renderDay("Sunday", vendor.operatingHours.sunday)}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Contact</Text>
                {vendor.contactInfo.phone && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={callVendor}
                  >
                    <FontAwesome
                      name="phone"
                      size={16}
                      color="#666"
                      style={styles.contactIcon}
                    />
                    <Text style={styles.contactText}>
                      {vendor.contactInfo.phone}
                    </Text>
                  </TouchableOpacity>
                )}

                {vendor.contactInfo.website && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={openWebsite}
                  >
                    <FontAwesome
                      name="globe"
                      size={16}
                      color="#666"
                      style={styles.contactIcon}
                    />
                    <Text style={styles.contactText}>
                      {vendor.contactInfo.website}
                    </Text>
                  </TouchableOpacity>
                )}

                {vendor.contactInfo.instagram && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={openInstagram}
                  >
                    <FontAwesome
                      name="instagram"
                      size={16}
                      color="#666"
                      style={styles.contactIcon}
                    />
                    <Text style={styles.contactText}>
                      {vendor.contactInfo.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <ScrollView>
            <View style={styles.reviewsSummary}>
              {vendor.rating !== undefined && vendor.rating !== null ? (
                <>
                  <Text style={styles.ratingLarge}>
                    {vendor.rating.toFixed(1)}
                  </Text>
                  <View style={styles.ratingStarsLarge}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FontAwesome
                        key={star}
                        name="star"
                        size={24}
                        color={star <= vendor.rating! ? Colors.primary : "#ddd"}
                        style={{ marginRight: 4 }}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.noReviewsTextLarge}>No Reviews Yet</Text>
              )}
              <Text style={styles.reviewCount}>
                Based on {vendor.reviews.length}{" "}
                {vendor.reviews.length === 1 ? "review" : "reviews"}
              </Text>
            </View>

            {/* Display all reviews */}
            {vendor.reviews.map((review) => {
              return renderReviewItem(review);
            })}

            {vendor.reviews.length === 0 && (
              <View style={styles.emptyState}>
                <Text>No reviews yet. Be the first to review!</Text>
              </View>
            )}

            {/* Add/edit review button */}
            {currentUser ? (
              userReviews.length > 0 ? (
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => handleEditReview(userReviews[0])}
                >
                  <Text style={styles.writeReviewText}>Edit Your Review</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() =>
                  Alert.alert(
                    "Sign In Required",
                    "Please sign in to leave a review"
                  )
                }
              >
                <Text style={styles.writeReviewText}>Log in to Review</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <View style={styles.photosContainer}>
            {vendor.photos && vendor.photos.length > 0 ? (
              <FlatList
                data={vendor.photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item, index) =>
                  item.storagePath || `photo-${index}`
                }
                numColumns={3}
                contentContainerStyle={styles.photosGrid}
              />
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome name="camera" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No photos available yet.
                </Text>
              </View>
            )}

            {/* Upload Button */}
            <TouchableOpacity
              style={[
                styles.uploadPhotoButton,
                isUploading && styles.disabledButton,
              ]} // Apply disabled style when uploading
              onPress={handleAddPhotoPress}
              disabled={isUploading} // Disable button during upload
            >
              {isUploading ? (
                <ActivityIndicator
                  color="white"
                  size="small"
                  style={{ marginRight: 8 }}
                />
              ) : (
                <FontAwesome
                  name="camera"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.uploadPhotoButtonText}>
                {isUploading ? "Uploading..." : "Add Photo"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ReviewModal
        visible={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(null);
        }}
        onSubmit={handleReviewSubmit}
        initialRating={editingReview ? editingReview.rating : 0}
        initialComment={editingReview ? editingReview.comment : ""}
        isEditing={!!editingReview}
      />

      <Modal
        visible={isImageViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setImageViewVisible(false);
          setPhotoToDelete(null);
        }}
      >
        <View style={styles.imageModalBackground}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => {
              setImageViewVisible(false);
              setPhotoToDelete(null); // Clear on close
            }}
            disabled={isDeleting}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>

          {/* Image */}
          {selectedImageUri && (
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          {/* Delete Button */}
          {photoToDelete && currentUser && (
            /* Optional: && currentUser.uid === photoToDelete.uploadedBy */ <TouchableOpacity
              style={[
                styles.deletePhotoButton,
                isDeleting && styles.disabledButton,
              ]}
              onPress={handleDeletePhoto}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <FontAwesome name="trash" size={22} color="white" />
              )}
              <Text style={styles.deleteButtonText}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          )}
          
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vendorCuisine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 20, // Ensure container has height even when showing text
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statusContainer: {
    marginBottom: 10,
  },
  openStatus: {
    color: 'green',
    fontWeight: '500',
  },
  closedStatus: {
    color: 'red',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  actionButtonText: {
    marginLeft: 5,
    color: Colors.primary,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1, // Make sure this View takes up remaining space
    // Remove padding if you want ScrollView/FlatList content to go edge-to-edge
     padding: 15, // Keep or remove based on desired layout
  },
  infoScrollView: { // Add padding back to the ScrollView if needed
     padding: 15,
  },
  infoContainer: {
    // paddingBottom: 20, // Padding might be handled by ScrollView now
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayRow: {
    backgroundColor: '#f9f9f9',
  },
  dayText: {
    fontSize: 16,
  },
  todayText: {
    fontWeight: 'bold',
  },
  hoursText: {
    fontSize: 16,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactIcon: {
    width: 24,
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
  },
  reviewsSummary: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 15,
  },
  ratingLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  ratingStarsLarge: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewUsername: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 16,
    lineHeight: 22,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noReviewsTextLarge: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginBottom: 10,
  },
  writeReviewButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  writeReviewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userReviewLabel: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 14,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    padding: 5,
  },
  reviewActionText: {
    color: '#666',
    marginLeft: 5,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background || '#fff',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.secondary.red || 'red', 
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  backButtonText: {
    color: Colors.secondary.white || '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photosContainer: {
    flex: 1, // Ensure it takes available space within tabContent
  },
  photosGrid: {
     paddingBottom: 10, // Space below the grid
     // paddingTop: 5, // Space above the grid - adjust as needed
  },
  photoItemContainer: {
    flex: 1 / 3, // For 3 columns
    aspectRatio: 1, // Make items square
    padding: 2, // Small gap between photos
  },
  photoItem: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20, 
    alignSelf: 'center', 
  },
  uploadPhotoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: { 
    backgroundColor: '#cccccc',
  },
  emptyStateText: { 
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
 emptyState: {
    flex: 1, 
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center', 
 },
 // Styles for Image Viewer Modal
 imageModalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.85)', 
  justifyContent: 'center',
  alignItems: 'center',
},
imageModalCloseButton: {
  position: 'absolute',
  top: 50, 
  right: 20,
  padding: 10,
  zIndex: 2, 
},
fullScreenImage: {
  width: '100%',
  height: '85%',
},
deletePhotoButton: {
  position: 'absolute',
  bottom: 30,
  alignSelf: 'center',
  backgroundColor: 'rgba(255, 0, 0, 0.7)',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 25,
  flexDirection: 'row',
  alignItems: 'center',
},
deleteButtonText: {
  color: 'white',
  fontWeight: 'bold',
  marginLeft: 8,
  fontSize: 16,
},
});
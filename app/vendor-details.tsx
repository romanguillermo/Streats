import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Image,
  FlatList,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { auth } from '../config/firebaseConfig';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import Colors from '../constants/colors';
import { sampleVendors, Vendor, MenuItem, isVendorOpen, getTodayHours, Review } from '../models/Vendor';
import ReviewModal from '../components/ReviewModal';

export default function VendorDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id } = params;
  const { isFavorite, addFavorite, removeFavorite, favorites } = useFavorites();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([])

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (id) {
      const foundVendor = sampleVendors.find(v => v.id === id);
      if (foundVendor) {
        setVendor(foundVendor);
      } else {
        Alert.alert('Error', 'Vendor not found');
        router.back();
      }
    }
  }, [id]);

  useEffect(() => {
    // After loading the vendor, find user reviews
    if (vendor && currentUser) {
      const userReviewList = vendor.reviews.filter(
        review => review.userId === currentUser.uid
      );
      setUserReviews(userReviewList);
    }
  }, [vendor, currentUser]);

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
          {hours ? `${hours.open} - ${hours.close}` : 'Closed'}
        </Text>
      </View>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDescription}>{item.description}</Text>
      </View>
      <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
    </View>
  );

  if (!vendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Submit review
  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!vendor || !currentUser) {
      Alert.alert('Error', 'You must be logged in to leave a review');
      return;
    }
    
    // Check if user is editing an existing review
    if (editingReview) {
      // Find the review in the vendor's reviews
      const updatedReviews = vendor.reviews.map(review => 
        review.id === editingReview.id 
          ? {
              ...review,
              rating,
              comment,
              date: new Date().toISOString()
            }
          : review
      );
      
      // Update vendor with new reviews
      setVendor({
        ...vendor,
        reviews: updatedReviews,
        // Recalculate the average rating
        rating: calculateAverageRating(updatedReviews)
      });
      
      setEditingReview(null);
    } else {
      // Create new review
      const newReview: Review = {
        id: Date.now().toString(), // Simple ID generation
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        rating,
        comment,
        date: new Date().toISOString()
      };
      
      const updatedReviews = [...vendor.reviews, newReview];
      
      // Update vendor with new review
      setVendor({
        ...vendor,
        reviews: updatedReviews,
        // Recalculate average rating
        rating: calculateAverageRating(updatedReviews)
      });
      
      // Update user reviews
      setUserReviews([...userReviews, newReview]);
    }
    
    setShowReviewModal(false);
    
    // Need to send to backend
    Alert.alert('Success', 'Your review has been submitted!');
  };
  
  // Calculate average rating
  const calculateAverageRating = (reviews: Review[]): number => {
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  };
  
  // Edit a review
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };
  
  // Delete a review
  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!vendor) return;
            
            const updatedReviews = vendor.reviews.filter(
              review => review.id !== reviewId
            );
            
            setVendor({
              ...vendor,
              reviews: updatedReviews,
              rating: calculateAverageRating(updatedReviews)
            });
            
            setUserReviews(userReviews.filter(review => review.id !== reviewId));
          }
        }
      ]
    );
  };
  
  const renderReviewItem = (review: Review) => {
    const isUserReview = currentUser && review.userId === currentUser.uid;
    
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
          {new Date(review.date).toLocaleDateString()}
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

  return (
    <>
      <Stack.Screen options={{ 
        title: vendor?.name || "",
        headerBackTitle: 'Back',
        headerTintColor: Colors.primary,
      }} />
      
      <View style={styles.container}>
        <TouchableOpacity 
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 8,
          }}
          onPress={toggleFavorite}
        >
          <FontAwesome 
            name={isFavorite(vendor.id) ? "heart" : "heart-o"} 
            size={24} 
            color={isFavorite(vendor.id) ? Colors.secondary : "#888"} 
          />
        </TouchableOpacity>
        {/* Vendor Header */}
        <View style={styles.header}>
          <View style={styles.vendorImageContainer}>
            {vendor.photos.length > 0 ? (
              <Image 
                source={{ uri: vendor.photos[0] }} 
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
              {[1, 2, 3, 4, 5].map(star => (
                <FontAwesome
                  key={star}
                  name="star"
                  size={18}
                  color={star <= vendor.rating ? Colors.primary : '#ddd'}
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={styles.ratingText}> {vendor.rating.toFixed(1)}</Text>
            </View>

            <View style={styles.statusContainer}>
              {isVendorOpen(vendor) ? (
                <Text style={styles.openStatus}>Open Now • {getTodayHours(vendor)}</Text>
              ) : (
                <Text style={styles.closedStatus}>Closed • Opens {getTodayHours(vendor)}</Text>
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
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
              Menu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.tabContent}>
          {/* Menu Tab */}
          {activeTab === 'menu' && (
            <>
              {vendor.menu.length > 0 ? (
                <FlatList
                  data={vendor.menu}
                  renderItem={renderMenuItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text>No menu items available.</Text>
                </View>
              )}
            </>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About</Text>
                <Text style={styles.infoText}>{vendor.description}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Hours</Text>
                {renderDay('Monday', vendor.operatingHours.monday)}
                {renderDay('Tuesday', vendor.operatingHours.tuesday)}
                {renderDay('Wednesday', vendor.operatingHours.wednesday)}
                {renderDay('Thursday', vendor.operatingHours.thursday)}
                {renderDay('Friday', vendor.operatingHours.friday)}
                {renderDay('Saturday', vendor.operatingHours.saturday)}
                {renderDay('Sunday', vendor.operatingHours.sunday)}
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Contact</Text>
                {vendor.contactInfo.phone && (
                  <TouchableOpacity style={styles.contactItem} onPress={callVendor}>
                    <FontAwesome name="phone" size={16} color="#666" style={styles.contactIcon} />
                    <Text style={styles.contactText}>{vendor.contactInfo.phone}</Text>
                  </TouchableOpacity>
                )}
                
                {vendor.contactInfo.website && (
                  <TouchableOpacity style={styles.contactItem} onPress={openWebsite}>
                    <FontAwesome name="globe" size={16} color="#666" style={styles.contactIcon} />
                    <Text style={styles.contactText}>{vendor.contactInfo.website}</Text>
                  </TouchableOpacity>
                )}
                
                {vendor.contactInfo.instagram && (
                  <TouchableOpacity style={styles.contactItem} onPress={openInstagram}>
                    <FontAwesome name="instagram" size={16} color="#666" style={styles.contactIcon} />
                    <Text style={styles.contactText}>{vendor.contactInfo.instagram}</Text>
                  </TouchableOpacity>
                )}
                
              </View>
            </View>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <>
              <View style={styles.reviewsSummary}>
                <Text style={styles.ratingLarge}>{vendor.rating.toFixed(1)}</Text>
                <View style={styles.ratingStarsLarge}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <FontAwesome
                      key={star}
                      name="star"
                      size={24}
                      color={star <= vendor.rating ? Colors.primary : '#ddd'}
                      style={{ marginRight: 4 }}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCount}>
                  Based on {vendor.reviews.length} {vendor.reviews.length === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
              
              {/* Display all reviews */}
              {vendor.reviews.map(review => renderReviewItem(review))}
              
              {vendor.reviews.length === 0 && (
                <View style={styles.emptyState}>
                  <Text>No reviews yet. Be the first to review!</Text>
                </View>
              )}
              
              {/* Add or edit review button */}
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
                  onPress={() => Alert.alert('Sign In Required', 'Please sign in to leave a review')}
                >
                  <Text style={styles.writeReviewText}>Log in to Review</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
      <ReviewModal
        visible={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(null);
        }}
        onSubmit={handleReviewSubmit}
        initialRating={editingReview ? editingReview.rating : 0}
        initialComment={editingReview ? editingReview.comment : ''}
        isEditing={!!editingReview}
      />
    </>
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
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    flex: 1,
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flex: 1,
    marginRight: 10,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingBottom: 20,
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
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
});
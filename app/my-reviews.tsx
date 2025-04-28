import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { db, auth } from '../config/firebaseConfig';
import { collectionGroup, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import Colors from '../constants/colors';
import { Review } from '../models/Vendor'; 


interface UserReview extends Review {
    vendorName: string;
    vendorId: string; // Keep vendorId for navigation
}

export default function MyReviewsScreen() {
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const currentUser = auth.currentUser;

    const fetchMyReviews = useCallback(async () => {
        if (!currentUser) {
            setError("You must be logged in to see your reviews.");
            setIsLoading(false);
            setRefreshing(false);
            return;
        }
        setError(null);

        try {
            const reviewsQuery = query(
                collectionGroup(db, 'reviews'), // Query the 'reviews' collection group
                where('userId', '==', currentUser.uid), // Filter by current user's ID
                orderBy('date', 'desc') // Order by date descending
            );

            const querySnapshot = await getDocs(reviewsQuery);
            const fetchedReviews: UserReview[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Get vendorId from the document path reference
                const vendorId = doc.ref.parent.parent?.id || 'unknown_vendor';

                const reviewDate = data.date instanceof Timestamp
                  ? data.date.toDate().toISOString()
                  : new Date().toISOString();

                fetchedReviews.push({
                    id: doc.id,
                    userId: data.userId,
                    userName: data.userName || 'You', // Already know it's the user
                    rating: data.rating || 0,
                    comment: data.comment || '',
                    date: reviewDate,
                    vendorName: data.vendorName || 'Unknown Vendor', // Assumes vendorName is stored
                    vendorId: vendorId,
                });
            });
            setReviews(fetchedReviews);
        } catch (err) {
            console.error("Error fetching user reviews:", err);
            setError("Could not load your reviews.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    // Fetch reviews when the screen focuses
    useFocusEffect(
       useCallback(() => {
          setIsLoading(true);
          fetchMyReviews();
       }, [fetchMyReviews])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMyReviews();
    }, [fetchMyReviews]);

    const navigateToVendor = (vendorId: string) => {
        router.push(`/vendor-details?id=${vendorId}`);
    };

    const renderReviewItem = ({ item }: { item: UserReview }) => (
      <TouchableOpacity
        style={styles.reviewItem}
        onPress={() => navigateToVendor(item.vendorId)}
      >
        <View style={styles.reviewHeader}>
          <Text style={styles.vendorNameText}>{item.vendorName}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name="star"
                size={14}
                color={star <= item.rating ? Colors.primary : "#ddd"}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {(() => {
            let displayDate: Date | null = null;
            try {
              if (item.date instanceof Timestamp) {
                displayDate = item.date.toDate();
              } else if (typeof item.date === "string") {
                displayDate = new Date(item.date);
              }
            } catch (e) {
              console.error("Error parsing my-reviews date:", e);
            }
            return displayDate
              ? displayDate.toLocaleDateString()
              : "Date unavailable";
          })()}
        </Text>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </TouchableOpacity>
    );

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['right', 'left']}>
             <Stack.Screen options={{ title: "My Reviews", headerShown: true }} />
            <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    reviewItem: {
        backgroundColor: Colors.secondary.white,
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    vendorNameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1, // Allow wrapping
        marginRight: 10,
    },
    ratingContainer: {
         flexDirection: 'row',
    },
    reviewDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    reviewComment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 18,
    },
    errorText: {
        fontSize: 16,
        color: Colors.secondary.red || 'red',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    }
});
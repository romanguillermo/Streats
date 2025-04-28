import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../config/firebaseConfig';
import { collection, doc, getDoc, query, where, getDocs, documentId } from 'firebase/firestore';
import Colors from '../constants/colors';
import { Vendor } from '../models/Vendor';
import { useFavorites } from '../context/FavoritesContext';
import VendorListItem from '../components/VendorListItem';

export default function FavoritesScreen() {
    const router = useRouter();
    const { favorites: favoriteIds, isFavorite, addFavorite, removeFavorite, isLoading: favoritesLoading } = useFavorites();
    const [favoriteVendors, setFavoriteVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFavoriteVendors = useCallback(async () => {
        if (favoritesLoading || favoriteIds.length === 0) {
            setFavoriteVendors([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch in batches of 30 if needed
            const MAX_IN_QUERY_SIZE = 30; // Firestore limit
            const fetchedVendors: Vendor[] = [];
            const vendorCollectionRef = collection(db, "vendors");

            for (let i = 0; i < favoriteIds.length; i += MAX_IN_QUERY_SIZE) {
                const batchIds = favoriteIds.slice(i, i + MAX_IN_QUERY_SIZE);

                if (batchIds.length > 0) {
                    const q = query(vendorCollectionRef, where(documentId(), 'in', batchIds));
                    const querySnapshot = await getDocs(q);

                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                         fetchedVendors.push({
                            id: docSnap.id,
                            name: data.name || "Unnamed Vendor",
                            description: data.description || "",
                            cuisineType: data.cuisineType || "Unknown",
                            location: {
                              latitude: data.location?.latitude || 0,
                              longitude: data.location?.longitude || 0,
                            },
                            menu: data.menu || {},
                            photos: data.photos || [],
                            rating: data.rating !== undefined ? data.rating : null,
                            reviews: [], // Reviews not needed for list item, fetch on details screen
                            reviewCount: data.reviewCount || 0,
                            operatingHours: data.operatingHours || {},
                            contactInfo: data.contactInfo || {},
                          });
                    });
                }
            }

             // Todo: Sort fetched vendors based on original favoriteIds order or name, 
             setFavoriteVendors(fetchedVendors);

        } catch (err) {
            console.error("Error fetching favorite vendors:", err);
            setError("Could not load your favorite vendors.");
        } finally {
            setIsLoading(false);
        }
    }, [favoriteIds, favoritesLoading]);

    // Fetch when the screen focuses or favorite IDs change
     useFocusEffect(
         useCallback(() => {
             fetchFavoriteVendors();
         }, [fetchFavoriteVendors])
     );

    const handleVendorPress = (vendorId: string) => {
        router.push(`/vendor-details?id=${vendorId}`);
    };

    const toggleFavorite = (vendorId: string) => {
        if (isFavorite(vendorId)) {
            removeFavorite(vendorId);
            // remove from the displayed list as well
            setFavoriteVendors(prev => prev.filter(v => v.id !== vendorId));
        } else {
            addFavorite(vendorId);
        }
    };

    const renderVendorItem = ({ item }: { item: Vendor }) => {
        return (
            <VendorListItem
                vendor={item}
                onPress={handleVendorPress}
                isFavorite={true} 
                onToggleFavorite={toggleFavorite}
            />
        );
    };

    if (isLoading || favoritesLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['right', 'left']}>
             <Stack.Screen options={{ title: "Favorite Vendors", headerShown: true }} />
            <FlatList
                data={favoriteVendors}
                renderItem={renderVendorItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <FontAwesome name="heart-o" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>You haven't added any favorites yet.</Text>
                        <TouchableOpacity onPress={() => router.push('/tabs/vendors')}>
                            <Text style={styles.browseText}>Browse Vendors</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={styles.listContainer}
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
        marginTop: 50,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    errorText: {
        fontSize: 16,
        color: Colors.secondary.red || 'red',
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    browseText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: 'bold',
    }
});
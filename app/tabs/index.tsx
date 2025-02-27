import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';
import { sampleVendors, Vendor, isVendorOpen, getTodayHours } from '../../models/Vendor';

interface FilterOptions {
  onlyOpen: boolean;
  cuisineTypes: string[];
  minRating: number;
}

export default function MapScreen() {
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [filteredVendors, setFilteredVendors] = useState(sampleVendors);
  const [filters, setFilters] = useState<FilterOptions>({
    onlyOpen: false,
    cuisineTypes: [],
    minRating: 0
  });
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Get all unique cuisine types from vendors
  const allCuisineTypes = [...new Set(sampleVendors.map(vendor => vendor.cuisineType))];

  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          // Set default LA
          setMapRegion({
            latitude: 34.0522,
            longitude: -118.2437,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.error("Error getting location:", error);
         // Set default location if there's an error
        setMapRegion({
            latitude: 34.0522,
            longitude: -118.2437,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    // Apply filters and search query to the vendors list
    let result = sampleVendors;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(vendor => 
        vendor.name.toLowerCase().includes(query) || 
        vendor.cuisineType.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.menu.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    // Apply filters
    if (filters.onlyOpen) {
      result = result.filter(vendor => isVendorOpen(vendor));
    }
    
    if (filters.cuisineTypes.length > 0) {
      result = result.filter(vendor => 
        filters.cuisineTypes.includes(vendor.cuisineType)
      );
    }
    
    if (filters.minRating > 0) {
      result = result.filter(vendor => vendor.rating >= filters.minRating);
    }
    
    setFilteredVendors(result);
  }, [searchQuery, filters]);

  const toggleCuisineFilter = (cuisine: string) => {
    setFilters(prevFilters => {
      const currentCuisines = [...prevFilters.cuisineTypes];
      
      if (currentCuisines.includes(cuisine)) {
        // Remove the cuisine
        return {
          ...prevFilters,
          cuisineTypes: currentCuisines.filter(c => c !== cuisine)
        };
      } else {
        // Add the cuisine
        return {
          ...prevFilters,
          cuisineTypes: [...currentCuisines, cuisine]
        };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      onlyOpen: false,
      cuisineTypes: [],
      minRating: 0
    });
  };

  const navigateToVendor = (vendor: Vendor) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: vendor.location.latitude,
        longitude: vendor.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      setSelectedVendor(vendor);
    }
  };

  const recenterMap = () => {
    if (mapRef.current && mapRegion) {
    mapRef.current.animateToRegion({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
    }, 500); // 500ms animation duration
    }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mapRegion) {
    return null; // Or some error message/fallback UI
  }

  // Check if we're on the web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text>Map is not supported on the web.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={16} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food trucks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={16} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setFilterModalVisible(true)}
        >
          <FontAwesome 
            name="filter" 
            size={20} 
            color={filters.onlyOpen || filters.cuisineTypes.length > 0 || filters.minRating > 0 
              ? Colors.primary 
              : '#888'} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Results Count */}
      {(searchQuery || filters.onlyOpen || filters.cuisineTypes.length > 0 || filters.minRating > 0) && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} found
          </Text>
          {(filters.onlyOpen || filters.cuisineTypes.length > 0 || filters.minRating > 0) && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
      >
        {/* User Location */}
        <Marker
          coordinate={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude
          }}
          title="Your Location"
          pinColor={Colors.secondary}
        >
          <FontAwesome name="map-marker" size={36} color={Colors.secondary} />
        </Marker>

        {/* Vendor Markers */}
        {filteredVendors.map(vendor => (
          <Marker
            key={vendor.id}
            coordinate={{
              latitude: vendor.location.latitude,
              longitude: vendor.location.longitude
            }}
            title={vendor.name}
            description={vendor.cuisineType}
            onPress={() => setSelectedVendor(vendor)}
          >
            <View style={styles.customMarker}>
              <FontAwesome 
                name="cutlery" 
                size={16} 
                color="white" 
              />
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{vendor.name}</Text>
                <Text style={styles.calloutSubtitle}>{vendor.cuisineType}</Text>
                <View style={styles.calloutRating}>
                  <FontAwesome name="star" size={14} color={Colors.primary} />
                  <Text style={styles.calloutRatingText}> {vendor.rating.toFixed(1)}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Recenter Button */}
      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <FontAwesome name="location-arrow" size={24} color="white" />
      </TouchableOpacity>

      {/* Selected Vendor Card */}
      {selectedVendor && (
        <View style={styles.vendorCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedVendor(null)}
          >
            <FontAwesome name="times" size={20} color="#888" />
          </TouchableOpacity>
          
          <Text style={styles.vendorName}>{selectedVendor.name}</Text>
          <Text style={styles.vendorCuisine}>{selectedVendor.cuisineType}</Text>
          
          <View style={styles.vendorRatingContainer}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <FontAwesome 
                  key={star}
                  name="star" 
                  size={16} 
                  color={star <= selectedVendor.rating ? Colors.primary : '#ddd'} 
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.vendorRating}>{selectedVendor.rating.toFixed(1)}</Text>
          </View>
          
          <Text style={styles.vendorDescription}>{selectedVendor.description}</Text>
          
          <View style={styles.vendorHours}>
            <FontAwesome name="clock-o" size={16} color="#666" style={{ marginRight: 8 }} />
            <Text>
              {isVendorOpen(selectedVendor) 
                ? <Text style={{ color: 'green', fontWeight: 'bold' }}>Open Now: </Text>
                : <Text style={{ color: 'red', fontWeight: 'bold' }}>Closed: </Text>
              }
              {getTodayHours(selectedVendor)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.vendorDetailsButton} onPress={() => router.push(`/vendor-details?id=${selectedVendor.id}`)}>
            <Text style={styles.vendorDetailsText}>View Menu & Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Vendors</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Open Now Filter */}
            <TouchableOpacity 
              style={styles.filterOption}
              onPress={() => setFilters({...filters, onlyOpen: !filters.onlyOpen})}
            >
              <Text style={styles.filterText}>Open Now</Text>
              <View style={[
                styles.checkbox, 
                filters.onlyOpen ? { backgroundColor: Colors.primary } : {}
              ]}>
                {filters.onlyOpen && <FontAwesome name="check" size={16} color="white" />}
              </View>
            </TouchableOpacity>

            {/* Rating Filter */}
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingFilterContainer}>
              {[0, 3, 3.5, 4, 4.5].map(rating => (
                <TouchableOpacity 
                  key={rating}
                  style={[
                    styles.ratingButton,
                    filters.minRating === rating ? { backgroundColor: Colors.primary } : {}
                  ]}
                  onPress={() => setFilters({...filters, minRating: rating})}
                >
                  <Text style={[
                    styles.ratingButtonText,
                    filters.minRating === rating ? { color: 'white' } : {}
                  ]}>
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cuisine Filter */}
            <Text style={styles.filterSectionTitle}>Cuisine Type</Text>
            <View style={styles.cuisineFilterContainer}>
              {allCuisineTypes.map(cuisine => (
                <TouchableOpacity 
                  key={cuisine}
                  style={[
                    styles.cuisineButton,
                    filters.cuisineTypes.includes(cuisine) 
                      ? { backgroundColor: Colors.primary, borderColor: Colors.primary } 
                      : {}
                  ]}
                  onPress={() => toggleCuisineFilter(cuisine)}
                >
                  <Text style={[
                    styles.cuisineButtonText,
                    filters.cuisineTypes.includes(cuisine) ? { color: 'white' } : {}
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vendors List (when search is active) */}
      {searchQuery && filteredVendors.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={filteredVendors}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultCard}
                onPress={() => {
                  navigateToVendor(item);
                  setSearchQuery(''); // Clear search when navigating
                }}
              >
                <Text style={styles.searchResultName}>{item.name}</Text>
                <Text style={styles.searchResultCuisine}>{item.cuisineType}</Text>
                <View style={styles.searchResultRating}>
                  <FontAwesome name="star" size={12} color={Colors.primary} />
                  <Text style={styles.searchResultRatingText}> {item.rating.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 10,
  },
  resultsText: {
    color: '#333',
    fontWeight: '500',
  },
  clearFiltersText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  calloutContainer: {
    width: 150,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  calloutSubtitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutRatingText: {
    fontSize: 12,
    color: '#333',
  },
  vendorCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vendorCuisine: {
    color: '#666',
    marginBottom: 5,
  },
  vendorRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 5,
  },
  vendorRating: {
    fontWeight: 'bold',
  },
  vendorDescription: {
    color: '#333',
    marginBottom: 10,
  },
  vendorHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  vendorDetailsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vendorDetailsText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingLeft: 15,
    zIndex: 1,
    height: 120,
  },
  searchResultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchResultName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultCuisine: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  searchResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultRatingText: {
    fontSize: 12,
    color: '#333',
  },
  // Filter Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  ratingFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  ratingButtonText: {
    fontSize: 14,
  },
  cuisineFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  cuisineButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  cuisineButtonText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginRight: 10,
  },
  clearButtonText: {
    color: '#666',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    borderRadius: 25,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
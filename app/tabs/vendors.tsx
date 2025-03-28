import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList,
  TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator
 } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';
import { sampleVendors, Vendor, isVendorOpen } from '../../models/Vendor';
import { useFavorites } from '../../context/FavoritesContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample data - will be replaced with real data from backend later
const SAMPLE_VENDORS = [
  { id: '1', name: 'Taco Truck', cuisine: 'Mexican', rating: 4.5 },
  { id: '2', name: 'Sushi Cart', cuisine: 'Japanese', rating: 4.7 },
  { id: '3', name: 'Burger Stand', cuisine: 'American', rating: 4.2 },
  { id: '4', name: 'Noodle House', cuisine: 'Chinese', rating: 4.6 },
  { id: '5', name: 'Smoothie Spot', cuisine: 'Health', rating: 4.4 },
];

export default function VendorsScreen() {
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVendors, setFilteredVendors] = useState(sampleVendors);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [onlyShowOpen, setOnlyShowOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cuisineTypes = [...new Set(sampleVendors.map(v => v.cuisineType))];

  useEffect(() => {
    setIsLoading(true);
    let result = [...sampleVendors];

    // Apply cuisine filter
    if (selectedCuisine) {
      result = result.filter(vendor => vendor.cuisineType === selectedCuisine);
    }
    // Filter by open status
    if (onlyShowOpen) {
      result = result.filter(vendor => isVendorOpen(vendor));
    }
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(vendor => 
        vendor.name.toLowerCase().includes(query) ||
        vendor.cuisineType.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query)
      );
    }
    setFilteredVendors(result);
    setIsLoading(false);
  }, [searchQuery, selectedCuisine, onlyShowOpen]);

  const handleVendorPress = (vendorId: string) => {
    // Make sure the vendor exists before navigating
  const vendor = sampleVendors.find(v => v.id === vendorId);
  if (vendor) {
    router.push(`/vendor-details?id=${vendorId}`);
  } else {
    console.error("Vendor not found:", vendorId);
  }
  };

  const toggleFavorite = (vendorId: string) => {
    if (isFavorite(vendorId)) {
      removeFavorite(vendorId);
    } else {
      addFavorite(vendorId);
    }
  };

  const clearFilters = () => {
    setSelectedCuisine(null);
    setOnlyShowOpen(false);
  }

  const renderVendorItem = ({ item }: { item: Vendor }) => {
    const isOpen = isVendorOpen(item);
    
    return (
      <TouchableOpacity 
        style={styles.vendorCard}
        onPress={() => handleVendorPress(item.id)}
      >
        <View style={styles.vendorImageContainer}>
          {item.photos.length > 0 ? (
            <Image source={{ uri: item.photos[0] }} style={styles.vendorImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="cutlery" size={30} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <Text style={styles.vendorName}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              style={styles.favoriteButton}
            >
              <FontAwesome 
                name={isFavorite(item.id) ? "heart" : "heart-o"} 
                size={22} 
                color={isFavorite(item.id) ? Colors.primary : "#888"} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.cuisineType}>{item.cuisineType}</Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <FontAwesome
                key={star}
                name="star"
                size={14}
                color={star <= item.rating ? Colors.primary : '#ddd'}
                style={{ marginRight: 2 }}
              />
            ))}
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
          
          <Text 
            style={[
              styles.statusLabel, 
              isOpen ? styles.openLabel : styles.closedLabel
            ]}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Discover Vendors</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search for vendors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={16} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Cuisine Type Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[
              styles.filterChip,
              onlyShowOpen && styles.activeFilterChip
            ]}
            onPress={() => setOnlyShowOpen(!onlyShowOpen)}
          >
            <Text 
              style={[
                styles.filterText,
                onlyShowOpen && styles.activeFilterText
              ]}
            >
              Open Now
            </Text>
          </TouchableOpacity>
          
          {cuisineTypes.map(cuisine => (
            <TouchableOpacity 
              key={cuisine}
              style={[
                styles.filterChip,
                selectedCuisine === cuisine && styles.activeFilterChip
              ]}
              onPress={() => {
                if (selectedCuisine === cuisine) {
                  setSelectedCuisine(null);
                } else {
                  setSelectedCuisine(cuisine);
                }
              }}
            >
              <Text 
                style={[
                  styles.filterText,
                  selectedCuisine === cuisine && styles.activeFilterText
                ]}
              >
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {(selectedCuisine || onlyShowOpen) && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} found
        </Text>
      </View>
      
      {/* Vendors List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredVendors.length > 0 ? (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.vendorsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome name="search" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>No vendors found</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsText: {
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorsList: {
    paddingBottom: 20,
  },
  vendorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vendorImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginBottom: 4,
  },
  favoriteButton: {
    padding: 2,
  },
  cuisineType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  openLabel: {
    backgroundColor: '#e6f7ed',
    color: '#00a651',
  },
  closedLabel: {
    backgroundColor: '#ffeeee',
    color: '#d32f2f',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  }
});
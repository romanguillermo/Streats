import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList,
  TextInput, TouchableOpacity, ScrollView, ActivityIndicator
 } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';
import { sampleVendors, Vendor, isVendorOpen } from '../../models/Vendor';
import { useFavorites } from '../../context/FavoritesContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import VendorListItem from '../../components/VendorListItem';

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
    return (
      <VendorListItem
        vendor={item}
        onPress={handleVendorPress}
        isFavorite={isFavorite(item.id)} 
        onToggleFavorite={toggleFavorite}
      />
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
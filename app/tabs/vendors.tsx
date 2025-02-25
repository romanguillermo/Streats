// File: app/tabs/vendors.tsx

import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import Colors from '../../constants/colors';

// Sample data - will be replaced with real data from backend later
const SAMPLE_VENDORS = [
  { id: '1', name: 'Taco Truck', cuisine: 'Mexican', rating: 4.5 },
  { id: '2', name: 'Sushi Cart', cuisine: 'Japanese', rating: 4.7 },
  { id: '3', name: 'Burger Stand', cuisine: 'American', rating: 4.2 },
  { id: '4', name: 'Noodle House', cuisine: 'Chinese', rating: 4.6 },
  { id: '5', name: 'Smoothie Spot', cuisine: 'Health', rating: 4.4 },
];

export default function VendorsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Food Vendors</Text>
      
      {/* Search bar placeholder */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>Search vendors...</Text>
      </View>
      
      <FlatList
        data={SAMPLE_VENDORS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.vendorCard}>
            <Text style={styles.vendorName}>{item.name}</Text>
            <View style={styles.vendorDetails}>
              <Text style={styles.vendorCuisine}>{item.cuisine}</Text>
              <Text style={styles.vendorRating}>★ {item.rating}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingTop: 60, // Add space at top since we're hiding the header
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  searchBar: {
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    padding: 12,
    marginBottom: 16,
  },
  searchText: {
    color: '#888',
  },
  vendorCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  vendorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vendorCuisine: {
    color: Colors.text,
  },
  vendorRating: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
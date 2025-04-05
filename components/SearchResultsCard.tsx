import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Vendor } from '../models/Vendor'; 
import Colors from '../constants/colors';

interface SearchResultCardProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void; 
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ vendor, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.searchResultCard}
      onPress={() => onPress(vendor)}
    >
      <Text style={styles.searchResultName}>{vendor.name}</Text>
      <Text style={styles.searchResultCuisine}>{vendor.cuisineType}</Text>
      <View style={styles.searchResultRating}>
        <FontAwesome name="star" size={12} color={Colors.primary} />
        <Text style={styles.searchResultRatingText}>
          {" "}
          {vendor.rating.toFixed(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchResultCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchResultName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultCuisine: {
    color: "#666",
    fontSize: 12,
    marginBottom: 4,
  },
  searchResultRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultRatingText: {
    fontSize: 12,
    color: "#333",
  },
});

export default React.memo(SearchResultCard);
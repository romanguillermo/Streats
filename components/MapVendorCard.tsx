import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Vendor, isVendorOpen, getTodayHours } from "../models/Vendor";
import Colors from "../constants/colors";

interface MapVendorCardProps {
  vendor: Vendor;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onNavigateToDetails: () => void;
}

const MapVendorCard: React.FC<MapVendorCardProps> = ({
  vendor,
  isFavorite,
  onClose,
  onToggleFavorite,
  onNavigateToDetails,
}) => {
  const isOpen = isVendorOpen(vendor);
  const hoursToday = getTodayHours(vendor);

  return (
    <View style={styles.vendorCard}>
      <View style={styles.vendorCardHeader}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <FontAwesome name="times" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
        >
          <FontAwesome
            name={isFavorite ? "heart" : "heart-o"}
            size={24}
            color={isFavorite ? Colors.primary : "#888"}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.vendorName}>{vendor.name}</Text>
      <Text style={styles.vendorCuisine}>{vendor.cuisineType}</Text>

      <View style={styles.vendorRatingContainer}>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesome
              key={star}
              name="star"
              size={16}
              color={star <= vendor.rating ? Colors.primary : "#ddd"}
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
        <Text style={styles.vendorRating}>
          {vendor.rating.toFixed(1)}
        </Text>
      </View>

      <Text style={styles.vendorDescription}>{vendor.description}</Text>

      <View style={styles.vendorHours}>
        <FontAwesome
          name="clock-o"
          size={16}
          color="#666"
          style={{ marginRight: 8 }}
        />
        <Text>
          {isOpen ? (
            <Text style={{ color: "green", fontWeight: "bold" }}>
              Open Now:{" "}
            </Text>
          ) : (
            <Text style={{ color: "red", fontWeight: "bold" }}>Closed: </Text>
          )}
          {hoursToday}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.vendorDetailsButton}
        onPress={onNavigateToDetails}
      >
        <Text style={styles.vendorDetailsText}>View Menu & Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  vendorCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vendorCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  favoriteButton: {
    padding: 5,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  vendorCuisine: {
    color: "#666",
    marginBottom: 5,
  },
  vendorRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingStars: {
    flexDirection: "row",
    marginRight: 5,
  },
  vendorRating: {
    fontWeight: "bold",
  },
  vendorDescription: {
    color: "#333",
    marginBottom: 10,
  },
  vendorHours: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  vendorDetailsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  vendorDetailsText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default MapVendorCard;

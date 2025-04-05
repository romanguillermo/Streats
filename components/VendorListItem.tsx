import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Vendor, isVendorOpen } from '../models/Vendor';
import Colors from '../constants/colors';

interface VendorListItemProps {
  vendor: Vendor; // vendor data object
  onPress: (vendorId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (vendorId: string) => void; 
}

const VendorListItem: React.FC<VendorListItemProps> = ({
  vendor,
  onPress,
  isFavorite,
  onToggleFavorite,
}) => {
  const isOpen = isVendorOpen(vendor);

  return (
    <TouchableOpacity 
      style={styles.vendorCard}
      onPress={() => onPress(vendor.id)}
    >
        <View style={styles.vendorImageContainer}>
        {vendor.photos.length > 0 ? (
            <Image source={{ uri: vendor.photos[0] }} style={styles.vendorImage} />
        ) : (
            <View style={styles.placeholderImage}>
            <FontAwesome name="cutlery" size={30} color="#ccc" />
            </View>
        )}
        </View>
          
        <View style={styles.vendorInfo}>
        <View style={styles.vendorHeader}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <TouchableOpacity
            onPress={() => onToggleFavorite(vendor.id)}
            style={styles.favoriteButton}
            >
            <FontAwesome 
                name={isFavorite ? "heart" : "heart-o"} 
                size={22} 
                color={isFavorite ? Colors.primary : "#888"} 
            />
            </TouchableOpacity>
        </View>
            
        <Text style={styles.cuisineType}>{vendor.cuisineType}</Text>
            
        <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
            <FontAwesome
              key={star}
              name="star"
              size={14}
              color={star <= vendor.rating ? Colors.primary : '#ddd'}
              style={{ marginRight: 2 }}
            />
            ))}
            <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
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

const styles = StyleSheet.create({
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
});

export default React.memo(VendorListItem);
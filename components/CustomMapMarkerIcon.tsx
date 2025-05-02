import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // For fallback
import Colors from '../constants/colors';
import TacoIcon from './icons/Taco.js';
import EloteIcon from './icons/Corn.js'; 

interface CustomMapMarkerIconProps {
  category?: string; 
  size?: number; 
  color?: string; 
}

const ICON_SIZE = 26;

const CustomMapMarkerIcon: React.FC<CustomMapMarkerIconProps> = ({
  category,
  size = ICON_SIZE,
  color = Colors.primary
}) => {

  const renderIcon = () => {
    switch (category) {
      case 'Taco Truck':
      case 'Tacos': // Add variations
        return <TacoIcon width={size} height={size} fill={color} />;
      case 'Elotero':
      case 'Elote Stand': // Add variations
        return <EloteIcon width={size+8} height={size} fill={color} />;
      // Add more categories (Fruit Cart, Hot Dog, etc.)
      // case 'Fruit Cart':
      //   return <FruitIcon width={size} height={size} fill={color} />;
      default:
        return <FontAwesome style={styles.defaultMarker} name="cutlery" size={14} color="white" />;
    }
  };

  return (
    <View style={styles.markerContainer}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    /*backgroundColor: Colors.primary,
     padding: 4,
     borderRadius: 20,
     borderColor: 'white',
     borderWidth: 2, */
  },
  defaultMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default CustomMapMarkerIcon;
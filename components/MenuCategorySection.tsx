import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { MenuCategory, MenuItem } from '../models/Vendor'; 

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuCategorySectionProps {
  categoryName: string;
  categoryData: MenuCategory;
  startExpanded?: boolean; 
}

const MenuCategorySection: React.FC<MenuCategorySectionProps> = ({
  categoryName,
  categoryData,
  startExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  useEffect(() => {
    setIsExpanded(startExpanded); 
  }, [startExpanded]);

  const toggleExpansion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  // Helper to render price
  const renderPrice = (item: MenuItem) => {
    if (item.sizes && item.sizes.length > 0) {
      return (
        <View style={styles.sizesContainer}>
          {item.sizes.map((s, index) => (
             <Text key={index} style={styles.sizePriceText}>
                {s.size}: ${s.price.toFixed(2)}
             </Text>
          ))}
        </View>
      );
    } else if (item.price !== undefined) {
      return <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>;
    }
    return null; // No price
  };

  // Helper to render category-specific options
  const renderCategoryOptions = () => {
    if (!categoryData.options || Object.keys(categoryData.options).length === 0) {
        return null;
    }
    return (
        <View style={styles.categoryOptionsContainer}>
            {Object.entries(categoryData.options).map(([groupName, choices]) => (
                <View key={groupName} style={styles.optionGroup}>
                <Text style={styles.optionGroupName}>{groupName}:</Text>
                {choices.map((choice, index) => (
                     <Text key={index} style={styles.optionChoiceItem}> • {choice}</Text> // Add a bullet point
                ))}
            </View>
             ))}
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpansion} style={styles.header}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.text} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Render category options (Protein choices...) if they exist */}
          {renderCategoryOptions()}

          {/* Render Menu Items */}
          {categoryData.items.map(item => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && <Text style={styles.menuItemDescription}>{item.description}</Text>}
              </View>
              {renderPrice(item)}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
    },
    categoryName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        paddingHorizontal: 15,
        paddingTop: 5,
        paddingBottom: 15,
    },
    // Category Options
    categoryOptionsContainer: {
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionGroup: {
        marginBottom: 8,
    },
    optionGroupName: {
        fontSize: 15,
        fontWeight: '600',
        marginRight: 4,
        color: Colors.text,
    },
    optionChoiceItem: {
        fontSize: 15,
        color: '#444',
        marginLeft: 10,
        marginBottom: 2,
        lineHeight: 20,
    },
    // Menu Items
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'flex-start',
    },
    menuItemInfo: {
        flex: 1,
        marginRight: 10,
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 3,
    },
    menuItemDescription: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    menuItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    sizesContainer: {
        alignItems: 'flex-end', // Align size prices to right
    },
    sizePriceText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
});

export default MenuCategorySection;
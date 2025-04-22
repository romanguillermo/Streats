import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuOptionsDisplayProps {
  options: { [groupName: string]: string[] };
}

const MenuOptionsDisplay: React.FC<MenuOptionsDisplayProps> = ({ options }) => {
  const [expandedGroups, setExpandedGroups] = React.useState<{ [key: string]: boolean }>({});

  // Initialize all groups as expanded by default, or collapsed based on preference
  React.useEffect(() => {
    const initialExpansionState: { [key: string]: boolean } = {};
    Object.keys(options).forEach(groupName => {
      initialExpansionState[groupName] = true; // Start expanded
    });
    setExpandedGroups(initialExpansionState);
  }, [options]);


  const toggleGroupExpansion = (groupName: string) => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  if (!options || Object.keys(options).length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Object.entries(options).map(([groupName, choices]) => {
        const isExpanded = expandedGroups[groupName];
        return (
          <View key={groupName} style={styles.groupContainer}>
            <TouchableOpacity onPress={() => toggleGroupExpansion(groupName)} style={styles.groupHeader}>
              <Text style={styles.groupName}>{groupName}</Text>
              <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.text} />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.choicesContainer}>
                {choices.map((choice, index) => (
                  <View key={index} style={styles.choiceChip}>
                     <Text style={styles.choiceText}>{choice}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  groupContainer: {
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    paddingTop: 8,
    paddingHorizontal: 5, 
  },
  choiceChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  choiceText: {
    fontSize: 14,
    color: '#444',
  },
});

export default MenuOptionsDisplay;
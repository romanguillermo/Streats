import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView,
  Alert,
  Linking
} from 'react-native';
import { Stack, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/colors';

export default function SettingsScreen() {
  // App settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Group settings into sections for better organization
  const appSettings = [
    {
      title: 'Enable Notifications',
      icon: 'bell',
      isSwitch: true,
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
      description: 'Get notified when favorite vendors are nearby'
    },
    {
      title: 'Dark Mode',
      icon: 'moon-o',
      isSwitch: true,
      value: darkModeEnabled,
      onValueChange: setDarkModeEnabled,
      description: 'Switch to dark theme (coming soon)'
    }
  ];
  
  const supportOptions = [
    {
      title: 'Contact Support',
      icon: 'envelope',
      onPress: () => Linking.openURL('mailto:support@streats.app'),
    },
    {
      title: 'Report a Bug',
      icon: 'bug',
      onPress: () => Linking.openURL('mailto:bugs@streats.app'),
    }
  ];
  
  const about = [
    {
      title: 'About Streats',
      icon: 'info-circle',
      onPress: () => Alert.alert('About', 'Streats v1.0.0\nA street food finder app for LA'),
    }
  ];
  
  // Function to render a section of settings
  const renderSettingSection = (title: string, items: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.settingItem}
          onPress={item.isSwitch ? undefined : item.onPress}
          disabled={item.isSwitch}
        >
          <View style={styles.settingItemLeft}>
            <FontAwesome name={item.icon} size={22} color={Colors.primary} style={styles.itemIcon} />
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
            </View>
          </View>
          
          {item.isSwitch ? (
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#d3d3d3', true: Colors.primary }}
              thumbColor={item.value ? '#fff' : '#f4f3f4'}
            />
          ) : (
            <FontAwesome name="chevron-right" size={16} color="#888" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
  
  return (
      <View style={styles.container} >
        <ScrollView style={styles.scrollContainer}>
          {renderSettingSection('App Settings', appSettings)}
          {renderSettingSection('Support', supportOptions)}
          {renderSettingSection('About', about)}
          
          <Text style={styles.versionText}>Streats v1.0</Text>
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 12,
    marginTop: 12,
    color: Colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
    width: 22,
  },
  itemTitle: {
    fontSize: 16,
    color: Colors.text,
  },
  itemDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginBottom: 24,
    marginTop: 16
  }
});
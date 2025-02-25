// File: app/tabs/profile.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get current user details
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName);
      setUserEmail(user.email);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Profile</Text>
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user-circle" size={80} color={Colors.primary} />
        </View>
        
        <Text style={styles.userName}>{userName || 'User'}</Text>
        <Text style={styles.userEmail}>{userEmail || 'email@example.com'}</Text>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="heart" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>Favorite Vendors</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="star" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>My Reviews</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="cog" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>Settings</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="question-circle" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
    color: Colors.text,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  menuSection: {
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: Colors.text,
  },
  signOutButton: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
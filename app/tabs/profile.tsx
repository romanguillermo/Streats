import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { navigate } from 'expo-router/build/global-state/routing';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditProfileModal from '../../components/EditProfileModal';

export default function ProfileScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName);
      setUserEmail(user.email);
    }
  }, []);

  const handleSaveProfile = async (newName: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You seem to be logged out.');
      throw new Error("User not found"); // Throw error to be caught in modal
    }
    if (newName.trim() === user.displayName) {
       setIsEditModalVisible(false); // Close if name didn't change
       return; // Exit early
    }

    try {
      await updateProfile(user, {
        displayName: newName.trim(),
      });
      setUserName(newName.trim()); // Update local state on success
      setIsEditModalVisible(false); // Close modal on success
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      throw error; // Re-throw error so modal knows it failed
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      console.error('Sign out error:', error);
    }
  };

  const navigateToFavorites = () => {
    router.push('/favorites');
  };

  const navigateToMyReviews = () => {
    router.push('/my-reviews'); 
};

  const navigateToSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>My Profile</Text>
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user-circle" size={80} color={Colors.primary} />
        </View>
        
        <Text style={styles.userName}>{userName || 'User'}</Text>
        <Text style={styles.userEmail}>{userEmail || 'email@example.com'}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={navigateToFavorites}>
          <FontAwesome name="heart" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>My Favorite Vendors</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={navigateToMyReviews}>
          <FontAwesome name="star" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>My Reviews</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
          <FontAwesome name="cog" size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>Settings</Text>
          <FontAwesome name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveProfile}
        initialName={userName || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
  favoritesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  favoritesList: {
    marginBottom: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  favoriteCuisine: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  menuSection: {
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
    marginTop: 'auto',
    marginBottom: 16,
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
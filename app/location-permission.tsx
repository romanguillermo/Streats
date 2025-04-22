import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Colors from '../constants/colors'

export default function LocationPermission() {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if the user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is not authenticated, redirect to auth screen
        router.replace('/auth/auth');
      }
    });

    // Check if the user already granted permissions
    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
        
        if (status === 'granted') {
          router.replace('/tabs');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkPermission();
    
    return () => unsubscribe();
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Navigate to the main map screen
        router.replace('/tabs');
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find nearby food vendors. Please enable it in your settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'An error occurred while requesting location permission.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.message}>Checking permissions...</Text>
      </View>
    );
  }

  if (permissionStatus === 'granted') {
    return null; // Or a loading indicator if you prefer
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Access Needed</Text>
      <Text style={styles.message}>
        To provide you with the best local street food options and reviews, we
        need access to your location. This helps us show vendors near you.
      </Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={requestPermission}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Allow Location Access'}
        </Text>
      </TouchableOpacity>

      {/* Skip Feature */}
      <TouchableOpacity
        onPress={() => {router.replace('/tabs')}}
      >
          <Text style={styles.skipText}>
            Skip
          </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  skipText: {
    color: '#0a7ea4',
    textAlign: 'center',
    marginBottom: 10,
  },
});
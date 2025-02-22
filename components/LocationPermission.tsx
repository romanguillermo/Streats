import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import Colors from '../constants/colors'

export default function LocationPermission() {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
        //Check if the user already granted permissions, and if so re-direct
        const checkPermission = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionStatus(status)
            if (status === 'granted') {
                router.replace('/');
            }
        }
        checkPermission();
    }, [])


  const requestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Navigate to the main map screen (adjust the route as needed)
        router.replace('/');
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this app. Please enable it in your settings.',
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

    {/*Optional Skip Feature, as per proposal*/}
      <TouchableOpacity
        onPress={() => {router.replace('/')}}
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
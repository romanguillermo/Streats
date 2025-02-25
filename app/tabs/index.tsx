import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Text, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function MapScreen() {
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          // Set default LA
          setMapRegion({
            latitude: 34.0522,
            longitude: -118.2437,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.error("Error getting location:", error);
         // Set default location if there's an error
        setMapRegion({
            latitude: 34.0522,
            longitude: -118.2437,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  const recenterMap = () => {
    if (mapRef.current && mapRegion) {
    mapRef.current.animateToRegion({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
    }, 500); // 500ms animation duration
    }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mapRegion) {
    return null; // Or some error message/fallback UI
  }

  // Check if we're on the web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text>Map is not supported on the web.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
      >
        <Marker coordinate={mapRegion} title="Your Location" />
      </MapView>
      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <FontAwesome name="location-arrow" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20, // Adjust as needed
    right: 20, // Adjust as needed
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 25,
  },
});
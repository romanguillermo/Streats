import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/TempLogo.png')} // Replace with your actual logo
        style={styles.logo}
      />
      <Text style={styles.welcomeText}>Welcome</Text>
      <Text style={styles.discoverText}>Discover Vendors</Text>

      {/* Use Link from expo-router for navigation */}
      <Link href="/auth" asChild>
        <TouchableOpacity style={styles.nextButton}>
          <Text style={styles.nextButtonText}>→</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Or your desired background color
  },
  logo: {
    width: 200, // Adjust as needed
    height: 200, // Adjust as needed
    resizeMode: 'contain', // Important for image scaling
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  discoverText: {
    fontSize: 18,
    marginBottom: 40,
  },
  nextButton: {
    backgroundColor: '#0a7ea4', // Your brand color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
});
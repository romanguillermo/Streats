import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { ColorProperties } from 'react-native-reanimated/lib/typescript/Colors';
import Colors from '../constants/colors';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/TempLogo.png')}
        style={styles.logo}
      />
      <Text style={styles.welcomeText}>Welcome</Text>
      <Text style={styles.discoverText}>Discover Local Street Food</Text>

      {/* Next Button */}
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
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200, // Adjust as needed
    height: 200, // Adjust as needed
    resizeMode: 'contain', // Image scaling
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
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    paddingBottom: 4,
  },
});
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Link, router } from 'expo-router';
import { auth } from '../../config/firebaseConfig';
import Colors from '../../constants/colors';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is already signed in, redirect to location-permission
        router.replace('/location-permission');
      }
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const handleAuth = async () => {
    try {
      setLoading(true);

      if (isLogin) {
        // Login
        await auth.signInWithEmailAndPassword(email, password);
        console.log('Logged in successfully');
        router.replace('/location-permission');
      } else {
        // Signup
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Set the user's display name
        if (userCredential.user) {
          await userCredential.user.updateProfile({ displayName: name });
        }
        router.replace('/location-permission');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      // Error handling
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Incorrect Password', 'Please double-check your password.');
      } else if (error.code === 'auth/missing-password') {
        Alert.alert('Missing Password', 'Please enter a password.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('User Not Found', 'No user found with this email.');
      } else if (error.code == 'auth/invalid-credential') {
        Alert.alert('Invalid Credentials', 'Please check your email and password.');
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Email Already in Use', 'This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Authentication Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isLogin ? 'Log In' : 'Sign Up'}</Text>

        {/* Name Input - Only for signup */}
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input with visibility toggle */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <FontAwesome 
              name={passwordVisible ? "eye" : "eye-slash"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>

        {/* Login/Signup Button */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
          )}
        </TouchableOpacity>

        {/* Toggle between Login and Signup */}
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.linkText}>
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Log In'}
          </Text>
        </TouchableOpacity>

        {/* "Forgot Password?" Link (only for login) */}
        {isLogin && (
          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F2F2F2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkText: {
    color: "#000",
    textAlign: 'center',
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    marginBottom: 15,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  eyeIcon: {
    padding: 10,
    position: 'absolute',
    right: 10,
  }
});
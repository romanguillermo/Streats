import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import Colors from '../constants/colors';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only used for signup

  const handleAuth = () => {
    // Placeholder for authentication logic
    if (isLogin) {
      // Handle login (e.g., call API, validate credentials)
      console.log('Logging in with:', email, password);
      router.replace('/location-permission'); // Navigate after login
      // TODO: Navigate to the map screen on successful login
    } else {
      // Handle signup (e.g., call API, create user)
      console.log('Signing up with:', email, password, username);
      // TODO: Navigate to the map screen on successful signup
      router.replace('/location-permission'); // Navigate after login
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isLogin ? 'Log In' : 'Sign Up'}</Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Username Input (only for signup) */}
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {/* Login/Signup Button */}
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
        </TouchableOpacity>

        {/* Toggle between Login and Signup */}
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Log In'}
          </Text>
        </TouchableOpacity>

        {/* "Forgot Password?" Link (only for login) */}
        {isLogin && (
          <Link href="/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
    maxWidth: 400, // Limit width on larger screens
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
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#0a7ea4',
    textAlign: 'center',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#0a7ea4',
    textAlign: 'center',
  },
});
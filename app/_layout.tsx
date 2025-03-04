import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { auth } from '../config/firebaseConfig';
import { User as FirebaseUser } from 'firebase/auth';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '../context/FavoritesContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
      SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser as any);
      if (initializing) setInitializing(false);
    });
    
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || initializing) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="location-permission" options={{ headerShown: false }} />
          <Stack.Screen name="vendor-details" options={{ headerShown: true, title: "Vendor Details" }} />
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
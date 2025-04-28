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
import Colors from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
      SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
        <StatusBar style="dark" translucent={true} />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: "#FFFFFF",
            },
            headerTintColor: Colors.primary,
            headerTitleStyle: {
              fontWeight: "bold",
            },
            contentStyle: {
              backgroundColor: "#FFFFFF",
            },
          }}
        >
          {/* Non-tabbed screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="location-permission" />
          <Stack.Screen
            name="vendor-details"
            options={{
              headerShown: true,
              title: "Vendor Details",
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: "Settings",
            }}
          />
          <Stack.Screen name="tabs" />
          <Stack.Screen name="my-reviews" options={{ 
            headerShown: true,
            title: "My Reviews",
           }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
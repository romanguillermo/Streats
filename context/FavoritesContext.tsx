import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { auth } from '../config/firebaseConfig';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (vendorId: string) => void;
  removeFavorite: (vendorId: string) => void;
  isFavorite: (vendorId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  isLoading: true,
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from storage when component mounts or user changes
  useEffect(() => {
    loadFavorites();

    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadFavorites();
      } else {
        // Clear favorites when user logs out
        setFavorites([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setFavorites([]);
        return;
      }

      const userId = currentUser.uid;
      const storedFavorites = await AsyncStorage.getItem(`@favorites_${userId}`);
      
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load your favorites.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userId = currentUser.uid;
      await AsyncStorage.setItem(`@favorites_${userId}`, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addFavorite = (vendorId: string) => {
    if (!favorites.includes(vendorId)) {
      const newFavorites = [...favorites, vendorId];
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
    }
  };

  const removeFavorite = (vendorId: string) => {
    const newFavorites = favorites.filter(id => id !== vendorId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const isFavorite = (vendorId: string) => {
    return favorites.includes(vendorId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};
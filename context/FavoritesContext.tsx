import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'; 
import { User as FirebaseUser } from 'firebase/auth';

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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

   // Listen to Auth Changes
   useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        // User logged out, clear favorites and stop loading
        setFavorites([]);
        setIsLoading(false);
      }
      // loadFavorites will be triggered by the currentUser change effect
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect to load/listen to favorites when user changes
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;

    if (currentUser) {
      setIsLoading(true);
      const userId = currentUser.uid;
      const userDocRef = doc(db, 'users', userId);

      // Use onSnapshot for real-time updates
      unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFavorites(data.favoriteVendorIds || []);
        } else {
          // User document doesn't exist yet, create it? Or handle silently?
          // For now, assume it might not exist and user has no favorites yet.
          console.log("User document not found for favorites, treating as empty.");
          setFavorites([]);
           // Optionally create the user doc here if needed for signup flow:
           // setDoc(userDocRef, { favoriteVendorIds: [] }, { merge: true });
        }
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to favorites:', error);
        Alert.alert('Error', 'Could not load your favorites in real-time.');
        setFavorites([]); // Clear favorites on error
        setIsLoading(false);
      });

    } else {
      setFavorites([]);
      setIsLoading(false);
    }

    // Cleanup function for the listener
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [currentUser]); // Rerun when user changes

  const addFavorite = useCallback(async (vendorId: string) => {
    if (!currentUser) {
      Alert.alert("Login Required", "You need to be logged in to add favorites.");
      return;
    }
    if (favorites.includes(vendorId)) return; // Already favorite

    const userId = currentUser.uid;
    const userDocRef = doc(db, 'users', userId);

    // Optimistic Update
    setFavorites(prev => [...prev, vendorId]);

    try {
      // Use setDoc with merge:true to create doc if it doesn't exist
      await setDoc(userDocRef, {
        favoriteVendorIds: arrayUnion(vendorId)
      }, { merge: true }); // Creates or updates
      console.log("Favorite added:", vendorId);
    } catch (error) {
      console.error('Error adding favorite:', error);
      Alert.alert('Error', 'Failed to add favorite.');
      // Rollback optimistic update
      setFavorites(prev => prev.filter(id => id !== vendorId));
    }
  }, [currentUser, favorites]); // Include favorites in dependencies if using optimistic update

  const removeFavorite = useCallback(async (vendorId: string) => {
    if (!currentUser) return;
    if (!favorites.includes(vendorId)) return; // Not favorite

    const userId = currentUser.uid;
    const userDocRef = doc(db, 'users', userId);

     // Optimistic Update
     setFavorites(prev => prev.filter(id => id !== vendorId));

    try {
      await updateDoc(userDocRef, { // Use updateDoc, assuming doc exists
        favoriteVendorIds: arrayRemove(vendorId)
      });
      console.log("Favorite removed:", vendorId);
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite.');
       // Rollback optimistic update
       setFavorites(prev => [...prev, vendorId]);
    }
  }, [currentUser, favorites]); // Include favorites in dependencies

  const isFavorite = useCallback((vendorId: string) => {
    return favorites.includes(vendorId);
  }, [favorites]); // Depends only on the local favorites state

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Import initialized Firebase auth and db
import { logActivity } from '@/lib/activity-logger';

export interface AppUser { // Renamed to avoid conflict with FirebaseUser
  uid: string;
  name: string | null;
  email: string | null;
  avatarUrl?: string;
  class?: string;
  targetYear?: string;
  // Add any other app-specific user fields here
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  firebaseUser: FirebaseUser | null; // Expose FirebaseUser for advanced use cases if needed
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string, userClass?: string, targetYear?: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profileData: Partial<AppUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const MOCK_USER_KEY = 'neetPrepProUser'; // No longer needed for primary auth state

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch additional user profile data from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreUser = userDocSnap.data() as Omit<AppUser, 'uid'>;
          setAppUser({ 
            uid: fbUser.uid, 
            email: fbUser.email, // Prioritize Firebase auth email
            name: firestoreUser.name || fbUser.displayName, // Use Firestore name, fallback to Firebase displayName
            ...firestoreUser 
          });
          logActivity("Auth", "User signed in and profile loaded.", { uid: fbUser.uid });
        } else {
          // This case might happen if Firestore document creation failed during signup or user was created directly in Firebase console
          // For robustness, create a basic profile if it's missing
          const basicProfile: AppUser = { 
            uid: fbUser.uid, 
            email: fbUser.email, 
            name: fbUser.displayName || fbUser.email?.split('@')[0] || "User",
            avatarUrl: fbUser.photoURL || `https://placehold.co/100x100.png?text=${(fbUser.displayName || fbUser.email || "U").charAt(0)}`,
          };
          await setDoc(userDocRef, { ...basicProfile, createdAt: serverTimestamp() }, { merge: true });
          setAppUser(basicProfile);
          logActivity("Auth", "User signed in, basic profile created in Firestore.", { uid: fbUser.uid });
        }
      } else {
        setFirebaseUser(null);
        setAppUser(null);
        logActivity("Auth", "User signed out or no user.");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user state and fetching profile
      logActivity("Auth", "Login attempt successful.", { email });
    } catch (error) {
      setIsLoading(false);
      logActivity("Auth", "Login attempt failed.", { email, error: (error as Error).message });
      throw error; // Re-throw for the form to handle
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string, userClass: string = '', targetYear: string = '') => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      // Create user document in Firestore
      const newUserProfile: AppUser = {
        uid: fbUser.uid,
        name,
        email: fbUser.email,
        avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`,
        class: userClass,
        targetYear: targetYear,
      };
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUserProfile, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // onAuthStateChanged will handle setting user state
      logActivity("Auth", "Signup successful and profile created.", { uid: fbUser.uid, email });
    } catch (error) {
      setIsLoading(false);
      logActivity("Auth", "Signup failed.", { email, error: (error as Error).message });
      throw error; // Re-throw for the form to handle
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle clearing user state
      logActivity("Auth", "Logout successful.");
    } catch (error) {
      console.error("Error signing out: ", error);
      logActivity("Auth", "Logout failed.", { error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (profileData: Partial<Omit<AppUser, 'uid'>>) => {
    if (!firebaseUser) throw new Error("User not authenticated");
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
      // Optimistically update local state or re-fetch
      setAppUser(prev => prev ? { ...prev, ...profileData } : null);
      logActivity("Profile", "User profile updated in Firestore.", { uid: firebaseUser.uid, updates: Object.keys(profileData) });
    } catch (error) {
      logActivity("Profile", "User profile update failed.", { uid: firebaseUser.uid, error: (error as Error).message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!firebaseUser && !!appUser, 
      user: appUser, 
      firebaseUser, 
      isLoading, 
      login, 
      signup, 
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

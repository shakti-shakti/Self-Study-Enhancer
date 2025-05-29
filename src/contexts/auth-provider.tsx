
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUserType } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';

export interface AppUser {
  id: string; // Supabase user ID
  name: string | null;
  email: string | null;
  avatar_url?: string;
  class?: string;
  target_year?: string;
  // Add any other app-specific user fields here
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  supabaseUser: SupabaseUserType | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string, userClass?: string, targetYear?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<Omit<AppUser, 'id' | 'email'>>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (sbUser: SupabaseUserType): Promise<AppUser | null> => {
    if (!sbUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
        console.error('Error fetching profile:', error.message || error);
        logActivity("Supabase Error", "Error fetching user profile", { userId: sbUser.id, error: error.message });
        return null;
      }
      if (profile) {
        return {
          id: sbUser.id,
          email: sbUser.email || profile.email,
          name: profile.name || sbUser.user_metadata?.name,
          avatar_url: profile.avatar_url || sbUser.user_metadata?.avatar_url,
          class: profile.class,
          target_year: profile.target_year,
          ...profile,
        };
      }
      // If profile is null but no error (PGRST116), it means profile doesn't exist yet.
      // This is expected immediately after signup if profile creation is a separate step or pending.
      logActivity("Profile Info", "No profile found for user, might be new signup.", { userId: sbUser.id });
      return { // Return a basic AppUser object from auth data if profile doesn't exist
        id: sbUser.id,
        email: sbUser.email || null,
        name: sbUser.user_metadata?.name || null,
        avatar_url: sbUser.user_metadata?.avatar_url || undefined,
      };
    } catch (e) {
      console.error('Exception in fetchUserProfile:', (e as Error).message || e);
      logActivity("Supabase Exception", "Exception fetching user profile", { userId: sbUser.id, error: (e as Error).message });
      return null;
    }
  }, []);


  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchUserProfile(session.user);
        setAppUser(profile); // Set appUser, even if profile is basic from auth data
        if (profile && profile.name) { // Check if full profile was loaded
           logActivity("Auth", "User session restored and profile loaded.", { uid: session.user.id });
        } else {
           logActivity("Auth Warning", "User session restored, basic profile data set. Full profile might be pending or missing.", { uid: session.user.id });
        }
      }
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setIsLoading(true);
        const currentSupabaseUser = session?.user ?? null;
        setSupabaseUser(currentSupabaseUser);

        if (currentSupabaseUser) {
          const profile = await fetchUserProfile(currentSupabaseUser);
          setAppUser(profile); // Always set AppUser based on fetched profile or auth data

          if (event === 'SIGNED_IN') {
            logActivity("Auth", "User signed in.", { uid: currentSupabaseUser.id });
          } else if (event === 'USER_UPDATED' && profile) {
            logActivity("Auth", "User data updated.", { uid: currentSupabaseUser.id });
          }
        } else {
          setAppUser(null);
          if (event === 'SIGNED_OUT') {
            logActivity("Auth", "User signed out.");
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChanged will handle setting user state and fetching profile
      logActivity("Auth", "Login attempt successful.", { email });
    } catch (error) {
      logActivity("Auth Error", "Login attempt failed.", { email, error: (error as Error).message });
      throw error; // Re-throw to be caught by the form
    } finally {
      setIsLoading(false); // Ensure loading is stopped if onAuthStateChange doesn't fire quickly
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string, userClassProp?: string, targetYearProp?: string) => {
    setIsLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: name,
            avatar_url: `https://placehold.co/100x100.png?text=${name ? name.charAt(0).toUpperCase() : 'U'}`
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Signup completed but no user data returned from Supabase Auth.");
      
      const classToSave = userClassProp === "none" ? null : userClassProp;
      const yearToSave = targetYearProp === "none" ? null : targetYearProp;

      // Create user profile in 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          avatar_url: authData.user.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${name ? name.charAt(0).toUpperCase() : 'U'}`,
          class: classToSave,
          target_year: yearToSave,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(
          "Error creating profile after signup. Message:", profileError.message, 
          "Details:", profileError.details, 
          "Hint:", profileError.hint, 
          "Code:", profileError.code,
          "Full Error:", JSON.stringify(profileError, null, 2)
        );
        logActivity("Auth Error", "Signup succeeded in Auth, but profile creation failed.", { uid: authData.user.id, error: profileError.message, details: profileError.details });
        throw profileError; 
      }
      
      // onAuthStateChanged will set the appUser state.
      // We can also try to set it eagerly here if needed, but onAuthStateChange should handle it.
      logActivity("Auth", "Signup successful and profile creation initiated.", { uid: authData.user.id, email });
    } catch (error) {
      logActivity("Auth Error", "Signup failed.", { email, error: (error as Error).message });
      throw error; // Re-throw to be caught by the form
    } finally {
      setIsLoading(false); // Ensure loading is stopped
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAppUser(null); // Explicitly clear user state on logout
      setSupabaseUser(null);
    } catch (error) {
      console.error("Error signing out: ", (error as Error).message || error);
      logActivity("Auth Error", "Logout failed.", { error: (error as Error).message });
    } finally {
       setIsLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (profileData: Partial<Omit<AppUser, 'id' | 'email'>>) => {
    if (!supabaseUser) throw new Error("User not authenticated");
    setIsLoading(true);
    try {
      const updates = {
        ...profileData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', supabaseUser.id);

      if (error) throw error;

      const authUpdates: { data?: any; } = {};
      if ('name' in profileData && profileData.name !== supabaseUser.user_metadata?.name) {
        authUpdates.data = { ...(authUpdates.data || {}), name: profileData.name };
      }
      if ('avatar_url' in profileData && profileData.avatar_url !== supabaseUser.user_metadata?.avatar_url) {
         authUpdates.data = { ...(authUpdates.data || {}), avatar_url: profileData.avatar_url };
      }

      if (Object.keys(authUpdates).length > 0 && authUpdates.data) {
        const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.updateUser(authUpdates);
        if (authUpdateError) {
          console.warn("Profile table updated, but Supabase Auth user_metadata update failed:", authUpdateError.message);
          logActivity("Profile Warning", "Failed to update Supabase Auth user_metadata.", { uid: supabaseUser.id, error: authUpdateError.message });
        }
        if(updatedAuthUser?.user) setSupabaseUser(updatedAuthUser.user); 
      }
      
      setAppUser(prev => prev ? { ...prev, ...profileData, id: prev.id, email: prev.email } : null);
      logActivity("Profile", "User profile updated in Supabase.", { uid: supabaseUser.id, updates: Object.keys(profileData) });
    } catch (error) {
      logActivity("Profile Error", "User profile update failed.", { uid: supabaseUser.id, error: (error as Error).message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!supabaseUser && !!appUser, 
      user: appUser, 
      supabaseUser, 
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

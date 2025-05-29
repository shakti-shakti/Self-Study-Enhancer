
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
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
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string, userClass?: string, targetYear?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<Omit<AppUser, 'id' | 'email'>>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (sbUser: SupabaseUser): Promise<AppUser | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
      console.error('Error fetching profile:', error);
      logActivity("Supabase Error", "Error fetching user profile", { userId: sbUser.id, error: error.message });
      return null;
    }
    if (profile) {
      return {
        id: sbUser.id,
        email: sbUser.email || profile.email, // Prefer Supabase Auth email
        name: profile.name || sbUser.user_metadata?.name,
        avatar_url: profile.avatar_url || sbUser.user_metadata?.avatar_url,
        class: profile.class,
        target_year: profile.target_year,
        ...profile, // Spread other fields from profiles table
      };
    }
    return null;
  }, []);


  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchUserProfile(session.user);
        if (profile) {
          setAppUser(profile);
           logActivity("Auth", "User session restored and profile loaded.", { uid: session.user.id });
        } else {
          // Could attempt to create a profile if one doesn't exist
          // For now, just log and set appUser to null if profile fetch fails
           logActivity("Auth Warning", "User session restored but profile not found/error.", { uid: session.user.id });
        }
      }
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setIsLoading(true);
        const sbUser = session?.user ?? null;
        setSupabaseUser(sbUser);

        if (sbUser) {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
            const profile = await fetchUserProfile(sbUser);
             if (profile) {
              setAppUser(profile);
              if(event === 'SIGNED_IN') logActivity("Auth", "User signed in.", { uid: sbUser.id });
            } else if (event === 'SIGNED_IN') {
                // This case implies user exists in auth.users but not profiles table.
                // This typically happens right after signup before profile is fully created, or if creation failed.
                // We'll rely on the signup function to create the profile.
                // For now, if profile is null after sign in, we might be in a transient state.
                console.warn("User signed in, but profile not immediately available. Waiting for signup process to complete or manual check needed.");
                logActivity("Auth Warning", "User signed in, profile fetch returned null.", {uid: sbUser.id});
            }
          }
        } else {
          setAppUser(null);
          if (event === 'SIGNED_OUT') logActivity("Auth", "User signed out.");
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
      setIsLoading(false);
      logActivity("Auth", "Login attempt failed.", { email, error: (error as Error).message });
      throw error;
    } finally {
        // setIsLoading(false) is handled by onAuthStateChange
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string, userClass: string = '', targetYear: string = '') => {
    setIsLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // This data is stored in auth.users.user_metadata
            name: name,
            avatar_url: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Signup completed but no user data returned from Supabase Auth.");

      // Create user profile in 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          avatar_url: authData.user.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`,
          class: userClass || null,
          target_year: targetYear || null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Error creating profile after signup:", profileError);
        // Potentially try to clean up the auth user if profile creation fails, or log for admin action
        logActivity("Auth Error", "Signup succeeded in Auth, but profile creation failed.", { uid: authData.user.id, error: profileError.message });
        throw profileError; 
      }
      
      // onAuthStateChanged will set the appUser state eventually
      logActivity("Auth", "Signup successful and profile creation initiated.", { uid: authData.user.id, email });
    } catch (error) {
      setIsLoading(false);
      logActivity("Auth", "Signup failed.", { email, error: (error as Error).message });
      throw error;
    } finally {
       // setIsLoading(false) is handled by onAuthStateChange
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // onAuthStateChanged will handle clearing user state
    } catch (error) {
      console.error("Error signing out: ", error);
      logActivity("Auth", "Logout failed.", { error: (error as Error).message });
    } finally {
       setIsLoading(false); // Explicitly set here as onAuthStateChange might be delayed
       setAppUser(null);
       setSupabaseUser(null);
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

      // Also update Supabase Auth user metadata if name or avatar_url changed
      // This is optional but good for consistency if other services read from auth.users
      const authUpdates: { data?: any; } = {};
      if ('name' in profileData && profileData.name !== supabaseUser.user_metadata?.name) {
        authUpdates.data = { ...(authUpdates.data || {}), name: profileData.name };
      }
      if ('avatar_url' in profileData && profileData.avatar_url !== supabaseUser.user_metadata?.avatar_url) {
         authUpdates.data = { ...(authUpdates.data || {}), avatar_url: profileData.avatar_url };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { data: updatedUser, error: authUpdateError } = await supabase.auth.updateUser(authUpdates);
        if (authUpdateError) {
          console.warn("Profile table updated, but Supabase Auth user_metadata update failed:", authUpdateError);
          logActivity("Profile Warning", "Failed to update Supabase Auth user_metadata.", { uid: supabaseUser.id, error: authUpdateError.message });
        }
        if(updatedUser) setSupabaseUser(updatedUser.user); // Update local Supabase user state
      }
      
      // Optimistically update local state or re-fetch
      setAppUser(prev => prev ? { ...prev, ...profileData } : null);
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


"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUserType, PostgrestError } from '@supabase/supabase-js';
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
      // logActivity("Profile Fetch", `Fetching profile for user: ${sbUser.id}`, undefined, sbUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
        console.error('Error fetching profile:', error.message || error);
        logActivity("Supabase Error", "Error fetching user profile", { userId: sbUser.id, error_message: error.message, error_details: error.details }, sbUser.id);
        return { 
          id: sbUser.id,
          email: sbUser.email || null,
          name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || "User",
          avatar_url: sbUser.user_metadata?.avatar_url || undefined,
        };
      }
      if (profile) {
        // logActivity("Profile Success", `Profile successfully fetched for user: ${sbUser.id}`, {name: profile.name}, sbUser.id);
        return {
          id: sbUser.id,
          email: sbUser.email || profile.email, 
          name: profile.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || "User",
          avatar_url: profile.avatar_url || sbUser.user_metadata?.avatar_url,
          class: profile.class,
          target_year: profile.target_year,
        };
      }
      // logActivity("Profile Info", "No profile found for user in 'profiles' table, might be new signup or data mismatch.", { userId: sbUser.id }, sbUser.id);
      // If no profile row, create a basic AppUser from SupabaseUser
      return { 
        id: sbUser.id,
        email: sbUser.email || null,
        name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || "User",
        avatar_url: sbUser.user_metadata?.avatar_url || undefined,
      };
    } catch (e) {
      console.error('Exception in fetchUserProfile:', (e as Error).message || e);
      logActivity("Supabase Exception", "Exception fetching user profile", { userId: sbUser.id, error: (e as Error).message }, sbUser.id);
       return { 
        id: sbUser.id,
        email: sbUser.email || null,
        name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || "User",
        avatar_url: sbUser.user_metadata?.avatar_url || undefined,
      };
    }
  }, []);


  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchUserProfile(session.user);
        setAppUser(profile);
        // Log activity for session restoration only if user data makes sense
        // if (profile && profile.name) {
        //    logActivity("Auth", "User session restored and profile loaded.", { uid: session.user.id, name: profile.name }, session.user.id);
        // } else {
        //    logActivity("Auth Warning", "User session restored, basic profile data set. Full profile might be pending or missing.", { uid: session.user.id }, session.user.id);
        // }
      }
      setIsLoading(false);
    });

    const { data, error } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setIsLoading(true);
        const currentSupabaseUser = session?.user ?? null;
        setSupabaseUser(currentSupabaseUser);

        if (currentSupabaseUser) {
          const profile = await fetchUserProfile(currentSupabaseUser);
          setAppUser(profile);

          if (event === 'SIGNED_IN') {
            logActivity("Auth", "User signed in.", { uid: currentSupabaseUser.id, email: currentSupabaseUser.email }, currentSupabaseUser.id);
          } else if (event === 'USER_UPDATED' && profile) {
            logActivity("Auth", "User data updated.", { uid: currentSupabaseUser.id, name: profile.name }, currentSupabaseUser.id);
          } else if (event === 'TOKEN_REFRESHED') {
            // logActivity("Auth", "Token refreshed.", { uid: currentSupabaseUser.id}, currentSupabaseUser.id);
          }
        } else {
          setAppUser(null);
          if (event === 'SIGNED_OUT') {
            logActivity("Auth", "User signed out.", undefined, undefined); // No user ID on sign out for log
          }
        }
        setIsLoading(false);
      }
    );
    
    if (error) {
      console.error("Error with onAuthStateChange subscription:", error);
      logActivity("Auth Error", "Failed to subscribe to onAuthStateChange", { error_message: error.message });
    }


    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // logActivity("Auth", "Login attempt successful (Supabase).", { email }, undefined); // User not yet set
    } catch (error) {
      logActivity("Auth Error", "Login attempt failed (Supabase).", { email, error_message: (error as Error).message }, undefined);
      throw error; 
    } finally {
      setIsLoading(false); 
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
          },
          // Redirect to login page after email confirmation
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Signup completed but no user data returned from Supabase Auth.");
      
      if (!authData.user.id || !authData.user.email) {
        console.error("Critical error: User ID or Email missing after signup from Supabase Auth.", authData.user);
        logActivity("Auth Critical Error", "User ID or Email missing after signup from Supabase Auth.", { user: JSON.stringify(authData.user) }, undefined);
        throw new Error("User ID or Email missing after signup, cannot create profile.");
      }

      const classToSave = (!userClassProp || userClassProp === "none") ? null : userClassProp;
      const yearToSave = (!targetYearProp || targetYearProp === "none") ? null : targetYearProp;

      const profilePayload = {
        id: authData.user.id,
        email: authData.user.email, 
        name: name,
        avatar_url: authData.user.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${name ? name.charAt(0).toUpperCase() : 'U'}`,
        class: classToSave,
        target_year: yearToSave,
        updated_at: new Date().toISOString(),
      };
      
      // logActivity("Profile Creation Attempt", "Attempting to create profile in Supabase 'profiles' table.", { userId: authData.user.id, payload: profilePayload }, authData.user.id);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profilePayload);

      if (profileError) {
        let consoleErrorMessage = "PROFILE CREATION FAILED.\n";
        consoleErrorMessage += `  Type of profileError: ${typeof profileError}\n`;
        consoleErrorMessage += `  Keys in profileError: ${Object.keys(profileError).join(', ')}\n`;
        try {
          consoleErrorMessage += `  Raw profileError object: ${JSON.stringify(profileError, null, 2)}\n`;
        } catch (e) {
          consoleErrorMessage += `  Raw profileError object: (Could not stringify - circular structure or other issue)\n`;
        }


        if (typeof profileError === 'object' && profileError !== null) {
          const pe = profileError as any; 
          consoleErrorMessage += `  Message: ${pe.message}\n`;
          consoleErrorMessage += `  Details: ${pe.details}\n`;
          consoleErrorMessage += `  Hint: ${pe.hint}\n`;
          consoleErrorMessage += `  Code: ${pe.code}\n`;

          if (Object.keys(profileError).length === 0 && !pe.message) {
            consoleErrorMessage += "\n  IMPORTANT: The error object from Supabase is empty or lacks a message. This often indicates a Row Level Security (RLS) policy violation or a database schema issue (e.g., missing table, incorrect foreign key, NOT NULL constraint violation) on the 'profiles' table. Please check your Supabase dashboard logs (Database and PostgREST sections) for the specific server-side SQL error.\n";
          }
        }
        console.error(consoleErrorMessage);
        
        logActivity(
            "Auth Error", 
            "Signup succeeded in Auth, but profile creation failed.", 
            { 
                uid: authData.user.id, 
                supa_error_message: (profileError as PostgrestError)?.message || "N/A",
                supa_error_details: (profileError as PostgrestError)?.details || "N/A",
                supa_error_code: (profileError as PostgrestError)?.code || "N/A",
                supa_error_hint: (profileError as PostgrestError)?.hint || "N/A",
                raw_error_string: JSON.stringify(profileError) 
            },
            authData.user.id
        );
        // We are NOT re-throwing the error here.
        // The signup in auth.users was successful, and an email was sent.
        // The user should get the "check your email" toast.
        // The profile creation failure needs to be debugged on the Supabase side (RLS, schema).
      } else {
        // Profile creation was successful
        logActivity("Auth", "Signup successful and profile created.", { uid: authData.user.id, email }, authData.user.id);
      }
    } catch (error) {
      // This catches errors from supabase.auth.signUp or other unexpected issues
      console.error("Overall signup process error:", error);
      logActivity("Auth Error", "Signup process failed.", { email, error_message: (error as Error).message, raw_error: JSON.stringify(error) }, undefined);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    const currentUserId = supabaseUser?.id;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAppUser(null); 
      setSupabaseUser(null);
      logActivity("Auth", "User signed out successfully.", { uid: currentUserId }, undefined);
    } catch (error) {
      console.error("Error signing out: ", (error as Error).message || error);
      logActivity("Auth Error", "Logout failed.", { uid: currentUserId, error: (error as Error).message }, undefined);
    } finally {
       setIsLoading(false);
    }
  }, [supabaseUser]);

  const updateUserProfile = useCallback(async (profileData: Partial<Omit<AppUser, 'id' | 'email'>>) => {
    if (!supabaseUser) throw new Error("User not authenticated for profile update.");
    setIsLoading(true);
    try {
      const updates = {
        ...profileData,
        // id: supabaseUser.id, // ID should not be in the update payload for an existing row typically, it's used in .eq()
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', supabaseUser.id);

      if (error) throw error;

      const authUserMetadataUpdates: { data?: Record<string, any> } = { data: {} };
      let metadataChanged = false;
      if ('name' in profileData && profileData.name !== (appUser?.name || supabaseUser.user_metadata?.name)) {
        authUserMetadataUpdates.data!.name = profileData.name;
        metadataChanged = true;
      }
      if ('avatar_url' in profileData && profileData.avatar_url !== (appUser?.avatar_url || supabaseUser.user_metadata?.avatar_url)) {
         authUserMetadataUpdates.data!.avatar_url = profileData.avatar_url;
         metadataChanged = true;
      }

      if (metadataChanged) {
        const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.updateUser(authUserMetadataUpdates);
        if (authUpdateError) {
          console.warn("Profile table updated, but Supabase Auth user_metadata update failed:", authUpdateError.message);
          logActivity("Profile Warning", "Failed to update Supabase Auth user_metadata.", { uid: supabaseUser.id, error: authUpdateError.message }, supabaseUser.id);
        }
        if(updatedAuthUser?.user) setSupabaseUser(updatedAuthUser.user); 
      }
      
      const refreshedProfile = await fetchUserProfile(supabaseUser);
      setAppUser(refreshedProfile);
      logActivity("Profile", "User profile updated in Supabase.", { uid: supabaseUser.id, updates: Object.keys(profileData) }, supabaseUser.id);
    } catch (error) {
      logActivity("Profile Error", "User profile update failed.", { uid: supabaseUser.id, error: (error as Error).message }, supabaseUser.id);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser, appUser, fetchUserProfile]);

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

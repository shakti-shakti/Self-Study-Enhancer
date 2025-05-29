
"use client";

import { useContext } from 'react';
import { AuthContext, type AppUser } from '@/contexts/auth-provider'; // Import AppUser
import type { User as FirebaseUser } from 'firebase/auth'; // Import FirebaseUser for clarity

export type { AppUser, FirebaseUser }; // Export types

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

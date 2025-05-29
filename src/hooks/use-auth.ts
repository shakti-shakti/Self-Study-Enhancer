
"use client";

import { useContext } from 'react';
import { AuthContext, type AppUser } from '@/contexts/auth-provider';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type { AppUser, SupabaseUser }; // Export types

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

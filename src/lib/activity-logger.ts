
"use client";

import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface ActivityLog {
  id?: string; // UUID from Supabase, optional for new logs
  user_id?: string | null; // Can be null if user is not available or not relevant
  type: string;
  description: string;
  timestamp?: string; // ISO string, Supabase handles this
  details?: Record<string, any>;
}

const MAX_LOG_ENTRIES_TO_FETCH = 50;

// Helper to get current user ID safely
const getCurrentUserId = (): string | null => {
  // This is a bit tricky as useAuth can't be used outside React components/hooks.
  // For a robust solution, logActivity might need to accept the user object or ID.
  // Or, the Supabase client could be set up with the session for automatic user IDing if RLS allows.
  // For now, this is a simplification. In a real app, pass user or use server-side logging.
  if (typeof window !== 'undefined') {
    // Attempt to get from a potential global or session (not ideal but for client-side simplicity)
    // A better way would be for the calling function to provide the user ID.
  }
  return null; // Placeholder
};


export async function logActivity(
  type: string,
  description: string,
  details?: Record<string, any>,
  userId?: string | null // Allow explicitly passing userId
): Promise<void> {
  if (typeof window === 'undefined') return; // Don't run on server for now (could be adapted)

  const effectiveUserId = userId === undefined ? getCurrentUserId() : userId;

  const newLog: Omit<ActivityLog, 'id' | 'timestamp'> = {
    // user_id will be set by Supabase policies or explicitly if passed
    ...(effectiveUserId && { user_id: effectiveUserId }),
    type,
    description,
    details,
  };

  try {
    const { error } = await supabase.from('activity_logs').insert(newLog);
    if (error) {
      console.error("Error logging activity to Supabase:", error.message, error.details);
      // Fallback or further error handling
    }
  } catch (e) {
    console.error("Exception during Supabase activity logging:", e);
  }
}

export async function getActivityLog(userId: string): Promise<ActivityLog[]> {
  if (typeof window === 'undefined' || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(MAX_LOG_ENTRIES_TO_FETCH);

    if (error) {
      console.error("Error fetching activity log from Supabase:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Exception fetching Supabase activity log:", e);
    return [];
  }
}

export async function deleteActivityLogEntry(logId: string, userId: string): Promise<boolean> {
    if (!logId || !userId) return false;
    try {
        const { error } = await supabase
            .from('activity_logs')
            .delete()
            .eq('id', logId)
            .eq('user_id', userId); // Ensure user can only delete their own logs based on RLS
        
        if (error) {
            console.error("Error deleting activity log entry:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception deleting activity log entry:", e);
        return false;
    }
}

export async function clearUserActivityLog(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
        const { error } = await supabase
            .from('activity_logs')
            .delete()
            .eq('user_id', userId);
        
        if (error) {
            console.error("Error clearing user activity log:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception clearing user activity log:", e);
        return false;
    }
}

    
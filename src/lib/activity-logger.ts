
"use client";

import { supabase } from './supabaseClient';

export interface ActivityLog {
  id?: string; // UUID from Supabase, optional for new logs
  user_id?: string | null; // Can be null if user is not available or not relevant
  type: string;
  description: string;
  timestamp?: string; // ISO string, Supabase handles this
  details?: Record<string, any>;
}

// Interface for the object being inserted into Supabase
interface ActivityLogInsert {
  user_id: string | null;
  type: string;
  description: string;
  details?: Record<string, any>;
}

const MAX_LOG_ENTRIES_TO_FETCH = 50;

export async function logActivity(
  type: string,
  description: string,
  details?: Record<string, any>,
  passedUserId?: string | null // Explicitly pass userId from the calling context
): Promise<void> {
  if (typeof window === 'undefined') return;

  let userIdToLog = passedUserId === undefined ? null : passedUserId;

  // If no userId was passed (or explicitly null) AND we want to ensure authenticated users' logs are tied to them
  // to satisfy RLS `auth.uid() = user_id`, try to get current session user ID.
  if (userIdToLog === null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userIdToLog = session.user.id;
        // Optional: Log a warning if we had to auto-fill this, indicating a potential issue at the call site.
        // console.warn(`logActivity: 'userId' was not provided for an authenticated session. Using current user ID: ${userIdToLog}. Type: "${type}"`);
      }
    } catch (sessionError) {
      console.error("Error fetching session in logActivity:", sessionError);
      // Proceed with userIdToLog as null if session fetch fails
    }
  }

  const newLog: ActivityLogInsert = {
    user_id: userIdToLog,
    type,
    description,
    details,
  };

  try {
    const { error } = await supabase.from('activity_logs').insert(newLog);
    if (error) {
      console.error(
        "Error logging activity to Supabase:", 
        error.message, 
        error.details,
        "Attempted payload:", newLog
      );
    }
  } catch (e) {
    console.error("Exception during Supabase activity logging:", e, "Attempted payload:", newLog);
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
            .eq('user_id', userId); 
        
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

// src/lib/activity-logger.ts
"use client";

import { saveToLocalStorage, loadFromLocalStorage } from './local-storage';

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string; // ISO string
  details?: Record<string, any>;
}

const ACTIVITY_LOG_KEY = 'neetPrepProActivityLog';
const MAX_LOG_ENTRIES = 50; // Keep the last 50 activities

export function logActivity(type: string, description: string, details?: Record<string, any>): void {
  if (typeof window === 'undefined') return; // Don't run on server

  const newLog: ActivityLog = {
    id: crypto.randomUUID(),
    type,
    description,
    timestamp: new Date().toISOString(),
    details,
  };
  const currentLogs = loadFromLocalStorage<ActivityLog[]>(ACTIVITY_LOG_KEY, []);
  const updatedLogs = [newLog, ...currentLogs].slice(0, MAX_LOG_ENTRIES);
  saveToLocalStorage(ACTIVITY_LOG_KEY, updatedLogs);
}

export function getActivityLog(): ActivityLog[] {
  if (typeof window === 'undefined') return []; // Don't run on server
  return loadFromLocalStorage<ActivityLog[]>(ACTIVITY_LOG_KEY, []);
}

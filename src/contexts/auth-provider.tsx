
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  class?: string;
  targetYear?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_KEY = 'neetPrepProUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, nameInput?: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const name = nameInput || email.split('@')[0] || 'User';
    const loggedInUser: User = { id: '1', email, name, avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}` };
    setUser(loggedInUser);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(loggedInUser));
    setIsLoading(false);
  }, []);

  const signup = useCallback(async (email: string, name: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = { id: '1', email, name, avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}` };
    setUser(newUser);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(newUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(MOCK_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

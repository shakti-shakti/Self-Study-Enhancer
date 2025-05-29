
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

    if (!password) { // Password is now checked
      setIsLoading(false);
      throw new Error("Password is required for login.");
    }

    const storedUserJson = localStorage.getItem(MOCK_USER_KEY);
    if (storedUserJson) {
      const storedUser: User = JSON.parse(storedUserJson);
      if (storedUser.email === email) {
        // In a real app, you'd validate the password here.
        // For this mock, if email matches and password was provided, we "log in".
        setUser(storedUser);
        setIsLoading(false);
        return;
      }
    }
    setIsLoading(false);
    throw new Error("Login failed. User not found or incorrect credentials.");
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

    if (!password) { // Password is now checked
      setIsLoading(false);
      throw new Error("Password is required for signup.");
    }
    // For this mock, signup will overwrite any existing MOCK_USER_KEY.
    // A real app would check for email uniqueness in a database.
    const newUser: User = { id: Date.now().toString(), email, name, avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}` };
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

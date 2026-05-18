'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { auth, db } from '@/app/admin/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  activityLevel?: string;
  goalType?: string;
  units?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void | Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Default Admin if not exists
    let existingUsers = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    existingUsers = existingUsers.filter((u: any) => u.email !== 'admin' && u.email !== undefined);

    if (!existingUsers.find((u: any) => u.email === 'admin@healthmate.io')) {
      existingUsers.push({ 
        id: 'admin-001',
        name: 'System Admin', 
        email: 'admin@healthmate.io', 
        password: 'admin123', 
        role: 'admin',
        status: 'active',
        joined: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
      localStorage.setItem('vital_users_db', JSON.stringify(existingUsers));
    }

    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Try to fetch profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // 2. Fallback to localStorage for migration/legacy entries
          const users = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
          const userData = users.find((u: any) => u.id === firebaseUser.uid || u.email === firebaseUser.email);

          if (userData) {
            if (!userData.id || userData.id.startsWith('u-')) userData.id = firebaseUser.uid;
            // Migrate legacy data to Firestore
            await setDoc(docRef, userData);
            setUser(userData);
          } else {
            // New user with no metadata yet
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user'
            });
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    try {
      // Sync back to Firestore
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Firestore sync failed:", error);
    }

    // Keep localStorage sync for performance/redundancy
    const users = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, ...data } : u
    );
    localStorage.setItem('vital_users_db', JSON.stringify(updatedUsers));
    
    toast.success('Profile updated successfully');
  }, [user]);

  const login = useCallback((userData: User) => {
    // This is now handled by onAuthStateChanged
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      toast.error('Sign out failed');
    }
  }, []);

  const value = useMemo(() => ({
    user, login, logout, updateUser, isLoading
  }), [user, login, logout, updateUser, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
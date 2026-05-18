'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface Meal {
  id: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  grams: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  aiConfidence: number;
  source: 'ai' | 'manual';
}

interface MealContextType {
  meals: Meal[];
  addMeal: (meal: Omit<Meal, 'id' | 'loggedAt'>) => void;
  deleteMeal: (id: string) => void;
  bulkDeleteMeals: (ids: string[]) => void;
  updateMeal: (id: string, updates: Partial<Meal>) => void;
  isLoading: boolean;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = useMemo(() => user?.id ? `meals_${user.id}` : null, [user?.id]);

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      setMeals(stored ? JSON.parse(stored) : []);
      setIsLoading(false);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [storageKey, authLoading]);

  const syncStorage = useCallback((newMeals: Meal[]) => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newMeals));
    }
  }, [storageKey]);

  const addMeal = (mealData: Omit<Meal, 'id' | 'loggedAt'>) => {
    const newMeal: Meal = {
      ...mealData,
      id: `log-${Date.now()}`,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newMeal, ...meals];
    setMeals(updated);
    syncStorage(updated);
  };

  const deleteMeal = (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    syncStorage(updated);
  };

  const bulkDeleteMeals = (ids: string[]) => {
    const updated = meals.filter(m => !ids.includes(m.id));
    setMeals(updated);
    syncStorage(updated);
  };

  const updateMeal = (id: string, updates: Partial<Meal>) => {
    const updated = meals.map(m => m.id === id ? { ...m, ...updates } : m);
    setMeals(updated);
    syncStorage(updated);
  };

  return (
    <MealContext.Provider value={{ meals, addMeal, deleteMeal, bulkDeleteMeals, updateMeal, isLoading }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
}
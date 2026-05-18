'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useMeals } from '@/context/MealContext';

interface MealEntry {
  id: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  time: string;
  confidence: number;
}

const mealTypeBadge: Record<string, string> = {
  Breakfast: 'bg-warning-light text-warning',
  Lunch: 'bg-success-light text-success',
  Dinner: 'bg-cyan-light text-cyan',
  Snack: 'bg-muted text-muted-foreground',
};

export default function TodayMealsList() {
  const { user, isLoading: authLoading } = useAuth();
  const { meals: rawMeals, deleteMeal, isLoading: mealsLoading } = useMeals();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const meals: MealEntry[] = useMemo(() => {
    return rawMeals.map((m) => ({
      id: m.id,
      name: m.name,
      mealType: m.mealType,
      calories: m.calories,
      time: m.loggedAt || '12:00 PM',
      confidence: m.aiConfidence || 0.9
    }));
  }, [rawMeals]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteMeal(id);
      setDeletingId(null);
      toast.success('Meal removed from today\'s log');
    }, 300);
  };

  if (authLoading || mealsLoading || !user) {
    return (
      <div className="card-base h-full flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);

  return (
    <div className="card-base h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Today&apos;s Meals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{meals.length} entries · {totalCalories} kcal total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/meal-tracker" className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            Add Meal
          </Link>
          <Link href="/meal-tracker" className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-2">
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {meals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <span className="text-2xl">🍽️</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No meals logged today</p>
          <p className="text-xs text-muted-foreground mb-4">Log your first meal using natural language AI parsing</p>
          <Link href="/meal-tracker" className="btn-primary text-sm">Log Your First Meal</Link>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 table-row-hover group transition-all duration-300 ${
                deletingId === meal.id ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                  <span className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md ${mealTypeBadge[meal.mealType]}`}>
                    {meal.mealType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{meal.time}</span>
                  <span>·</span>
                  <span className="text-xs text-muted-foreground">
                    AI confidence: <span className={`font-semibold ${meal.confidence >= 0.9 ? 'text-success' : 'text-warning'}`}>
                      {Math.round(meal.confidence * 100)}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground font-tabular">{meal.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <button
                onClick={() => handleDelete(meal.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1"
                aria-label={`Remove ${meal.name}`}
                title="Remove meal — this cannot be undone"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
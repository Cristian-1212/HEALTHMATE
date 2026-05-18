'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useMeals } from '@/context/MealContext';

const CalorieRingChart = dynamic(() => import('./CalorieRingChart'), { ssr: false });

export default function CalorieRingCard() {
  const { user, isLoading: authLoading } = useAuth();
  const { meals, isLoading: mealsLoading } = useMeals();

  const stats = useMemo(() => {
    const consumed = meals.reduce((sum, m) => sum + m.calories, 0);
    
    if (!user) return { consumed, goal: 2000, remaining: 2000 - consumed, pct: 0 };

    const {
      weight: rawWeight,
      height: rawHeight,
      age: rawAge,
      gender,
      activityLevel,
      goalType,
      units,
    } = user;

    const weight =
      units === 'imperial' ? (rawWeight || 0) * 0.453592 : (rawWeight || 0);

    const height =
      units === 'imperial' ? (rawHeight || 0) * 2.54 : (rawHeight || 0);

    const age = rawAge || 25;

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    let tdee = bmr * (multipliers[activityLevel || 'sedentary'] || 1.2);

    if (goalType === 'lose_weight') tdee -= 500;
    if (goalType === 'gain_muscle') tdee += 300;
    
    const goal = Math.round(tdee) || 2000;
    const remaining = goal - consumed;
    const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;

    return { consumed, goal, remaining, pct };
  }, [meals, user]);

  // CRITICAL: Prevent runtime crash during hydration and infinite loading
  // Guard is placed AFTER all hooks to follow the Rules of Hooks
  if (authLoading || mealsLoading || !user) {
    return (
      <div className="card-base p-5 h-full flex items-center justify-center min-h-[380px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="card-base card-hover h-full p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Calorie Budget</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
        </div>
        <span className={stats.remaining >= 0 ? "badge-success" : "badge-danger"}>
          <span className={`w-1.5 h-1.5 rounded-full ${stats.remaining >= 0 ? 'bg-success' : 'bg-danger'}`} />
          {stats.remaining >= 0 ? 'On Track' : 'Over Limit'}
        </span>
      </div>
      {/* Ring chart */}
      <div className="flex-1 flex items-center justify-center min-h-[180px]">
        <CalorieRingChart consumed={stats.consumed} goal={stats.goal} />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Consumed</p>
          <p className="text-xl font-bold text-foreground font-tabular">{stats.consumed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Remaining</p>
          <p className={`text-xl font-bold font-tabular ${stats.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
            {Math.abs(stats.remaining).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Goal</p>
          <p className="text-xl font-bold text-foreground font-tabular">{stats.goal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{stats.pct}% of daily goal</span>
          <span className={`${stats.remaining >= 0 ? 'text-success' : 'text-danger'} font-semibold`}>
            {stats.remaining >= 0 ? `${stats.remaining} kcal left` : `${Math.abs(stats.remaining)} kcal over`}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
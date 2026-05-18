'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMeals } from '@/context/MealContext';

export default function DailyMacroSummary() {
  const { user } = useAuth();
  const { meals } = useMeals();

  const targets = useMemo(() => {
    if (!user) return { calories: 2000, protein: 150, carbs: 250, fat: 70 };
    
    // Basic BMR (Mifflin-St Jeor)
    const weight = user.units === 'imperial' ? (user.weight || 0) * 0.453592 : (user.weight || 0);
    const height = user.units === 'imperial' ? (user.height || 0) * 2.54 : (user.height || 0);
    const age = user.age || 25;
    
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = user.gender === 'male' ? bmr + 5 : bmr - 161;

    const multipliers: any = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725, extra_active: 1.9 };
    let tdee = bmr * (multipliers[user.activityLevel || 'sedentary'] || 1.2);

    if (user.goalType === 'lose_weight') tdee -= 500;
    if (user.goalType === 'gain_muscle') tdee += 300;

    return {
      calories: Math.round(tdee),
      protein: Math.round((tdee * 0.3) / 4),
      carbs: Math.round((tdee * 0.45) / 4),
      fat: Math.round((tdee * 0.25) / 9),
    };
  }, [user]);

  const totals = useMemo(() => {
    return meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  const macroData = [
    { label: 'Calories', consumed: totals.calories, target: targets.calories, unit: 'kcal', color: 'var(--primary)', bgClass: 'bg-success-light/40', textClass: 'text-success' },
    { label: 'Protein', consumed: totals.protein, target: targets.protein, unit: 'g', color: 'var(--secondary)', bgClass: 'bg-cyan-light/40', textClass: 'text-cyan' },
    { label: 'Carbohydrates', consumed: totals.carbs, target: targets.carbs, unit: 'g', color: 'var(--primary)', bgClass: 'bg-primary-light/40', textClass: 'text-primary' },
    { label: 'Fat', consumed: totals.fat, target: targets.fat, unit: 'g', color: 'var(--warning)', bgClass: 'bg-warning-light/40', textClass: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {macroData?.map((m) => {
        const pct = m.target > 0 ? Math.min(Math.round((m.consumed / m.target) * 100), 100) : 0;
        const isLow = pct < 50;
        return (
          <div key={`macro-summary-${m?.label}`} className={`card-base card-hover p-4 ${m?.bgClass}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m?.label}</p>
              <span className={`text-xs font-bold font-tabular ${isLow ? 'text-danger' : m?.textClass}`}>
                {pct}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className={`text-xl font-bold font-tabular ${m?.textClass}`}>{m?.consumed}</span>
              <span className="text-xs text-muted-foreground">/ {m?.target}{m?.unit}</span>
            </div>
            <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: m?.color }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {m?.target - m?.consumed > 0 ? `${m?.target - m?.consumed}${m?.unit} remaining` : 'Goal reached ✓'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
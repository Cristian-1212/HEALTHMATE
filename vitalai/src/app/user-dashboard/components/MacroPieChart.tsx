'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useMeals } from '@/context/MealContext';

const MacroPieChartInner = dynamic(() => import('./MacroPieChartInner'), { ssr: false });

export default function MacroPieChart() {
  const { meals } = useMeals();

  const macroStats = useMemo(() => {
    const totals = meals.reduce((acc, m) => ({
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }), { protein: 0, carbs: 0, fat: 0 });

    // Hardcoded targets for now, could be passed from parent or derived from Auth
    return [
      { name: 'Protein', value: totals.protein, target: 120, color: 'var(--secondary)', unit: 'g' },
      { name: 'Carbs', value: totals.carbs, target: 200, color: 'var(--primary)', unit: 'g' },
      { name: 'Fat', value: totals.fat, target: 55, color: 'var(--warning)', unit: 'g' },
    ];
  }, [meals]);

  // Data formatted specifically for the Pie chart (value in calories for proportions)
  const pieData = useMemo(() => {
    return macroStats.map(m => ({
      name: m.name,
      // Conversion to calories for visual proportion: P:4, C:4, F:9
      value: m.name === 'Fat' ? m.value * 9 : m.value * 4,
      color: m.color
    }));
  }, [macroStats]);

  return (
    <div className="card-base card-hover p-5 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Macro Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Today — consumed vs target</p>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-[160px]">
        <MacroPieChartInner data={pieData} />
      </div>
      {/* Legend */}
      <div className="space-y-2.5 mt-4 pt-4 border-t border-border">
        {macroStats.map((m) => {
          const pct = m.target > 0 ? Math.round((m.value / m.target) * 100) : 0;
          return (
            <div key={`macro-legend-${m?.name}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: m?.color }} />
                  <span className="font-medium text-foreground">{m?.name}</span>
                </div>
                <span className="font-tabular text-muted-foreground">
                  <span className="font-semibold text-foreground">{m?.value}{m?.unit}</span>
                  {' / '}{m?.target}{m?.unit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, background: m?.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
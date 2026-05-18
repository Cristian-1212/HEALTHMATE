'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const WeeklyCalorieChartInner = dynamic(() => import('./WeeklyCalorieChartInner'), { ssr: false });

export default function WeeklyCalorieChart() {
  return (
    <div className="card-base card-hover p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Weekly Calorie Intake</h3>
          <p className="text-xs text-muted-foreground mt-0.5">May 9 – May 15, 2026 vs daily goal</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-muted-foreground font-medium">Consumed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-warning" style={{ borderTop: '2px dashed var(--warning)' }} />
            <span className="text-muted-foreground font-medium">Goal</span>
          </div>
        </div>
      </div>
      <WeeklyCalorieChartInner />
    </div>
  );
}
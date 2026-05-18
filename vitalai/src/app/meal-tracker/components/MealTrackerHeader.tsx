'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Download } from 'lucide-react';

export default function MealTrackerHeader() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link href="/user-dashboard" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meal Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{today} — Log and manage your food intake</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </button>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
}
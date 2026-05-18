'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHeader() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning, {user?.name.split(' ')[0] || 'User'} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {today} — Welcome back to your dashboard
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          Updated 2 min ago
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <Link href="/meal-tracker" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Log Meal
        </Link>
      </div>
    </div>
  );
}
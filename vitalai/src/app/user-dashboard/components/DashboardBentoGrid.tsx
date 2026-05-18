'use client';

import React from 'react';
import CalorieRingCard from './CalorieRingCard';
import KPICard from './KPICard';
import { Flame, Droplets, Target, Zap, Scale } from 'lucide-react';

// Grid plan: 7 cards → grid-cols-4
// Row 1: CalorieRing spans 2 cols + 2 regular KPI cards
// Row 2: 3 regular KPI cards + 1 alert card

export default function DashboardBentoGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 lg:gap-5">
      {/* Hero: Calorie Ring — spans 2 cols, 2 rows */}
      <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
        <CalorieRingCard />
      </div>

      {/* BMI Card */}
      <KPICard
        icon={Scale}
        label="Current BMI"
        value="23.1"
        unit=""
        subtext="Normal range (18.5–24.9)"
        trend={{ direction: 'down', value: '0.3 vs last month', positive: true }}
        variant="success"
      />

      {/* Streak */}
      <KPICard
        icon={Zap}
        label="Weekly Streak"
        value="6"
        unit="days"
        subtext="On-goal streak this week"
        trend={{ direction: 'up', value: 'Best streak this month', positive: true }}
        variant="success"
      />

      {/* Water intake */}
      <KPICard
        icon={Droplets}
        label="Water Intake"
        value="1.4"
        unit="L / 2.5L"
        subtext="56% of daily target"
        trend={{ direction: 'down', value: '−1.1L remaining', positive: false }}
        variant="warning"
        alert
      />

      {/* Goal ETA */}
      <KPICard
        icon={Target}
        label="Goal ETA"
        value="Aug 22"
        unit=""
        subtext="Target: 58 kg (−7 kg left)"
        trend={{ direction: 'up', value: 'On track ↑ 3 days ahead', positive: true }}
        variant="info"
      />

      {/* Protein deficit alert */}
      <KPICard
        icon={Flame}
        label="Protein Today"
        value="42"
        unit="g / 120g"
        subtext="35% — well below target"
        trend={{ direction: 'down', value: '−78g remaining', positive: false }}
        variant="danger"
        alert
      />
    </div>
  );
}
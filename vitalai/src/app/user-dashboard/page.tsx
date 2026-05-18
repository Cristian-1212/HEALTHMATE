import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardBentoGrid from './components/DashboardBentoGrid';
import DashboardHeader from './components/DashboardHeader';
import WeeklyCalorieChart from './components/WeeklyCalorieChart';
import MacroPieChart from './components/MacroPieChart';
import TodayMealsList from './components/TodayMealsList';
import AIInsightPanel from './components/AIInsightPanel';

export default function UserDashboardPage() {
  return (
    <AppLayout activeRoute="/user-dashboard">
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto space-y-6">
        <DashboardHeader />
        <DashboardBentoGrid />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeeklyCalorieChart />
          </div>
          <div className="lg:col-span-1">
            <MacroPieChart />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodayMealsList />
          </div>
          <div className="lg:col-span-1">
            <AIInsightPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
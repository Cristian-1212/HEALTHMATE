import React from 'react';
import AppLayout from '@/components/AppLayout';
import MealTrackerHeader from './components/MealTrackerHeader';
import AIMealInputPanel from './components/AIMealInputPanel';
import DailyMacroSummary from './components/DailyMacroSummary';
import MealLogTable from './components/MealLogTable';

export default function MealTrackerPage() {
  return (
    <AppLayout activeRoute="/meal-tracker">
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto space-y-6">
        <MealTrackerHeader />
        <AIMealInputPanel />
        <DailyMacroSummary />
        <MealLogTable />
      </div>
    </AppLayout>
  );
}
'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Brain,
  RefreshCw,
  Loader2,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart2,
  Zap,
  ChevronRight,
  Star,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface AIInsight {
  id: string;
  type: 'observation' | 'warning' | 'positive';
  category: string;
  text: string;
  confidence: number;
  timestamp: string;
}

interface Prediction {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const mockInsights: AIInsight[] = [
  {
    id: 'i1',
    type: 'warning',
    category: 'Nutrition',
    text: 'Your protein intake is 65% below target today. Consider adding a protein-rich snack before dinner.',
    confidence: 0.94,
    timestamp: '2 min ago',
  },
  {
    id: 'i2',
    type: 'positive',
    category: 'Consistency',
    text: "You've maintained a calorie deficit for 6 consecutive days — your best streak this month.",
    confidence: 0.98,
    timestamp: '5 min ago',
  },
  {
    id: 'i3',
    type: 'observation',
    category: 'Eating Pattern',
    text: 'You consume 72% of daily calories before 2 PM. This front-loading pattern supports better metabolic response.',
    confidence: 0.87,
    timestamp: '10 min ago',
  },
  {
    id: 'i4',
    type: 'positive',
    category: 'Goal Progress',
    text: 'Your weekly calorie deficit average of 420 kcal/day puts you on track to reach your goal 3 days ahead of schedule.',
    confidence: 0.91,
    timestamp: '15 min ago',
  },
  {
    id: 'i5',
    type: 'warning',
    category: 'Hydration',
    text: 'Water intake has been below 1.5L for 3 consecutive days. Adequate hydration improves metabolism by up to 30%.',
    confidence: 0.89,
    timestamp: '20 min ago',
  },
  {
    id: 'i6',
    type: 'observation',
    category: 'Meal Timing',
    text: 'Your dinner is typically logged after 8 PM. Shifting dinner to 6–7 PM may improve sleep quality and fat oxidation.',
    confidence: 0.82,
    timestamp: '25 min ago',
  },
];

const predictions: Prediction[] = [
  {
    id: 'p1',
    label: 'Goal Completion',
    value: 'Aug 22, 2026',
    detail: '~9 weeks away at current pace',
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'p2',
    label: 'Projected Weight',
    value: '58.2 kg',
    detail: 'In 4 weeks based on trend',
    icon: TrendingDown,
    color: 'text-success',
    bgColor: 'bg-success-light',
  },
  {
    id: 'p3',
    label: 'Weekly Deficit',
    value: '2,940 kcal',
    detail: 'Avg 420 kcal/day this week',
    icon: BarChart2,
    color: 'text-cyan',
    bgColor: 'bg-cyan-light',
  },
  {
    id: 'p4',
    label: 'Health Score',
    value: '78 / 100',
    detail: '+5 pts vs last week',
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
];

const weeklyReport = [
  { day: 'Mon', calories: 1820, goal: 1900, onTrack: true },
  { day: 'Tue', calories: 1950, goal: 1900, onTrack: false },
  { day: 'Wed', calories: 1740, goal: 1900, onTrack: true },
  { day: 'Thu', calories: 1680, goal: 1900, onTrack: true },
  { day: 'Fri', calories: 1890, goal: 1900, onTrack: true },
  { day: 'Sat', calories: 2100, goal: 1900, onTrack: false },
  { day: 'Sun', calories: 1760, goal: 1900, onTrack: true },
];

const insightStyles = {
  observation: {
    icon: Lightbulb,
    bg: 'bg-cyan-light/40',
    border: 'border-cyan/20',
    iconColor: 'text-cyan',
    label: 'Observation',
    badgeBg: 'bg-cyan-light text-cyan',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-warning-light/40',
    border: 'border-warning/20',
    iconColor: 'text-warning',
    label: 'Action Needed',
    badgeBg: 'bg-warning-light text-warning',
  },
  positive: {
    icon: TrendingUp,
    bg: 'bg-success-light/40',
    border: 'border-success/20',
    iconColor: 'text-success',
    label: 'Great Progress',
    badgeBg: 'bg-success-light text-success',
  },
};

export default function AIInsightsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'observation' | 'warning' | 'positive'>('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsRefreshing(false);
  };

  const filtered = activeFilter === 'all' ? mockInsights : mockInsights.filter((i) => i.type === activeFilter);

  const maxCalories = Math.max(...weeklyReport.map((d) => d.calories));

  return (
    <AppLayout activeRoute="/ai-insights">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Insights</h1>
              <p className="text-sm text-muted-foreground">Powered by HealthMate Engine · Updated just now</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRefreshing ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>

        {/* Prediction Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {predictions.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="card-base p-4 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg ${p.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${p.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</p>
                  <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{p.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main content: Insights + Weekly Report */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights list */}
          <div className="lg:col-span-2 card-base flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Today's Insights</h2>
              {/* Filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'positive', 'warning', 'observation'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                      activeFilter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {isRefreshing
                ? [1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl p-4 bg-muted animate-pulse space-y-2">
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-4/5" />
                    </div>
                  ))
                : filtered.map((insight) => {
                    const style = insightStyles[insight.type];
                    const InsightIcon = style.icon;
                    return (
                      <div
                        key={insight.id}
                        className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <InsightIcon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                                {style.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{insight.category}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{insight.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-tabular whitespace-nowrap">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Weekly Report */}
          <div className="card-base flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Weekly Calorie Report</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">May 9 – May 15, 2026</p>
            </div>
            <div className="p-4 flex-1 space-y-3">
              {weeklyReport.map((day) => (
                <div key={day.day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground w-8">{day.day}</span>
                    <span className={`font-tabular ${day.onTrack ? 'text-success' : 'text-danger'}`}>
                      {day.calories.toLocaleString()} kcal
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${day.onTrack ? 'bg-success' : 'bg-danger'}`}
                      style={{ width: `${(day.calories / maxCalories) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-border mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Daily Goal</span>
                  <span className="font-tabular">1,900 kcal</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Weekly Avg</span>
                  <span className="font-tabular text-primary font-semibold">
                    {Math.round(weeklyReport.reduce((a, d) => a + d.calories, 0) / 7).toLocaleString()} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">AI Weekly Summary</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  You hit your calorie goal 5 out of 7 days this week. Your consistency improved by 18% vs last week.
                  Keep reducing evening snacks to accelerate progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Roadmap */}
        <div className="card-base p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Goal Roadmap</h2>
              <p className="text-xs text-muted-foreground mt-0.5">AI-predicted milestones to reach 58 kg</p>
            </div>
            <Link href="/ai-insights/forecast">
              <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-emerald-700 transition-colors self-start sm:self-auto">
                View Full Forecast <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { week: 'Week 1–2', milestone: 'Establish deficit routine', weight: '64.5 kg', status: 'completed' },
              { week: 'Week 3–4', milestone: 'Optimize meal timing', weight: '63.8 kg', status: 'in-progress' },
              { week: 'Week 5–6', milestone: 'Increase protein intake', weight: '62.5 kg', status: 'upcoming' },
              { week: 'Week 7–9', milestone: 'Final push to goal', weight: '58.0 kg', status: 'upcoming' },
            ].map((milestone, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 ${
                  milestone.status === 'completed'
                    ? 'bg-success-light/30 border-success/20'
                    : milestone.status === 'in-progress' ?'bg-primary/5 border-primary/20' :'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      milestone.status === 'completed'
                        ? 'bg-success'
                        : milestone.status === 'in-progress' ?'bg-primary animate-pulse' :'bg-muted-foreground/30'
                    }`}
                  />
                  <span className="text-xs font-bold text-muted-foreground">{milestone.week}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{milestone.milestone}</p>
                <p className="text-xs text-muted-foreground">Target: {milestone.weight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

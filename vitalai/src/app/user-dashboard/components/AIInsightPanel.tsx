'use client';

import React, { useState } from 'react';
import { Brain, RefreshCw, ChevronRight, Loader2, Lightbulb, AlertCircle, TrendingUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface AIInsight {
  id: string;
  type: 'observation' | 'warning' | 'positive';
  text: string;
  confidence: number;
}

const mockInsights: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'warning',
    text: 'Your protein intake is 65% below target today. Consider adding a protein-rich snack before dinner.',
    confidence: 0.94,
  },
  {
    id: 'insight-002',
    type: 'positive',
    text: 'You\'ve maintained a calorie deficit for 6 consecutive days — your best streak this month.',
    confidence: 0.98,
  },
  {
    id: 'insight-003',
    type: 'observation',
    text: 'You consume 72% of daily calories before 2 PM. This front-loading pattern supports better metabolic response.',
    confidence: 0.87,
  },
];

const insightStyles = {
  observation: { icon: Lightbulb, bg: 'bg-cyan-light/50', border: 'border-cyan/20', iconColor: 'text-cyan', label: 'Observation' },
  warning: { icon: AlertCircle, bg: 'bg-warning-light/50', border: 'border-warning/20', iconColor: 'text-warning', label: 'Action Needed' },
  positive: { icon: TrendingUp, bg: 'bg-success-light/50', border: 'border-success/20', iconColor: 'text-success', label: 'Great Progress' },
};

export default function AIInsightPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // BACKEND INTEGRATION: POST /api/ai/insights { userId, date } → returns fresh AI analysis
    await new Promise((r) => setTimeout(r, 1800));
    setIsRefreshing(false);
  };

  return (
    <div className="card-base h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by HealthMate Engine</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-ghost p-2 text-muted-foreground disabled:opacity-50"
          aria-label="Refresh AI insights"
          title="Regenerate AI insights for today"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin">
        {isRefreshing ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`insight-skeleton-${i}`} className="rounded-xl p-3 bg-muted animate-pulse space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
                <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                <div className="h-3 bg-muted-foreground/20 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : (
          insights.map((insight) => {
            const style = insightStyles[insight.type];
            const Icon = style.icon;
            return (
              <div
                key={insight.id}
                className={`rounded-xl border p-3.5 ${style.bg} ${style.border} fade-in`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${style.iconColor}`}>{style.label}</span>
                      <span className="text-xs text-muted-foreground font-tabular">
                        {Math.round(insight.confidence * 100)}% conf.
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-3 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:text-emerald-700 transition-colors">
          View Full AI Report
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  subtext: string;
  trend: { direction: 'up' | 'down'; value: string; positive: boolean };
  variant: Variant;
  alert?: boolean;
}

const variantStyles: Record<Variant, { bg: string; iconBg: string; iconColor: string; valueBorder: string }> = {
  success: {
    bg: 'bg-card',
    iconBg: 'bg-success-light',
    iconColor: 'text-success',
    valueBorder: 'border-success/20',
  },
  warning: {
    bg: 'bg-warning-light/30',
    iconBg: 'bg-warning-light',
    iconColor: 'text-warning',
    valueBorder: 'border-warning/20',
  },
  danger: {
    bg: 'bg-danger-light/30',
    iconBg: 'bg-danger-light',
    iconColor: 'text-danger',
    valueBorder: 'border-danger/20',
  },
  info: {
    bg: 'bg-card',
    iconBg: 'bg-cyan-light',
    iconColor: 'text-cyan',
    valueBorder: 'border-cyan/20',
  },
  neutral: {
    bg: 'bg-card',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    valueBorder: 'border-border',
  },
};

export default function KPICard({ icon: Icon, label, value, unit, subtext, trend, variant, alert }: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`card-hover rounded-xl border border-border shadow-sm p-4 ${styles.bg} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${styles.iconColor}`} />
        </div>
        {alert && (
          <AlertTriangle className="w-4 h-4 text-warning" />
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-metric-lg font-bold text-foreground font-tabular">{value}</span>
          {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
      </div>

      <div className={`flex items-center gap-1.5 text-xs font-medium ${trend.positive ? 'text-success' : 'text-danger'}`}>
        {trend.direction === 'up' ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span>{trend.value}</span>
      </div>
    </div>
  );
}
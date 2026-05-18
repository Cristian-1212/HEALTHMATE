'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const weeklyData = [
  { day: 'Fri 9', calories: 1920, goal: 1850, over: true },
  { day: 'Sat 10', calories: 2180, goal: 1850, over: true },
  { day: 'Sun 11', calories: 1650, goal: 1850, over: false },
  { day: 'Mon 12', calories: 1780, goal: 1850, over: false },
  { day: 'Tue 13', calories: 1830, goal: 1850, over: false },
  { day: 'Wed 14', calories: 1590, goal: 1850, over: false },
  { day: 'Thu 15', calories: 1248, goal: 1850, over: false },
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const cal = payload[0]?.value ?? 0;
  const isOver = cal > 1850;
  return (
    <div className="bg-card border border-border rounded-xl shadow-modal px-4 py-3 min-w-[140px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      <p className="text-lg font-bold text-foreground font-tabular">{cal.toLocaleString()} kcal</p>
      <p className={`text-xs font-medium mt-1 ${isOver ? 'text-danger' : 'text-success'}`}>
        {isOver ? `+${(cal - 1850).toLocaleString()} over goal` : `${(1850 - cal).toLocaleString()} under goal`}
      </p>
    </div>
  );
}

export default function WeeklyCalorieChartInner() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weeklyData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          domain={[0, 2400]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', radius: 6 }} />
        <ReferenceLine
          y={1850}
          stroke="var(--warning)"
          strokeDasharray="5 3"
          strokeWidth={2}
          label={{ value: 'Goal', position: 'right', fontSize: 10, fill: 'var(--warning)', fontWeight: 600 }}
        />
        <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
          {weeklyData.map((entry, index) => (
            <Cell
              key={`cell-week-${index}`}
              fill={entry.over ? 'var(--danger)' : entry.day === 'Thu 15' ? 'var(--primary)' : 'var(--secondary)'}
              fillOpacity={entry.day === 'Thu 15' ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface CalorieRingChartProps {
  consumed: number;
  goal: number;
}

export default function CalorieRingChart({ consumed, goal }: CalorieRingChartProps) {
  const pct = Math.min(Math.round((consumed / goal) * 100), 100);
  const data = [{ name: 'Consumed', value: pct, fill: 'var(--primary)' }];

  return (
    <div className="relative w-48 h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'var(--muted)' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={7}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground font-tabular">{pct}%</span>
        <span className="text-xs text-muted-foreground font-medium">of goal</span>
      </div>
    </div>
  );
}
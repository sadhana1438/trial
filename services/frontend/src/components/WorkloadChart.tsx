'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { UserScoreSummary } from '../lib/types';

interface WorkloadChartProps {
  users: UserScoreSummary[];
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ users }) => {
  // Synthesize assigned vs hidden hours from users' capacity and workload score
  const chartData = users.map((u) => {
    const totalScore = u.w_total ?? 0.8;
    // Split: ~60% assigned work, ~40% hidden collaboration hours
    const effectiveHours = totalScore * u.daily_capacity;
    const assignedHours = Number((effectiveHours * 0.65).toFixed(1));
    const hiddenHours = Number((effectiveHours * 0.35).toFixed(1));

    return {
      name: u.name.split(' ')[0], // First name
      fullName: u.name,
      assigned: assignedHours,
      hidden: hiddenHours,
      total: Number(effectiveHours.toFixed(1)),
      capacity: u.daily_capacity,
      score: totalScore,
      isOverloaded: u.is_overloaded,
    };
  });

  return (
    <div className="rounded-2xl glass-panel p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Daily Workload Distribution</h2>
          <p className="text-xs text-slate-400">Assigned Backlog vs. Hidden Collaboration Hours</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Formula v2.0
          </span>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="h" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: string) => [
                `${value} hrs`,
                name === 'assigned' ? 'Assigned Work' : 'Hidden Collaboration',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (value === 'assigned' ? 'Assigned Tasks' : 'Cross-Team Support (Hidden)')}
            />
            {/* Standard 8h Capacity reference line */}
            <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '8h Cap', fill: '#ef4444', fontSize: 10 }} />
            <Bar dataKey="assigned" name="assigned" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
            <Bar dataKey="hidden" name="hidden" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

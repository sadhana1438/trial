'use client';

import React from 'react';
import { Activity, Scale, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface KpiGridProps {
  healthPct?: number;
  workloadPct?: number;
  hiddenHours?: number;
  bottleneckCount?: number;
  delayRisk?: string;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
  healthPct = 88.5,
  workloadPct = 94,
  hiddenHours = 14.2,
  bottleneckCount = 1,
  delayRisk = 'HIGH',
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Project Health */}
      <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Project Health</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{healthPct}%</span>
          <span className="text-xs text-emerald-400 font-medium">On Schedule</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Velocity within baseline range</p>
      </div>

      {/* 2. Overall Workload */}
      <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Overall Workload</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-indigo-300">{workloadPct}%</span>
          <span className="text-xs text-indigo-400 font-medium">Team Capacity</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Across 3 active engineers</p>
      </div>

      {/* 3. Hidden Work Hours */}
      <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Hidden Work Hours</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-amber-400">+{hiddenHours}h</span>
          <span className="text-xs text-amber-400/90 font-medium">Unlogged</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">PR reviews & Slack support</p>
      </div>

      {/* 4. Bottleneck Count */}
      <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Active Bottlenecks</span>
          <div className={`p-1.5 rounded-lg ${bottleneckCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono ${bottleneckCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {bottleneckCount} Critical
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Sarah Chen (W = 1.29)</p>
      </div>

      {/* 5. Delay Risk */}
      <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Delay Risk Level</span>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-red-400">{delayRisk}</span>
          <span className="text-xs text-red-400/90 font-medium">Critical Path</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">EQ-103 threatened (+2.5d)</p>
      </div>
    </section>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  ArrowRight,
  GitPullRequestDraft,
  Clock,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CriticalBottleneckCardProps {
  memberName?: string;
  workloadPct?: number;
  blockedTasksCount?: number;
  taskId?: string;
  taskExternalId?: string;
  taskTitle?: string;
  fromMemberId?: string;
  toMemberId?: string;
  toMemberName?: string;
}

export const CriticalBottleneckCard: React.FC<CriticalBottleneckCardProps> = ({
  memberName = 'Sarah Chen',
  workloadPct = 129,
  blockedTasksCount = 3,
  taskId = 't-101',
  taskExternalId = 'EQ-101',
  taskTitle = 'Implement Redis Stream Consumer in Intelligence Engine',
  fromMemberId = 'u-sarah-chen',
  toMemberId = 'u-alex-rivera',
  toMemberName = 'Alex Rivera',
}) => {
  const simulationUrl = `/simulation?taskId=${taskId}&from=${fromMemberId}&to=${toMemberId}`;

  return (
    <div className="rounded-xl bg-gradient-to-br from-red-950/40 via-[#0f172a] to-slate-900 border border-red-500/40 p-6 shadow-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Summary Banner & Member Alert */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                  Critical Bottleneck Detected
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  Risk Level: HIGH
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {memberName} — <span className="text-red-400 font-mono">{workloadPct}% Workload</span>
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Currently blocking <strong className="text-white">{blockedTasksCount} downstream tasks</strong> on the critical path. Workload ratio ($W_{`\text{total}`}$) exceeds standard sustainability limit ($1.29 &gt; 1.0$), threatening release timelines by <span className="text-amber-400 font-semibold">+2.5 business days</span>.
          </p>

          {/* Root-cause Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-slate-500 font-mono uppercase">Assigned Work</span>
              <span className="font-bold text-slate-200 font-mono">7.8h / day</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-amber-500/80 font-mono uppercase">Hidden Work</span>
              <span className="font-bold text-amber-400 font-mono">+3.2h / day</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-slate-500 font-mono uppercase">Meetings (Deducted)</span>
              <span className="font-bold text-slate-300 font-mono">2.0h / day</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-indigo-400 font-mono uppercase">DAG Pressure</span>
              <span className="font-bold text-indigo-300 font-mono">Blocks EQ-102</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-purple-400 font-mono uppercase">Fragmentation</span>
              <span className="font-bold text-purple-300 font-mono">+15% Penalty</span>
            </div>
          </div>
        </div>

        {/* Right: Prescriptive Action Box */}
        <div className="lg:w-80 flex-shrink-0 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended Intervention</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Target Task: [{taskExternalId}]</span>
            <p className="font-semibold text-slate-200 line-clamp-1">{taskTitle}</p>
            <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-red-400 font-medium">{memberName}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-emerald-400 font-medium">{toMemberName}</span>
            </div>
          </div>

          <Link
            href={simulationUrl}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 group"
          >
            <GitPullRequestDraft className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span>Simulate Recommendation</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

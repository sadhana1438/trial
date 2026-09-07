'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  GitPullRequest,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { fetchUsersScores } from '@/lib/api';
import { UserScoreSummary } from '@/lib/types';

const weeklyGlueWorkData = [
  { week: 'Wk -5', reviews: 14, support: 18, meetings: 24 },
  { week: 'Wk -4', reviews: 18, support: 22, meetings: 26 },
  { week: 'Wk -3', reviews: 26, support: 28, meetings: 28 },
  { week: 'Wk -2', reviews: 31, support: 34, meetings: 30 },
  { week: 'Wk -1', reviews: 36, support: 38, meetings: 32 },
  { week: 'Current', reviews: 40, support: 42, meetings: 31 },
];

const distributionByMember = [
  { name: 'Sarah Chen', assigned: 7.8, glueWork: 3.2, meetings: 2.0 },
  { name: 'Alex Rivera', assigned: 4.8, glueWork: 1.4, meetings: 0.8 },
  { name: 'Marcus Vance', assigned: 5.2, glueWork: 2.1, meetings: 1.5 },
];

export default function AnalyticsPage() {
  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUsersScores();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Intelligence</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Analytics & Trends</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Operational Flow & Hidden Work Analytics</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Longitudinal Intelligence
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Surfacing aggregate trends across code reviews, technical support threads, and meeting overhead to safeguard sustainable delivery velocity.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-evaluative: aggregates protect psychological safety</span>
        </div>
      </div>

      {/* Analytics KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Glue Hours</span>
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">82.0h</div>
          <p className="text-[11px] text-indigo-400 font-medium">+14% vs trailing sprint</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>PR Review Load</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">40 Reviews</div>
          <p className="text-[11px] text-emerald-400 font-medium">Avg turn-around 3.8 hrs</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Meeting Overhead</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">31.0h / wk</div>
          <p className="text-[11px] text-amber-400 font-medium">~18% of available sprint time</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Workload Imbalance Ratio</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">2.08x</div>
          <p className="text-[11px] text-rose-400/90 font-medium">High variance across squad</p>
        </div>
      </div>

      {/* Chart 1: Glue Work Trajectory by Category */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Invisible Work Growth by Category (Trailing 6 Weeks)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total hours committed to PR reviews, technical unblocking, and meeting context switches.
          </p>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyGlueWorkData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="h" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="reviews" name="PR Reviews" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="support" name="Support Threads" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="meetings" name="Syncs & Meetings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Member Daily Time Allocation */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Daily Hours Breakdown: Assigned vs Collaboration vs Meetings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Shows how Sarah Chen's 8h nominal capacity is consumed by 13.0h of actual commitments.
          </p>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distributionByMember}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={11} unit="h" domain={[0, 14]} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="assigned" name="Assigned Tasks" fill="#3b82f6" stackId="a" />
              <Bar dataKey="glueWork" name="Hidden Glue Work" fill="#ec4899" stackId="a" />
              <Bar dataKey="meetings" name="Meetings & Syncs" fill="#eab308" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

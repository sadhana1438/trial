'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  GitPullRequest,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
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

// Trailing 6 weeks longitudinal trend data
const historicalTrends = [
  { week: 'Wk -5', sarah: 0.88, alex: 0.55, marcus: 0.70 },
  { week: 'Wk -4', sarah: 0.95, alex: 0.58, marcus: 0.72 },
  { week: 'Wk -3', sarah: 1.05, alex: 0.60, marcus: 0.76 },
  { week: 'Wk -2', sarah: 1.15, alex: 0.64, marcus: 0.80 },
  { week: 'Wk -1', sarah: 1.22, alex: 0.61, marcus: 0.82 },
  { week: 'Current', sarah: 1.29, alex: 0.62, marcus: 0.84 },
];

export default function WorkloadPage() {
  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUsersScores();
        setUsers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Intelligence</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Workload Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Team Workload & Capacity Truth Matrix</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Formula v2.0
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Surfacing the gap between nominal Jira/ticket assignments and reality. EquiFlow continuously models glue work, PR reviews, meetings, and context switching.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privacy Preserved: 90-day rolling aggregate</span>
        </div>
      </div>

      {/* Hero Banner: ASSIGNED WORK ≠ ACTUAL WORK */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/30 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-wide uppercase">
              Core Architectural Principle
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-100">
              ASSIGNED WORK ≠ ACTUAL WORK
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional issue trackers measure assigned story points. In reality, senior engineers spend 30-45% of their working day reviewing code, unblocking colleagues in Slack, and navigating fragmented meeting schedules.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 font-mono text-xs text-indigo-300 space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Workload Formulation (CPM / DAG Engine)
            </div>
            <div className="text-sm text-slate-100 font-bold">
              W_total = [ (T_assigned + H_tracked) / (C_daily - M_meetings) ] × (1 + F_frag) × R_rework
            </div>
            <div className="text-[11px] text-slate-400">
              Where C_daily - M_meetings is floored at 0.5h to prevent ratio singularity.
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Workload Truth Matrix */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Member Capacity & Load Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing nominal assigned hours against holistic actual load factoring in hidden contributions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned (T)</th>
                <th className="py-3 px-4">Hidden (H)</th>
                <th className="py-3 px-4">Meetings (M)</th>
                <th className="py-3 px-4">Fragmentation</th>
                <th className="py-3 px-4">Actual W_total</th>
                <th className="py-3 px-4">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const loadPct = u.w_total ? Math.round(u.w_total * 100) : 100;
                return (
                  <tr key={u.user_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {u.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{u.role}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {u.assigned_hours || 6.0}h / day
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold">
                      +{u.hidden_hours || 1.5}h / day
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-300">
                      {u.meeting_hours || 1.0}h / day
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      +{u.user_id === 'u-sarah-chen' ? '15%' : '5%'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            u.is_overloaded ? 'text-rose-400' : 'text-slate-200'
                          }`}
                        >
                          {loadPct}%
                        </span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              u.is_overloaded ? 'bg-rose-500' : loadPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(loadPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_overloaded ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Overloaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trailing 6-Week Longitudinal Trend Chart */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Trailing 6-Week Workload Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking team member workload velocity over time. Sarah Chen crossed critical threshold in Wk -3.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-300">Sarah Chen</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-slate-300">Alex Rivera</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Marcus Vance</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                domain={[0.4, 1.4]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${(Number(val) * 100).toFixed(0)}%`, 'Workload']}
              />
              <Line
                type="monotone"
                dataKey="sarah"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ fill: '#f43f5e', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="alex"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="marcus"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

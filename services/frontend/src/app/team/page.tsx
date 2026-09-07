'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  GitPullRequest,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { fetchUsersScores } from '@/lib/api';
import { UserScoreSummary } from '@/lib/types';

export default function TeamPage() {
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
            <span>Team</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Members & Capacity</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Engineering Squad Capacity & Collaboration</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {users.length} Active Engineers
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Highlighting essential cross-team contributions, code review volume, and mentoring hours to safeguard sustainable bandwidth across the team.
          </p>
        </div>

        {/* Ethical disclaimer badge */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No individual surveillance or competitive ranking</span>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map((user) => {
          const loadPct = user.w_total ? Math.round(user.w_total * 100) : 100;
          return (
            <div
              key={user.user_id}
              className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                user.is_overloaded
                  ? 'bg-gradient-to-b from-rose-950/20 to-slate-900/60 border-rose-500/30 shadow-lg shadow-rose-950/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-5">
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-base font-bold text-indigo-300">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{user.name}</h3>
                      <p className="text-xs text-slate-400">{user.role}</p>
                      <span className="text-[11px] font-mono text-slate-500">@{user.github_username}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      user.is_overloaded
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {user.is_overloaded ? 'Overloaded' : 'Balanced'}
                  </span>
                </div>

                {/* Workload Metric Bar */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Workload (W_total):</span>
                    <span
                      className={`font-mono font-bold ${
                        user.is_overloaded ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {loadPct}% ({user.w_total ? user.w_total.toFixed(2) : '1.00'})
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        user.is_overloaded ? 'bg-rose-500' : loadPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(loadPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                    <span>Assigned: {user.assigned_hours || 6.0}h</span>
                    <span>Hidden: +{user.hidden_hours || 1.5}h</span>
                  </div>
                </div>

                {/* Collaboration & Glue Work Metrics */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                    Recognized Glue Work (Last 14 Days)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center space-x-2">
                      <GitPullRequest className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-slate-200 block">
                          {user.pr_reviews_count || 4}
                        </span>
                        <span className="text-[10px] text-slate-400">PR Reviews</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-slate-200 block">
                          {user.support_contributions || 8}
                        </span>
                        <span className="text-[10px] text-slate-400">Support Assists</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Competencies */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                    Verified Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.user_id === 'u-sarah-chen' && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                          Python
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                          Redis Streams
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                          FastAPI
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                          Architecture
                        </span>
                      </>
                    )}
                    {user.user_id === 'u-alex-rivera' && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                          React / Next.js
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                          TypeScript
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                          ReactFlow
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                          UI Architecture
                        </span>
                      </>
                    )}
                    {user.user_id === 'u-marcus-vance' && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                          PostgreSQL
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                          Supabase
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                          Docker / CI
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                          Reliability
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.daily_capacity}h / day capacity</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">v2.0.0</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical Guarantee Box */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>EquiFlow Engineering Ethics Charter</span>
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            EquiFlow is purposefully engineered to prevent burnout and dismantle invisible uncredited labor. It explicitly prohibits employee leaderboard rankings, keystroke logging, and punitive performance automation.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shrink-0">
          SOC2 & GDPR Compliant
        </div>
      </div>
    </div>
  );
}

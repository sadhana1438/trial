'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Users,
  GitPullRequest,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { fetchCriticalBottlenecks, fetchProjectTasks, fetchUsersScores } from '@/lib/api';
import { BottleneckDetail, TaskItem, UserScoreSummary } from '@/lib/types';

export default function BottlenecksPage() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckDetail[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [bData, tData, uData] = await Promise.all([
          fetchCriticalBottlenecks(),
          fetchProjectTasks(),
          fetchUsersScores(),
        ]);
        setBottlenecks(bData);
        setTasks(tData.tasks);
        setUsers(uData);
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

  const primaryBottleneck = bottlenecks[0];
  const affectedTasks = tasks.filter((t) =>
    primaryBottleneck?.affected_downstream_task_ids?.includes(t.id)
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Intelligence</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Bottlenecks</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Critical Path Bottleneck Radar</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              1 Critical Bottleneck Detected
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time critical-path choke point detection. EquiFlow identifies schedule-threatening dependencies and structural workload concentrations before deadlines slip.
          </p>
        </div>

        {/* Ethical disclaimer pill */}
        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Diagnostic support for workflow friction, not personal performance evaluation.</span>
        </div>
      </div>

      {/* Critical Bottleneck Focus Card */}
      {primaryBottleneck && (
        <div className="rounded-2xl bg-gradient-to-b from-rose-950/20 to-slate-900/60 border border-rose-500/30 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400">
                    Primary Flow Blocker
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                    W_total = 1.29 (129% Load)
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                  {primaryBottleneck.member_name} — Critical Path Saturation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned to <strong>{primaryBottleneck.critical_task_external_id}</strong> which blocks {primaryBottleneck.blocked_tasks_count} downstream tasks on the project critical path.
                </p>
              </div>
            </div>

            {/* Direct CTA to Simulation */}
            <Link
              href={`/simulation?taskId=${primaryBottleneck.recommended_action.task_id}&from=${primaryBottleneck.recommended_action.from_member_id}&to=${primaryBottleneck.recommended_action.to_member_id}`}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Recommended Intervention</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Root-Cause Drivers Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Assigned Tasks</span>
              </span>
              <div className="text-lg font-bold text-slate-200 font-mono">
                {primaryBottleneck.reasons.assigned_workload_hrs}h / day
              </div>
              <span className="text-[11px] text-slate-400">97.5% nominal capacity</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-indigo-400 flex items-center space-x-1">
                <GitPullRequest className="w-3 h-3 text-indigo-400" />
                <span>Hidden Glue Work</span>
              </span>
              <div className="text-lg font-bold text-indigo-300 font-mono">
                +{primaryBottleneck.reasons.hidden_collaboration_hrs}h / day
              </div>
              <span className="text-[11px] text-indigo-400/80">PR reviews & code assists</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-amber-400 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Meetings & Syncs</span>
              </span>
              <div className="text-lg font-bold text-amber-300 font-mono">
                {primaryBottleneck.reasons.meetings_hrs}h / day
              </div>
              <span className="text-[11px] text-amber-400/80">Floored capacity floor</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center space-x-1">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Context Switches</span>
              </span>
              <div className="text-lg font-bold text-slate-200 font-mono">
                +{primaryBottleneck.reasons.fragmentation_penalty_pct}%
              </div>
              <span className="text-[11px] text-slate-400">Fragmentation penalty</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-rose-400 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-rose-400" />
                <span>Delay Risk Factor</span>
              </span>
              <div className="text-lg font-bold text-rose-400 font-mono">
                72% High
              </div>
              <span className="text-[11px] text-rose-400/80">Blocks 2 milestones</span>
            </div>
          </div>

          {/* Recommended Intervention Card */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                  Recommended System Action
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Zero Delay Risk Solution
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Reassign <strong>{primaryBottleneck.critical_task_external_id} ({primaryBottleneck.critical_task_title})</strong> from <strong>Sarah Chen</strong> to <strong>Alex Rivera</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                {primaryBottleneck.recommended_action.rationale}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Sarah’s Load</span>
                <span className="text-xs font-mono font-bold text-emerald-400">129% → 82%</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Alex’s Load</span>
                <span className="text-xs font-mono font-bold text-indigo-400">62% → 88%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Downstream Impacted Tasks Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Downstream Dependent Tasks (Critical Path Sequence)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These tasks cannot commence or finalize until the blocking predecessor is resolved.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {affectedTasks.length} impacted items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Hours Rem.</th>
                <th className="py-3 px-4">Dependency Edge</th>
                <th className="py-3 px-4">Delay Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {affectedTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                    {t.external_id}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {t.title}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {t.assignee_name || 'Alex Rivera'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {t.hours_remaining}h
                  </td>
                  <td className="py-3 px-4">
                    {t.external_id === 'EQ-103' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[10px]">
                        Inferred (PR Ref)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px]">
                        Explicit (Direct)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-rose-400 font-semibold">
                      {t.delay_risk_score}% Risk
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/simulation?taskId=${primaryBottleneck.recommended_action.task_id}&from=${primaryBottleneck.recommended_action.from_member_id}&to=${primaryBottleneck.recommended_action.to_member_id}`}
                      className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <span>Simulate</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

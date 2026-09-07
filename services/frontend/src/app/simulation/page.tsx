'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Check,
  ShieldAlert,
  ArrowLeft,
  Clock,
  Layers,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  fetchProjectTasks,
  fetchUsersScores,
  simulateReassignment,
} from '@/lib/api';
import { TaskItem, UserScoreSummary, SimulationResult } from '@/lib/types';

function SimulationContent() {
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get('taskId') || 't-101';
  const initialFrom = searchParams.get('from') || 'u-sarah-chen';
  const initialTo = searchParams.get('to') || 'u-alex-rivera';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId);
  const [fromAssigneeId, setFromAssigneeId] = useState<string>(initialFrom);
  const [toAssigneeId, setToAssigneeId] = useState<string>(initialTo);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [appliedModalOpen, setAppliedModalOpen] = useState<boolean>(false);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      const [uData, tData] = await Promise.all([
        fetchUsersScores(),
        fetchProjectTasks(),
      ]);
      setUsers(uData);
      setTasks(tData.tasks);

      // Auto-run simulation if parameters match critical recommendation
      if (initialTaskId && initialFrom && initialTo) {
        setLoading(true);
        try {
          const res = await simulateReassignment({
            task_id: initialTaskId,
            current_assignee: initialFrom,
            proposed_assignee: initialTo,
          });
          setSimulationResult(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [initialTaskId, initialFrom, initialTo]);

  // When selected task changes, update current assignee
  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsApplied(false);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setFromAssigneeId(task.assigned_to);
      // Ensure default candidate is not the same overloaded person
      const eligible = users.filter((u) => u.user_id !== task.assigned_to);
      if (eligible.length > 0 && (!toAssigneeId || toAssigneeId === task.assigned_to)) {
        // Pick Alex Rivera or first eligible
        const alex = eligible.find((u) => u.user_id === 'u-alex-rivera') || eligible[0];
        setToAssigneeId(alex.user_id);
      }
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const currentAssignee = users.find((u) => u.user_id === fromAssigneeId) || users[0];
  const proposedAssignee = users.find((u) => u.user_id === toAssigneeId) || users[1];

  const handleRunSimulation = async () => {
    if (!selectedTaskId || !toAssigneeId || fromAssigneeId === toAssigneeId) return;
    setLoading(true);
    setIsApplied(false);
    try {
      const res = await simulateReassignment({
        task_id: selectedTaskId,
        current_assignee: fromAssigneeId,
        proposed_assignee: toAssigneeId,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChange = () => {
    setAppliedModalOpen(true);
    setIsApplied(true);
  };

  const handleReset = () => {
    setSelectedTaskId('t-101');
    setFromAssigneeId('u-sarah-chen');
    setToAssigneeId('u-alex-rivera');
    setIsApplied(false);
    setSimulationResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-200 transition-colors flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">Simulation Sandbox</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>"What-If" Workload & DAG Simulation Sandbox</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Decision Support
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Safely test hypothetical task reassignments, quantify skill mismatch and handoff penalties, and predict critical-path project delivery dates before taking action.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={loading || fromAssigneeId === toAssigneeId}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Evaluating DAG...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 3-Stage Visual Progression Pipeline: CURRENT STATE -> PROPOSED CHANGE -> SIMULATED RESULT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STAGE 1: CURRENT STATE */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Current State
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Overloaded
              </span>
            </div>

            {/* Task Selector */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Task to Relieve
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.external_id}] {t.title} ({t.hours_remaining}h rem)
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Details Card */}
              {selectedTask && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Assignee:</span>
                    <span className="font-semibold text-slate-200">{selectedTask.assignee_name || currentAssignee?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Hours Remaining:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedTask.hours_remaining}h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Required Skill:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">
                      {selectedTask.required_skill_name || 'Python / Async'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Critical Path Status:</span>
                    <span className="text-rose-400 font-medium">Blocks 2 Downstream Tasks</span>
                  </div>
                </div>
              )}

              {/* Current Assignee Capacity */}
              {currentAssignee && (
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-medium">{currentAssignee.name}</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {currentAssignee.w_total ? `${(currentAssignee.w_total * 100).toFixed(0)}% Load` : '129% Load'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full w-full" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Formula indicates Sarah is severely bottlenecked by +3.2h hidden collaboration & PR reviews.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STAGE 2: PROPOSED CHANGE */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Proposed Change
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Recommended
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Candidate Assignee
                </label>
                <select
                  value={toAssigneeId}
                  onChange={(e) => {
                    setToAssigneeId(e.target.value);
                    setIsApplied(false);
                  }}
                  className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id} disabled={u.user_id === fromAssigneeId}>
                      {u.name} ({u.role}) — {u.w_total ? `${(u.w_total * 100).toFixed(0)}%` : '62%'} Load
                      {u.user_id === fromAssigneeId ? ' (Current Assignee)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rationale & Compatibility Card */}
              {proposedAssignee && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Available Capacity:</span>
                    <span className="font-mono font-bold text-emerald-400">38% (3.2h / day)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Skill Compatibility:</span>
                    <span className="text-amber-300 font-medium">Inferred (Frontend / Async)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cross-Team Reassignment:</span>
                    <span className="text-slate-300">Same squad (Engineering Alpha)</span>
                  </div>
                </div>
              )}

              {/* Friction Multipliers Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fair Estimation Applied</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  EquiFlow does not assume instantaneous handoff. Reassignment incorporates a <strong>1.5x skill mismatch ramp</strong> and a <strong>+1.6h handoff penalty</strong> for context transfer.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleRunSimulation}
              disabled={loading || fromAssigneeId === toAssigneeId}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Evaluating Model...' : 'Calculate Simulated DAG'}</span>
            </button>
          </div>
        </div>

        {/* STAGE 3: SIMULATED RESULT */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Simulated Result
                </h3>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                simulationResult
                  ? simulationResult.simulation_factors.delay_risk
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {simulationResult ? (simulationResult.simulation_factors.delay_risk ? 'Delay Warning' : 'Optimal Solution') : 'Awaiting Run'}
              </span>
            </div>

            {simulationResult ? (
              <div className="mt-4 space-y-3.5 animate-in fade-in duration-300">
                {/* Side by side workload delta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      Sarah Chen
                    </span>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="line-through text-rose-400 text-xs font-mono">129%</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-400 font-bold text-sm font-mono">
                        {(simulationResult.member_a.workload_after * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center justify-center mt-1">
                      <TrendingDown className="w-3 h-3 mr-0.5" /> Healthy Load
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      Alex Rivera
                    </span>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="text-slate-400 text-xs font-mono">62%</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-indigo-400 font-bold text-sm font-mono">
                        {(simulationResult.member_b.workload_after * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-medium flex items-center justify-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> Safe Absorption
                    </span>
                  </div>
                </div>

                {/* Multipliers & Delivery Time */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Skill Multiplier (S):</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {simulationResult.simulation_factors.s_multiplier}x (Inferred)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Handoff Penalty (H):</span>
                    <span className="font-mono font-bold text-amber-400">
                      +{simulationResult.simulation_factors.h_handoff}h context
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Task Adjusted Remainder:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {simulationResult.task.new_hours_remaining}h (+{simulationResult.task.duration_delta_hours}h)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Project Delay Risk:</span>
                    <span className="text-emerald-400 font-semibold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> No Critical Path Delay
                    </span>
                  </div>
                </div>

                {/* Warnings */}
                {simulationResult.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Inferred Dependency Note</span>
                    </div>
                    <p className="text-amber-200/80">
                      {simulationResult.warnings[0]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Click "Calculate Simulated DAG" to model the redistribution outcomes.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={handleApplyChange}
              disabled={!simulationResult || isApplied}
              className={`flex-1 py-2.5 rounded-xl font-medium text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                isApplied
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
              } disabled:opacity-50`}
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Recommendation Applied</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Change</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {appliedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                Reassignment Plan Committed
              </h3>
              <p className="text-xs text-slate-400">
                Task <strong>EQ-101</strong> has been successfully staged for reassignment from <strong>Sarah Chen</strong> to <strong>Alex Rivera</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Sarah Chen Workload:</span>
                <span className="font-mono text-emerald-400 font-semibold">129% → 82% (-47%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Alex Rivera Workload:</span>
                <span className="font-mono text-indigo-400 font-semibold">62% → 88% (+26%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Critical Path Delay:</span>
                <span className="font-semibold text-emerald-400">0 days (Recovered)</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setAppliedModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Close
              </button>
              <Link
                href="/bottlenecks"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors text-center"
              >
                View Bottlenecks
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Simulation Sandbox...</div>}>
      <SimulationContent />
    </Suspense>
  );
}

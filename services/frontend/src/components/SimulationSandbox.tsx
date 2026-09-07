'use client';

import React, { useState } from 'react';
import { TaskItem, UserScoreSummary, SimulationResult } from '../lib/types';
import { simulateReassignment } from '../lib/api';
import {
  Play,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SimulationSandboxProps {
  tasks: TaskItem[];
  users: UserScoreSummary[];
  selectedTaskId: string | null;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  tasks,
  users,
  selectedTaskId,
}) => {
  const [targetTaskId, setTargetTaskId] = useState<string>(selectedTaskId || tasks[0]?.id || '');
  const [proposedAssigneeId, setProposedAssigneeId] = useState<string>(users[1]?.user_id || '');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with prop change
  React.useEffect(() => {
    if (selectedTaskId) {
      setTargetTaskId(selectedTaskId);
    }
  }, [selectedTaskId]);

  const selectedTask = tasks.find((t) => t.id === targetTaskId) || tasks[0];
  const currentAssignee = users.find((u) => u.user_id === selectedTask?.assigned_to) || users[0];

  const handleRunSimulation = async () => {
    if (!selectedTask || !proposedAssigneeId) return;

    setLoading(true);
    try {
      const result = await simulateReassignment({
        task_id: selectedTask.id,
        current_assignee: currentAssignee.user_id,
        proposed_assignee: proposedAssigneeId,
      });
      setSimulationResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      {/* Sandbox Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100">"What-If" Reassignment Sandbox</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test hypothetical workload redistributions and calculate critical-path deadline impact before committing.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{loading ? 'Calculating DAG...' : 'Simulate Reassignment'}</span>
        </button>
      </div>

      {/* Control Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 mb-6">
        {/* Task Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Task to Offload</label>
          <select
            value={targetTaskId}
            onChange={(e) => setTargetTaskId(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.external_id}] {t.title} ({t.hours_remaining}h rem) - Assignee: {t.assignee_name || 'Sarah Chen'}
              </option>
            ))}
          </select>
        </div>

        {/* Proposed Assignee Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Candidate Assignee</label>
          <select
            value={proposedAssigneeId}
            onChange={(e) => setProposedAssigneeId(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name} ({u.role}) - Current Workload: {u.w_total ? `${(u.w_total * 100).toFixed(0)}%` : '62%'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulation Result Render */}
      {simulationResult ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Side-by-Side Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Member A (Current) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200">{simulationResult.member_a.name} (Relieved)</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Offloading Task
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Workload Before:</span>
                <span className={`font-mono font-bold ${simulationResult.member_a.workload_before > 1.0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {(simulationResult.member_a.workload_before * 100).toFixed(0)}% (W = {simulationResult.member_a.workload_before})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-400">Workload After:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(simulationResult.member_a.workload_after * 100).toFixed(0)}% (W = {simulationResult.member_a.workload_after})
                </span>
              </div>
            </div>

            {/* Member B (Proposed) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200">{simulationResult.member_b.name} (Recipient)</span>
                <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Assuming Task
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Workload Before:</span>
                <span className="font-mono font-bold text-slate-200">
                  {(simulationResult.member_b.workload_before * 100).toFixed(0)}% (W = {simulationResult.member_b.workload_before})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-400">Workload After:</span>
                <span className={`font-mono font-bold ${simulationResult.member_b.workload_after > 1.0 ? 'text-red-400' : 'text-indigo-400'}`}>
                  {(simulationResult.member_b.workload_after * 100).toFixed(0)}% (W = {simulationResult.member_b.workload_after})
                </span>
              </div>
            </div>
          </div>

          {/* Friction & Critical Path Factors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
              <span className="block text-[10px] uppercase text-slate-500 font-semibold">Skill Multiplier</span>
              <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
                {simulationResult.simulation_factors.s_multiplier}x
              </span>
              <span className="text-[10px] text-slate-400">
                {simulationResult.simulation_factors.is_inferred_skill ? 'Inferred Rating' : 'Direct Match'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
              <span className="block text-[10px] uppercase text-slate-500 font-semibold">Handoff Penalty</span>
              <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                +{simulationResult.simulation_factors.h_handoff}h
              </span>
              <span className="text-[10px] text-slate-400">Context Transfer</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
              <span className="block text-[10px] uppercase text-slate-500 font-semibold">Duration Delta</span>
              <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                +{simulationResult.task.duration_delta_hours}h
              </span>
              <span className="text-[10px] text-slate-400">Total Adjusted E_new</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
              <span className="block text-[10px] uppercase text-slate-500 font-semibold">Deadline Status</span>
              <span
                className={`text-sm font-bold font-mono mt-0.5 block ${
                  simulationResult.simulation_factors.delay_risk ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {simulationResult.simulation_factors.delay_risk ? 'Breach Risk' : 'On Track'}
              </span>
              <span className="text-[10px] text-slate-400">Critical Path Check</span>
            </div>
          </div>

          {/* Low Confidence & Inferred Edge Warnings */}
          {simulationResult.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="flex items-center space-x-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Simulation Confidence Notes:</span>
              </div>
              {simulationResult.warnings.map((w, idx) => (
                <p key={idx} className="text-[11px] text-amber-200/90 pl-6">• {w}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-500">
          Click "Simulate Reassignment" above to project workload and downstream DAG shifts.
        </div>
      )}
    </div>
  );
};

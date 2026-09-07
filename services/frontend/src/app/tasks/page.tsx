'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  X,
  ShieldAlert,
  HelpCircle,
  GitPullRequest,
  CheckCircle2,
} from 'lucide-react';
import { fetchProjectTasks, fetchUsersScores } from '@/lib/api';
import { TaskItem, UserScoreSummary } from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [tData, uData] = await Promise.all([
          fetchProjectTasks(),
          fetchUsersScores(),
        ]);
        setTasks(tData.tasks);
        setUsers(uData);
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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAssignee = (userId: string) => users.find((u) => u.user_id === userId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Main</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Tasks</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Critical Path & Task Management</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tasks.length} Tracked Tasks
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Inspecting scheduled sprint deliverables, explicit dependency links, inferred heuristic edge crossings, and downstream delay sensitivities.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {['ALL', 'IN_PROGRESS', 'TODO', 'DONE'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Est / Rem</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dependencies</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((task) => {
                const assignee = getAssignee(task.assigned_to);
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`cursor-pointer hover:bg-slate-800/40 transition-colors ${
                      task.is_bottleneck ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {task.external_id}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-100 flex items-center space-x-2">
                        <span>{task.title}</span>
                        {task.is_bottleneck && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Bottleneck
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>Skill: {task.required_skill_name}</span>
                        <span>•</span>
                        <span>Complexity: {task.complexity}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{task.assignee_name || assignee?.name}</div>
                      <div className="text-[11px] text-slate-400">{assignee?.role}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span>{task.hours_remaining}h</span>
                      <span className="text-slate-500 text-[11px]"> / {task.estimated_hours}h</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        task.status === 'IN_PROGRESS'
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          : task.status === 'DONE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {task.blocks && task.blocks.length > 0 ? (
                        <span className="text-rose-400 font-medium text-[11px]">
                          Blocks {task.blocks.join(', ')}
                        </span>
                      ) : task.blocked_by && task.blocked_by.length > 0 ? (
                        <span className="text-amber-400 font-medium text-[11px]">
                          Blocked by {task.blocked_by.join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {task.is_bottleneck ? (
                        <Link
                          href={`/simulation?taskId=${task.id}&from=${task.assigned_to}&to=u-alex-rivera`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Simulate</span>
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Task Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2 font-mono text-sm font-bold text-indigo-400">
                  <span>{selectedTask.external_id}</span>
                  {selectedTask.is_bottleneck && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                      Bottleneck
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {selectedTask.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Assigned to <strong className="text-slate-200">{selectedTask.assignee_name}</strong>
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-slate-200 font-semibold">{selectedTask.status}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Priority:</span>
                    <span className="text-slate-200 font-semibold">{selectedTask.priority || 'MEDIUM'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Complexity Size:</span>
                    <span className="font-mono text-indigo-400 font-bold">{selectedTask.complexity || 'M'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Required Skill:</span>
                    <span className="text-slate-200">{selectedTask.required_skill_name || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining Work:</span>
                    <span className="font-mono text-slate-200 font-bold">{selectedTask.hours_remaining}h of {selectedTask.estimated_hours}h</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Critical Path Dependency Context
                  </span>
                  {selectedTask.blocks && selectedTask.blocks.length > 0 ? (
                    <div className="text-rose-400 text-xs">
                      Directly blocking downstream deliverables: <strong>{selectedTask.blocks.join(', ')}</strong>. Delay in this task ripples through the milestone delivery date.
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">
                      No outgoing blocking edges. Task is off critical path.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Close Drawer
              </button>
              {selectedTask.is_bottleneck && (
                <Link
                  href={`/simulation?taskId=${selectedTask.id}&from=${selectedTask.assigned_to}&to=u-alex-rivera`}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs text-center shadow-lg shadow-rose-600/30 transition-all"
                >
                  Simulate Reassignment
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

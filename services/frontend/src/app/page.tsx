'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { DAGViewer } from '../components/DAGViewer';
import { WorkloadChart } from '../components/WorkloadChart';
import { GlueWorkFeed } from '../components/GlueWorkFeed';
import { SimulationSandbox } from '../components/SimulationSandbox';
import { useAlertsWebSocket } from '../hooks/useAlertsWebSocket';
import {
  fetchUsersScores,
  fetchProjectTasks,
  fetchRecentGlueWork,
} from '../lib/api';
import { UserScoreSummary, TaskItem, DependencyItem, WorkEventItem } from '../lib/types';
import { AlertCircle, Clock, Sparkles, X, Users, Network, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { activeAlert, isConnected, dismissAlert } = useAlertsWebSocket();

  const [users, setUsers] = useState<UserScoreSummary[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [glueWork, setGlueWork] = useState<WorkEventItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [u, t, g] = await Promise.all([
        fetchUsersScores(),
        fetchProjectTasks(),
        fetchRecentGlueWork(),
      ]);
      setUsers(u);
      setTasks(t.tasks);
      setDependencies(t.dependencies);
      setGlueWork(g);
      if (t.tasks.length > 0) {
        setSelectedTaskId(t.tasks[0].id);
      }
    }
    loadData();
  }, []);

  const hasOverloaded = users.some((u) => u.is_overloaded) || !!activeAlert;
  const totalHiddenHours = glueWork.reduce((acc, curr) => acc + curr.weight_hours, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar isConnected={isConnected} hasOverloadedMembers={hasOverloaded} />

      {/* Real-Time Alert Banner (Triggered by WebSocket) */}
      {activeAlert && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-6 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
              <span>
                <strong>Real-Time Overload Alert:</strong> {activeAlert.user_name} reached W_total ={' '}
                <strong>{activeAlert.w_total}</strong> (Threshold &gt; 1.0 breached).
              </span>
            </div>
            <button
              onClick={dismissAlert}
              className="text-red-300 hover:text-white p-1 rounded hover:bg-red-900/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* KPI Top Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl glass-panel p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Hidden Work</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-100">+{totalHiddenHours.toFixed(1)}h</span>
              <span className="text-xs text-amber-400/90 font-medium">unlogged glue work</span>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Bottlenecks Active</span>
              <div className={`p-2 rounded-xl ${hasOverloaded ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-2xl font-bold font-mono ${hasOverloaded ? 'text-red-400' : 'text-emerald-400'}`}>
                {users.filter((u) => u.is_overloaded).length || (hasOverloaded ? 1 : 0)}
              </span>
              <span className="text-xs text-slate-400">members with W &gt; 1.0</span>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Critical Path Tasks</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Network className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{tasks.length}</span>
              <span className="text-xs text-slate-400">DAG nodes active</span>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Average Velocity Health</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-100">88.5%</span>
              <span className="text-xs text-emerald-400 font-medium">On Schedule</span>
            </div>
          </div>
        </section>

        {/* Macroscopic View: ReactFlow DAG Viewer */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">Macroscopic View: Dependency & Bottleneck Graph</h2>
              <p className="text-xs text-slate-400">
                Visualizes the critical path. Dashed edges represent inferred dependencies; red pulsing nodes indicate capacity overload.
              </p>
            </div>
            <span className="text-xs text-slate-400">Click a node to configure simulation</span>
          </div>

          <DAGViewer
            tasks={tasks}
            dependencies={dependencies}
            users={users}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        </section>

        {/* Microscopic View: Assigned vs Hidden Bar Chart + Glue Work Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkloadChart users={users} />
          <GlueWorkFeed events={glueWork} />
        </section>

        {/* Decision Sandbox: What-If Simulation Engine */}
        <section>
          <SimulationSandbox
            tasks={tasks}
            users={users}
            selectedTaskId={selectedTaskId}
          />
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#090d16]">
        <p>EquiFlow v2.0 • Intelligent Dependency-Aware Workload Management Overlay</p>
        <p className="mt-1 text-[11px] text-slate-600">Zero Content Scraping • 90-Day Retention Constraint Enforced</p>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { CriticalBottleneckCard } from '../components/dashboard/CriticalBottleneckCard';
import { FiveQuestionsPanel } from '../components/dashboard/FiveQuestionsPanel';
import { DAGViewer } from '../components/DAGViewer';
import { WorkloadChart } from '../components/WorkloadChart';
import { GlueWorkFeed } from '../components/GlueWorkFeed';
import { fetchUsersScores, fetchProjectTasks, fetchRecentGlueWork } from '../lib/api';
import { UserScoreSummary, TaskItem, DependencyItem, WorkEventItem } from '../lib/types';
import { Network, Sparkles, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Top Executive KPIs */}
      <KpiGrid
        healthPct={88.5}
        workloadPct={94}
        hiddenHours={14.2}
        bottleneckCount={1}
        delayRisk="HIGH"
      />

      {/* 2. Prominent Critical Bottleneck Section */}
      <CriticalBottleneckCard
        memberName="Sarah Chen"
        workloadPct={129}
        blockedTasksCount={3}
        taskId="t-101"
        taskExternalId="EQ-101"
        taskTitle="Implement Redis Stream Consumer in Intelligence Engine"
        fromMemberId="u-sarah-chen"
        toMemberId="u-alex-rivera"
        toMemberName="Alex Rivera"
      />

      {/* 3. Five Core Decision Questions Diagnostic */}
      <FiveQuestionsPanel />

      {/* 4. Dependency Graph / Critical Path View */}
      <section className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Critical Path & Task Dependency Topography</h3>
              <p className="text-xs text-slate-400">
                Click any node to inspect details or run What-If simulations.
              </p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DAGViewer
          tasks={tasks}
          dependencies={dependencies}
          users={users}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => setSelectedTaskId(id)}
          height="400px"
        />
      </section>

      {/* 5. Assigned vs Hidden Bar Chart + Glue Work Activity Ledger */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadChart users={users} />
        <GlueWorkFeed events={glueWork} />
      </section>
    </div>
  );
}

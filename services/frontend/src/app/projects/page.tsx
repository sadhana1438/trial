'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  GitPullRequest,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Plus,
  Search,
} from 'lucide-react';
import { fetchProjects } from '@/lib/api';
import { ProjectItem } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProjects();
        setProjects(data);
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>Main</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Projects</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Portfolio & Project Overview</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {projects.length} Active Initiatives
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Track multi-project execution status, critical-path schedule buffers, and hidden collaboration footprints across engineering squads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
              project.status === 'AT_RISK'
                ? 'bg-gradient-to-b from-rose-950/20 to-slate-900/60 border-rose-500/30 shadow-lg shadow-rose-950/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    project.status === 'AT_RISK' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    {project.name}
                  </h3>
                </div>

                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  project.status === 'AT_RISK'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {project.status === 'AT_RISK' ? 'At Risk (Bottleneck)' : 'On Track'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {project.description}
              </p>

              {/* Progress & Workload Bars */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Milestone Progress:</span>
                    <span className="font-mono font-bold text-slate-200">{project.completion_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${project.completion_pct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Team Workload Saturation:</span>
                    <span className={`font-mono font-bold ${
                      project.workload_pct > 85 ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {project.workload_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.workload_pct > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${project.workload_pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Hidden Glue Work
                  </span>
                  <span className="font-mono font-bold text-indigo-400">
                    +{project.hidden_hours}h / wk
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Delay Risk
                  </span>
                  <span className={`font-mono font-bold ${
                    project.delay_risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {project.delay_risk}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>{project.active_members_count} engineers</span>
              </div>

              {project.bottleneck_count > 0 ? (
                <Link
                  href="/bottlenecks"
                  className="flex items-center space-x-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <span>Resolve {project.bottleneck_count} Bottleneck</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/tasks"
                  className="flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>View Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

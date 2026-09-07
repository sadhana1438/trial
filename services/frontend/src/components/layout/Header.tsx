'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Search,
  AlertTriangle,
  Radio,
  Bell,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAlertsWebSocket } from '../../hooks/useAlertsWebSocket';

export const Header: React.FC = () => {
  const { activeAlert, isConnected } = useAlertsWebSocket();
  const [currentProject, setCurrentProject] = useState('EquiFlow Alpha Core');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const projects = [
    'EquiFlow Alpha Core',
    'Beta Infrastructure Pipeline',
    'Linear & Jira Bi-Directional Sync',
  ];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d131f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Project Selector */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-medium text-slate-200 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Project:</span>
            <span className="font-semibold text-white">{currentProject}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          {showProjectDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-30">
              {projects.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setCurrentProject(p);
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-800 ${
                    p === currentProject ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks, engineers, repositories, or dependencies..."
            className="w-full text-xs rounded-lg bg-slate-900/90 border border-slate-700/80 pl-9 pr-12 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Bottleneck Pill, Live Sync, Notification & Profile */}
      <div className="flex items-center space-x-3.5">
        {/* Critical Bottleneck Alert Indicator */}
        <Link
          href="/bottlenecks"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/25 transition-colors animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="font-semibold text-[11px]">1 Critical Bottleneck</span>
        </Link>

        {/* Live Sync Status */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
          <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-slate-400 font-mono">{isConnected ? 'Live Sync' : 'Offline'}</span>
        </div>

        {/* Notifications Bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
        </Link>

        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
            L
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-semibold text-slate-200 block leading-tight">Lead Architect</span>
            <span className="text-[10px] text-slate-400 block leading-tight">Decision Support</span>
          </div>
        </div>
      </div>
    </header>
  );
};

'use client';

import React from 'react';
import { Activity, ShieldCheck, GitBranch, Radio, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  hasOverloadedMembers: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isConnected, hasOverloadedMembers }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">EquiFlow</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0 Overlay
              </span>
            </div>
            <p className="text-xs text-slate-400">Dependency-Aware Workload Intelligence</p>
          </div>
        </div>

        {/* Project Selector & Status Pills */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Project:</span>
            <span className="font-semibold text-slate-200">EquiFlow Alpha Core</span>
          </div>

          {/* Overload Status Indicator */}
          {hasOverloadedMembers ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-xs text-red-400 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="font-medium">Bottleneck Detected (W &gt; 1.0)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Team Velocity Healthy</span>
            </div>
          )}

          {/* Real-time WebSocket indicator */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-400 hidden sm:inline">
              {isConnected ? 'Live Sync' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

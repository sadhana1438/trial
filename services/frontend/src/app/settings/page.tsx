'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Key,
  Database,
  CheckCircle2,
  Lock,
  Save,
  HelpCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'INTELLIGENCE' | 'PRIVACY' | 'API'>('INTELLIGENCE');
  const [threshold, setThreshold] = useState<number>(1.0);
  const [fragPenalty, setFragPenalty] = useState<number>(0.15);
  const [skillMismatchMultiplier, setSkillMismatchMultiplier] = useState<number>(1.5);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [zeroScraping, setZeroScraping] = useState<boolean>(true);
  const [rankingDisabled, setRankingDisabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>System</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Platform Configuration & Governance</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Enterprise v2.0
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Configure algorithmic CPM thresholds, ethical safeguards, 90-day privacy retention limits, and secure webhook credentials.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('INTELLIGENCE')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'INTELLIGENCE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Intelligence Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('PRIVACY')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'PRIVACY'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Ethics & Privacy</span>
        </button>

        <button
          onClick={() => setActiveTab('API')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'API'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API & Stream Webhooks</span>
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {activeTab === 'INTELLIGENCE' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Workload & Bottleneck Parameters
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="font-semibold text-slate-300">
                      Overload Saturation Threshold (W_threshold)
                    </label>
                    <span className="font-mono font-bold text-indigo-400">{threshold} (100% capacity)</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    When W_total &gt; threshold, system dispatches bottleneck warnings to project leads.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="font-semibold text-slate-300">
                      Context Fragmentation Multiplier (F_frag)
                    </label>
                    <span className="font-mono font-bold text-indigo-400">+{Math.round(fragPenalty * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.01"
                    value={fragPenalty}
                    onChange={(e) => setFragPenalty(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Penalty applied to engineers with high concurrency across dissimilar repositories or Jira epics.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="font-semibold text-slate-300">
                      Skill Mismatch Ramp Multiplier (S_mismatch)
                    </label>
                    <span className="font-mono font-bold text-indigo-400">{skillMismatchMultiplier}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={skillMismatchMultiplier}
                    onChange={(e) => setSkillMismatchMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Duration expansion applied during "What-If" simulations when reassigned to non-primary competencies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PRIVACY' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Ethical Governance & Data Retention
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      90-Day Rolling Aggregate Retention
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically purge raw telemetry older than 90 days. Retains high-level trend aggregates only.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Active (90d)
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Prohibition on Employee Leaderboard Rankings
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      System hard-lock preventing creation of individual output scores or punitive stack rankings.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold flex items-center space-x-1">
                    <Lock className="w-3 h-3 mr-1" /> Locked
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Zero-Content Scraping Verification
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Verifies that PR comments and Slack thread messages are discarded immediately after structural parsing.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Enforced
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'API' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Connection Endpoints & Webhook Secrets
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">
                    FastAPI Intelligence Engine Base URL
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:8000"
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">
                    Node.js Ingestion Gateway
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:3001"
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">
                    Redis Streams Event Bus Topic
                  </label>
                  <input
                    type="text"
                    defaultValue="equiflow:events:stream"
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}

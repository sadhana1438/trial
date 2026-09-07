'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  RefreshCw,
  GitPullRequest,
  MessageSquare,
  Calendar,
  GitBranch,
} from 'lucide-react';
import { fetchIntegrations } from '@/lib/api';
import { IntegrationItem } from '@/lib/types';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data);
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>System</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Integrations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Data Ingestion & Ecosystem Connectors</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              3 Live Connectors
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time webhook listeners ingesting collaboration activity while enforcing strict Zero-Content Scraping guarantees.
          </p>
        </div>

        <button className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Zero Content Scraping Guarantee Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-100">
                Zero-Content Scraping Architecture
              </h3>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                Strict Privacy
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              EquiFlow extracts only structural metadata (diff line sizes, review counts, timestamps, thread lengths). <strong>PR bodies, code diffs, Slack messages, and meeting agendas are permanently discarded in memory</strong> before reaching the database.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shrink-0 space-y-1">
          <div className="text-emerald-400 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>HMAC SHA-256 Verified</span>
          </div>
          <div>Payloads ephemerally verified</div>
          <div>Replay attack protection active</div>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200">
                    {item.category === 'VCS' ? (
                      <GitPullRequest className="w-5 h-5 text-indigo-400" />
                    ) : item.category === 'Communication' ? (
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    ) : item.category === 'Calendar' ? (
                      <Calendar className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Layers className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{item.name}</h3>
                    <span className="text-[11px] text-slate-400">{item.category}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    item.status === 'CONNECTED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : item.status === 'COMING_SOON'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>

              {item.privacy_note && (
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                  <span className="font-semibold text-indigo-400">Privacy rule: </span>
                  {item.privacy_note}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                {item.last_synced ? `Synced ${item.last_synced}` : 'Not active'}
              </span>

              {item.status === 'CONNECTED' ? (
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Relay</span>
                </span>
              ) : item.status === 'COMING_SOON' ? (
                <span className="text-slate-500 font-medium">Roadmap Q4</span>
              ) : (
                <button className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Configure
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

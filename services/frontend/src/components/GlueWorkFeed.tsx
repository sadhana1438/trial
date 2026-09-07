'use client';

import React from 'react';
import { WorkEventItem } from '../lib/types';
import { formatCollaborationCategory } from '../lib/graphUtils';
import { GitPullRequest, MessageSquare, Calendar, HelpCircle, ArrowUpRight } from 'lucide-react';

interface GlueWorkFeedProps {
  events: WorkEventItem[];
}

export const GlueWorkFeed: React.FC<GlueWorkFeedProps> = ({ events }) => {
  return (
    <div className="rounded-2xl glass-panel p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Glue Work & Collaboration Ledger</h2>
          <p className="text-xs text-slate-400">Quantified unlogged contributions & passive metadata</p>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
          Trailing Activity
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[320px]">
        {events.map((event) => {
          const category = formatCollaborationCategory(event.event_type);

          return (
            <div
              key={event.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {/* Event Type Icon */}
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  {event.event_type === 'GITHUB_PR_REVIEW' ? (
                    <GitPullRequest className="w-4 h-4 text-sky-400" />
                  ) : event.event_type === 'SLACK_SUPPORT' ? (
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                  ) : event.event_type === 'CALENDAR_MEETING' ? (
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-200">{category}</span>
                    {event.diff_size_bucket && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                        {event.diff_size_bucket} Diff
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{event.external_reference}</p>
                </div>
              </div>

              {/* Time Weight */}
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-amber-400 font-mono">+{event.weight_hours}h</span>
                <span className="block text-[10px] text-slate-500">invisible work</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

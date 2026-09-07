'use client';

import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const FiveQuestionsPanel: React.FC = () => {
  const questions = [
    {
      q: '1. What is happening?',
      a: 'Sprint velocity is stable overall (88.5%), but hidden review and context-switching overhead is accumulating around senior architecture tasks.',
      status: 'info',
    },
    {
      q: '2. Who or what is overloaded?',
      a: 'Sarah Chen is operating at 129% capacity (W = 1.29), currently holding task EQ-101 which forms the critical path of the release.',
      status: 'critical',
    },
    {
      q: '3. Why is it happening?',
      a: 'Sarah is handling 3.2h/day of unlogged PR reviews and architecture support in Slack, alongside 2.0h/day of daily planning syncs.',
      status: 'warning',
    },
    {
      q: '4. What could go wrong?',
      a: 'Downstream task EQ-103 will breach its target deadline by +2.5 business days unless dependency pressure on EQ-101 is alleviated.',
      status: 'warning',
    },
    {
      q: '5. What can we do?',
      a: 'Reassign EQ-101 to Alex Rivera. The What-If simulation engine forecasts this will drop Sarah to 82% workload and recover schedule margin.',
      status: 'action',
      link: '/simulation?taskId=t-101&from=u-sarah-chen&to=u-alex-rivera',
      linkText: 'Open Scenario in Simulator',
    },
  ];

  return (
    <div className="rounded-xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Decision Support Diagnostic</h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Executive Summary</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {questions.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
              item.status === 'critical'
                ? 'bg-red-950/20 border-red-500/30 text-red-200'
                : item.status === 'warning'
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                : item.status === 'action'
                ? 'bg-indigo-950/25 border-indigo-500/30 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div>
              <span className="font-bold block text-[11px] mb-1.5 opacity-90">{item.q}</span>
              <p className="text-[11px] leading-relaxed opacity-85">{item.a}</p>
            </div>
            {item.link && (
              <Link
                href={item.link}
                className="mt-3 inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>{item.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Scale,
  AlertOctagon,
  LineChart,
  GitPullRequestDraft,
  Users,
  Plug,
  Bell,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Workload', href: '/workload', icon: Scale },
      {
        name: 'Bottlenecks',
        href: '/bottlenecks',
        icon: AlertOctagon,
        badge: '1 Risk',
        badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
      },
      { name: 'Analytics', href: '/analytics', icon: LineChart },
      {
        name: 'Simulation',
        href: '/simulation',
        icon: GitPullRequestDraft,
        badge: 'What-If',
        badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      },
    ],
  },
  {
    title: 'TEAM',
    items: [{ name: 'Team', href: '/team', icon: Users }],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Plug },
      {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badge: '3',
        badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-slate-800/80 flex flex-col flex-shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-[#0a0f1a]">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold tracking-tight text-white">EquiFlow</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight">Intelligence Overlay</p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/25 shadow-sm shadow-indigo-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / Privacy & Integrity Safeguard */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0a0f1a]">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ethical Safeguard</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Passive metadata only. Zero content scraping active.
          </p>
        </div>
      </div>
    </aside>
  );
};

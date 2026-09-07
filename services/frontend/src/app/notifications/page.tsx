'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Check,
  Trash2,
} from 'lucide-react';
import { fetchNotifications } from '@/lib/api';
import { NotificationItem } from '@/lib/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => (filter === 'UNREAD' ? !n.read : true));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span>System</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Notifications & Alerts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <span>Intelligence Dispatch & Alert Stream</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live WebSocket Stream
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time notifications triggered by Redis Streams event ingestion, capacity threshold crossings, and heuristic dependency inferences.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                filter === 'UNREAD'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
          </div>

          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-w-4xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No notifications matching your filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-5 border flex items-start justify-between gap-4 transition-all ${
                !item.read
                  ? 'bg-slate-900/80 border-slate-700 shadow-md'
                  : 'bg-slate-900/40 border-slate-800/70 opacity-80'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : item.type === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : item.type === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {item.type === 'CRITICAL' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : item.type === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : item.type === 'SUCCESS' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>
                </div>
              </div>

              {item.link && (
                <Link
                  href={item.link}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 transition-colors shrink-0"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

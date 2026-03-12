'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Notification } from '@/lib/types';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch {
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity mb-2 inline-block">
              <span className="text-indigo-400">AM</span>
              <span className="text-slate-500"> or </span>
              <span className="text-indigo-400">PM?</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-500 text-sm">
              When customers book a time with you, their requests will appear here.
            </p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`rounded-2xl border shadow-sm p-5 transition-colors ${
                  n.is_read
                    ? 'bg-white border-slate-100'
                    : 'bg-indigo-50 border-indigo-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.is_read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      )}
                      <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {n.link && (
                      <a
                        href={n.link}
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✓ Confirm
                      </a>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

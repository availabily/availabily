'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatPhone, formatTime, formatDateDisplay } from '@/lib/utils';
import { Notification, Meeting } from '@/lib/types';

interface AuthUser {
  phone: string;
  email: string | null;
  handle: string;
  timezone: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    accepted: { label: '✅ Confirmed', classes: 'bg-green-50 text-green-700 border border-green-200' },
    declined: { label: '❌ Declined', classes: 'bg-red-50 text-red-700 border border-red-200' },
    expired: { label: '⏰ Expired', classes: 'bg-slate-100 text-slate-500 border border-slate-200' },
  };
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-slate-100 text-slate-500' };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${classes}`}>{label}</span>;
}

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pending, setPending] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
  const displayDomain = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      // silently ignore polling errors
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/meetings');
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending ?? []);
        setRecent(data.recent ?? []);
      }
    } catch {
      // silently ignore
    }
  }, []);

  // Auth check on mount — then load data
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setUser(data);
        setLoadingAuth(false);
        // Kick off initial data fetches after auth
        fetchNotifications();
        fetchMeetings();
      })
      .catch(() => { if (!cancelled) router.replace('/login'); });
    return () => { cancelled = true; };
  }, [router, fetchNotifications, fetchMeetings]);

  // Poll notifications every 30 seconds (only when authenticated)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Close notification panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCopyLink = () => {
    if (!user) return;
    const url = `${rawBase}/${user.handle}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
            <span className="text-indigo-600">AM</span>
            <span className="text-slate-900"> or </span>
            <span className="text-indigo-600">PM?</span>
          </Link>

          <span className="text-sm font-medium text-slate-500 hidden sm:block">@{user.handle}</span>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <span className="text-xl leading-none">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {notifications.some((n) => !n.is_read) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3 transition-colors ${
                            !n.is_read ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                          } ${n.link ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (!n.is_read) handleMarkRead(n.id);
                            if (n.link) {
                              window.open(n.link, '_blank');
                              setShowNotifications(false);
                            }
                          }}
                        >
                          {!n.is_read && (
                            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                          {n.is_read && <span className="mt-1.5 shrink-0 w-2 h-2" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                            <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Your Link */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Your link</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`${rawBase}/${user.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-medium hover:underline text-base"
            >
              {displayDomain}/{user.handle}
            </a>
            <Button variant="secondary" size="sm" onClick={handleCopyLink}>
              {copied ? '✓ Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Share this link with customers so they can book a time.</p>
        </section>

        {/* Pending Requests */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Pending requests
            {pending.length > 0 && (
              <span className="ml-2 text-sm font-medium text-white bg-indigo-600 rounded-full px-2.5 py-0.5">
                {pending.length}
              </span>
            )}
          </h2>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-slate-400 text-sm">No pending requests</p>
              <p className="text-slate-300 text-xs mt-1">New booking requests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{m.visitor_name}</p>
                        <span className="text-xs text-slate-400">{timeAgo(m.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-500">{formatPhone(m.visitor_phone)}</p>
                      {m.note && (
                        <p className="text-sm text-slate-500 mt-0.5">📍 {m.note}</p>
                      )}
                      <p className="text-sm font-medium text-slate-700 mt-2">
                        {formatDateDisplay(m.meeting_date)} at {formatTime(m.start_time)}
                      </p>
                    </div>
                    <a
                      href={`/c/${m.confirm_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="primary">
                        Confirm →
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent activity</h2>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-slate-400 text-sm">No recent activity</p>
              <p className="text-slate-300 text-xs mt-1">Confirmed and declined meetings from the last 7 days appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{m.visitor_name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDateDisplay(m.meeting_date)} at {formatTime(m.start_time)}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

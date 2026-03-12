'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Notification, Meeting } from '@/lib/types';

const POLLING_INTERVAL_MS = 30_000; // 30 seconds

const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
const DISPLAY_DOMAIN = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const n = digits.slice(1);
    return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const STATUS_COLORS: Record<string, string> = {
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-100 text-amber-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, setPending] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    const res = await fetch('/api/dashboard/meetings');
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending);
      setRecent(data.recent);
    }
  }, []);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setHandle(data.handle);
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const load = async () => {
      await Promise.all([fetchNotifications(), fetchMeetings()]);
    };
    load();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchMeetings();
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loading, fetchNotifications, fetchMeetings]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    fetchNotifications();
  };

  const handleMarkOneRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${rawBase}/${handle}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Brand */}
          <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
            <span className="text-indigo-600">AM</span>
            <span className="text-slate-900"> or </span>
            <span className="text-indigo-600">PM?</span>
          </Link>

          {/* Handle */}
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-slate-700">@{handle}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/40' : ''}`}
                          onClick={() => !n.read && handleMarkOneRead(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && (
                              <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                            <div className={!n.read ? '' : 'pl-4'}>
                              <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                              <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                              {n.link && (
                                <Link
                                  href={n.link}
                                  className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View →
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Your Link */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Your booking link</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium text-indigo-600 truncate">
              {DISPLAY_DOMAIN}/{handle}
            </div>
            <button
              onClick={copyLink}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors shrink-0"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
            <Link
              href={`/${handle}`}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
            >
              View page
            </Link>
          </div>
        </div>

        {/* Pending Requests */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Pending Requests
            {pending.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pending.length}
              </span>
            )}
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-slate-400 text-sm">No pending requests. Share your link to get bookings!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{m.visitor_name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{formatDate(m.meeting_date)} at {formatTime12(m.start_time)}</p>
                      <p className="text-sm text-slate-500">{formatPhone(m.visitor_phone)}</p>
                      {m.note && <p className="text-sm text-slate-500 mt-1">📍 {m.note}</p>}
                    </div>
                    <Link
                      href={`/c/${m.confirm_token}`}
                      className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Confirm
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-slate-400 text-sm">No recent activity in the last 7 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{m.visitor_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(m.meeting_date)} at {formatTime12(m.start_time)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-500'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

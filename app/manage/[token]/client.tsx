'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Meeting } from '@/lib/types';
import { formatDateDisplay, formatTime, formatAmountCents } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface ManagePageClientProps {
  meeting: Meeting;
}

function BrandMark() {
  return (
    <div className="mb-6">
      <Link
        href="/"
        className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity inline-block"
      >
        <span className="text-brand-500">AM</span>
        <span className="text-slate-500"> or </span>
        <span className="text-brand-500">PM?</span>
      </Link>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending — awaiting your quote',
  quoted: 'Quote sent — waiting for customer',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  declined: 'Declined by customer',
  expired: 'Expired',
  completed: 'Completed',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

const CANCELLABLE = new Set(['pending', 'quoted', 'confirmed']);

export function ManagePageClient({ meeting: initialMeeting }: ManagePageClientProps) {
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canCancel = CANCELLABLE.has(meeting.status);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: meeting.manage_token,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMeeting(prev => ({
        ...prev,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason.trim() || null,
      }));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40">
      <div className="max-w-[480px] mx-auto px-5 py-7 pb-16">
        <BrandMark />

        <div className="stagger space-y-4">
          {/* Booking summary card */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
              Manage booking
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-4">
              {meeting.visitor_name}
            </h1>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 flex-none">Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDateDisplay(meeting.meeting_date)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 flex-none">Time</span>
                <span className="font-semibold text-slate-800">
                  {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
                </span>
              </div>
              {meeting.quote_amount_cents && (
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 flex-none">Quote</span>
                  <span className="font-semibold text-slate-800">
                    {formatAmountCents(meeting.quote_amount_cents)}
                  </span>
                </div>
              )}
            </div>

            <div
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                meeting.status === 'confirmed' || meeting.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : meeting.status === 'cancelled' ||
                    meeting.status === 'declined' ||
                    meeting.status === 'expired'
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-brand-50 text-brand-700',
              )}
            >
              {STATUS_LABELS[meeting.status] ?? meeting.status}
            </div>

            {meeting.cancellation_reason && (
              <p className="text-sm text-slate-500 mt-3">
                Reason: {meeting.cancellation_reason}
              </p>
            )}
          </div>

          {/* Cancel form — only shown if cancellable */}
          {canCancel && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-[0.14em] mb-1">
                Cancel booking
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
                Cancel this appointment?
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                {meeting.visitor_name} will be notified by text.
              </p>

              <form onSubmit={handleCancel} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cancel-reason" className="text-sm font-medium text-slate-700">
                    Reason{' '}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="cancel-reason"
                    placeholder="e.g. Schedule conflict, illness…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none text-sm"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-2xl bg-red-500 text-white font-semibold text-base px-6 py-3.5',
                    'transition-all duration-200 hover:bg-red-600 active:scale-[0.98]',
                    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'inline-flex items-center justify-center gap-2',
                  )}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Cancelling…
                    </>
                  ) : (
                    'Cancel booking'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Read-only status when not cancellable */}
          {!canCancel && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 text-center">
              <p className="text-sm text-slate-500">
                This booking is in a terminal state and cannot be modified.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

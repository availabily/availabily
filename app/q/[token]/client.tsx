'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Meeting } from '@/lib/types';
import {
  formatPhone,
  formatDateDisplay,
  formatTime,
  formatAmountCents,
} from '@/lib/utils';
import { cn } from '@/lib/cn';

interface QuotePageClientProps {
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

function statusBadge(status: Meeting['status']) {
  const map: Partial<Record<Meeting['status'], string>> = {
    pending: 'Pending',
    quoted: 'Quote sent',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    declined: 'Declined',
    expired: 'Expired',
    completed: 'Completed',
    invoiced: 'Invoiced',
    paid: 'Paid',
  };
  return map[status] ?? status;
}

export function QuotePageClient({ meeting: initialMeeting }: QuotePageClientProps) {
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);

  // Quote form state
  const [amountInput, setAmountInput] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstName = meeting.visitor_name.split(' ')[0];
  const manageHref = meeting.manage_token ? `/manage/${meeting.manage_token}` : '#';

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const dotIdx = val.indexOf('.');
    if (dotIdx !== -1) val = val.slice(0, dotIdx + 3);
    setAmountInput(val);
    const parsed = parseFloat(val);
    setAmountCents(isNaN(parsed) ? 0 : Math.round(parsed * 100));
  }

  function formatInputDisplay(raw: string): string {
    if (!raw) return '';
    const [intPart, decPart] = raw.split('.');
    const formatted = (parseInt(intPart || '0') || 0).toLocaleString('en-US');
    return decPart !== undefined ? formatted + '.' + decPart : formatted;
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amountCents < 100) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: meeting.quote_token,
          amount_cents: amountCents,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMeeting(prev => ({
        ...prev,
        status: 'quoted',
        quote_amount_cents: amountCents,
        quote_description: description.trim(),
        quoted_at: new Date().toISOString(),
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
          {/* ── Booking request details card ── */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
              Booking request
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-4">
              {meeting.visitor_name}
            </h1>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-500 w-16 flex-none">Phone</span>
                <span className="font-semibold text-slate-800">
                  {formatPhone(meeting.visitor_phone)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-500 w-16 flex-none">Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDateDisplay(meeting.meeting_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-500 w-16 flex-none">Time</span>
                <span className="font-semibold text-slate-800">
                  {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
                </span>
              </div>
            </div>

            {meeting.note && (
              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Note / Address
                </p>
                <p className="text-sm text-slate-600">{meeting.note}</p>
              </div>
            )}
          </div>

          {/* ── Status-driven second card ── */}

          {/* pending → quote form */}
          {meeting.status === 'pending' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
                Send quote
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-5">
                How much do you charge?
              </h2>

              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                {/* Amount input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quote-amount" className="text-sm font-medium text-slate-700">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold select-none">
                      $
                    </span>
                    <input
                      id="quote-amount"
                      type="tel"
                      inputMode="decimal"
                      placeholder="0"
                      value={formatInputDisplay(amountInput)}
                      onChange={handleAmountChange}
                      className={cn(
                        'w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-3',
                        'text-slate-900 text-lg font-semibold placeholder-slate-300',
                        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                      )}
                    />
                  </div>
                </div>

                {/* Description textarea */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quote-desc" className="text-sm font-medium text-slate-700">
                    Description{' '}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="quote-desc"
                    placeholder="What's included? (e.g. Full detail — interior + exterior)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none text-sm"
                  />
                  {description.length > 160 && (
                    <p className="text-xs text-slate-400 text-right">
                      {200 - description.length} chars left
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || amountCents < 100}
                  className={cn(
                    'w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5',
                    'transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]',
                    'shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'inline-flex items-center justify-center gap-2',
                  )}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    `Send quote to ${firstName} →`
                  )}
                </button>
              </form>
            </div>
          )}

          {/* quoted → quote sent */}
          {meeting.status === 'quoted' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.14em] mb-1">
                Quote sent
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">
                {meeting.quote_amount_cents
                  ? formatAmountCents(meeting.quote_amount_cents)
                  : ''}{' '}
                sent to {firstName}
              </h2>
              {meeting.quote_description && (
                <p className="text-sm text-slate-500 mb-3">{meeting.quote_description}</p>
              )}
              <p className="text-sm text-slate-500">We&apos;ll text you when they accept.</p>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href={manageHref}
                  className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  Cancel this booking
                </Link>
              </div>
            </div>
          )}

          {/* confirmed → booking confirmed */}
          {meeting.status === 'confirmed' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-none">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.14em]">
                  Booking confirmed
                </p>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-1">
                {firstName} accepted — you&apos;re booked for {formatDateDisplay(meeting.meeting_date)}{' '}
                at {formatTime(meeting.start_time)}
              </h2>
              {meeting.quote_amount_cents && (
                <p className="text-sm text-slate-500 mt-2">
                  {formatAmountCents(meeting.quote_amount_cents)} · invoice will be sent after the appointment
                </p>
              )}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href={manageHref}
                  className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  Manage booking
                </Link>
              </div>
            </div>
          )}

          {/* Terminal states: cancelled, declined, expired */}
          {(meeting.status === 'cancelled' ||
            meeting.status === 'declined' ||
            meeting.status === 'expired') && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2">
                {statusBadge(meeting.status)}
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                {meeting.status === 'cancelled' && 'Booking cancelled'}
                {meeting.status === 'declined' && `${firstName} declined the quote`}
                {meeting.status === 'expired' && 'Request expired'}
              </h2>
              {meeting.cancellation_reason && (
                <p className="text-sm text-slate-500">
                  Reason: {meeting.cancellation_reason}
                </p>
              )}
            </div>
          )}

          {/* Completed/invoiced/paid */}
          {(meeting.status === 'completed' ||
            meeting.status === 'invoiced' ||
            meeting.status === 'paid') && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 text-center">
              <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-2">
                {statusBadge(meeting.status)}
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                This booking has already wrapped up.
              </h2>
              {meeting.quote_amount_cents && (
                <p className="text-sm text-slate-500">
                  {formatAmountCents(meeting.quote_amount_cents)} ·{' '}
                  {meeting.status === 'paid'
                    ? 'Payment received'
                    : meeting.status === 'invoiced'
                    ? 'Invoice sent'
                    : 'Appointment complete'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

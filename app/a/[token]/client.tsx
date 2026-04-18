'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Meeting, User, Profile } from '@/lib/types';
import { formatDateDisplay, formatTime, formatAmountCents } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface AcceptPageClientProps {
  meeting: Meeting;
  user: User;
  profile: Profile | null;
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

function AvatarBlock({
  profile,
  handle,
}: {
  profile: Profile | null;
  handle: string;
}) {
  const displayName = profile?.display_name || profile?.business_name || `@${handle}`;
  const businessName = profile?.business_name && profile?.display_name ? profile.business_name : null;
  const initials = displayName
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-full p-[3px] bg-gradient-to-br from-brand-400 via-brand-500 to-violet-500 flex-none shadow-[0_8px_20px_-6px_rgba(91,76,255,0.40)]">
        <div className="rounded-full bg-white p-[2px]">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
              {initials || '?'}
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 truncate">{displayName}</p>
        {businessName && (
          <p className="text-sm text-slate-500 truncate">{businessName}</p>
        )}
        <p className="text-sm text-brand-600 font-medium">@{handle}</p>
      </div>
    </div>
  );
}

export function AcceptPageClient({ meeting: initialMeeting, user, profile }: AcceptPageClientProps) {
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState('');
  const [declineConfirm, setDeclineConfirm] = useState(false);

  const ownerName = profile?.business_name || profile?.display_name || `@${user.handle}`;

  async function submit(action: 'accept' | 'decline') {
    setLoading(action);
    setError('');
    try {
      const res = await fetch('/api/accept-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: meeting.accept_token, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMeeting(prev => ({
        ...prev,
        status: action === 'accept' ? 'confirmed' : 'declined',
        customer_confirmed_at: action === 'accept' ? new Date().toISOString() : prev.customer_confirmed_at,
      }));
      setDeclineConfirm(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40">
      <div className="max-w-[480px] mx-auto px-5 py-7 pb-16">
        <BrandMark />

        <div className="stagger space-y-4">
          {/* Owner mini-header */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
            <AvatarBlock profile={profile} handle={user.handle} />
          </div>

          {/* ── quoted → accept/decline UI ── */}
          {meeting.status === 'quoted' && (
            <>
              {/* Appointment card */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
                <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
                  Your appointment
                </p>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {formatDateDisplay(meeting.meeting_date)}
                </h2>
                <p className="text-slate-600 mt-1">
                  {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
                </p>
                {profile?.location && (
                  <p className="text-sm text-slate-400 mt-1">{profile.location}</p>
                )}
              </div>

              {/* Quote card */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
                <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-2">
                  Quote
                </p>
                <p className="font-display text-4xl font-bold text-slate-900">
                  {meeting.quote_amount_cents
                    ? formatAmountCents(meeting.quote_amount_cents)
                    : '—'}
                </p>
                {meeting.quote_description && (
                  <p className="text-sm text-slate-500 mt-2">{meeting.quote_description}</p>
                )}
              </div>

              {/* Trust footer */}
              <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  After your appointment, <span className="font-semibold">{ownerName}</span> will
                  send you an invoice via text. Payment is handled securely by Stripe.
                </p>
              </div>

              {/* Action buttons */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {!declineConfirm ? (
                <div className="space-y-3">
                  <button
                    onClick={() => submit('accept')}
                    disabled={loading !== null}
                    className={cn(
                      'w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5',
                      'transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]',
                      'shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'inline-flex items-center justify-center gap-2',
                    )}
                  >
                    {loading === 'accept' ? (
                      <>
                        <Spinner />
                        Confirming…
                      </>
                    ) : (
                      'Accept & confirm booking'
                    )}
                  </button>
                  <div className="text-center">
                    <button
                      onClick={() => setDeclineConfirm(true)}
                      disabled={loading !== null}
                      className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] border border-red-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 space-y-4">
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Are you sure?
                  </h3>
                  <p className="text-sm text-slate-500">
                    Declining this quote can&apos;t be undone. The business owner will be notified.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeclineConfirm(false)}
                      disabled={loading !== null}
                      className="flex-1 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Go back
                    </button>
                    <button
                      onClick={() => submit('decline')}
                      disabled={loading !== null}
                      className={cn(
                        'flex-1 rounded-2xl bg-red-500 text-white font-semibold text-sm px-4 py-3',
                        'hover:bg-red-600 transition-colors active:scale-[0.98]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'inline-flex items-center justify-center gap-2',
                      )}
                    >
                      {loading === 'decline' ? (
                        <>
                          <Spinner />
                          Declining…
                        </>
                      ) : (
                        'Yes, decline'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── confirmed ── */}
          {meeting.status === 'confirmed' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div aria-hidden className="absolute inset-0 rounded-full bg-emerald-100/60 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-emerald-50 flex items-center justify-center shadow-[0_0_0_4px_rgba(16,185,129,0.08)]">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                You&apos;re booked!
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {formatDateDisplay(meeting.meeting_date)} at {formatTime(meeting.start_time)} with{' '}
                <span className="font-semibold">{ownerName}</span>
              </p>
              {meeting.quote_amount_cents && (
                <p className="text-sm text-slate-400 mt-2">
                  {formatAmountCents(meeting.quote_amount_cents)} · We&apos;ll text you when your
                  invoice is ready after the appointment.
                </p>
              )}
            </div>
          )}

          {/* ── declined ── */}
          {meeting.status === 'declined' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2">
                Declined
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Booking declined
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                You declined this quote. Contact the business directly if you changed your mind.
              </p>
            </div>
          )}

          {/* ── cancelled / expired ── */}
          {(meeting.status === 'cancelled' || meeting.status === 'expired') && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2">
                {meeting.status === 'cancelled' ? 'Cancelled' : 'Expired'}
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900">
                {meeting.status === 'cancelled'
                  ? 'This booking was cancelled'
                  : 'This quote has expired'}
              </h2>
              {meeting.cancellation_reason && (
                <p className="text-sm text-slate-500 mt-2">
                  Reason: {meeting.cancellation_reason}
                </p>
              )}
            </div>
          )}

          {/* ── pending (shouldn't normally be reached via accept link) ── */}
          {meeting.status === 'pending' && (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2">
                Not ready yet
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900">
                This quote hasn&apos;t been sent yet.
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                The business owner is preparing your quote. Check back shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

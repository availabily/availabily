'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Meeting, Profile } from '@/lib/types';
import { isProfileCompleteForQuoting } from '@/lib/profile';
import {
  formatPhone,
  formatDateDisplay,
  formatTime,
  formatAmountCents,
} from '@/lib/utils';
import { cn } from '@/lib/cn';

interface StripeStatus {
  exists: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  payouts_enabled: boolean;
}

interface QuotePageClientProps {
  meeting: Meeting;
  ownerProfile: Profile | null;
  stripeStatus: StripeStatus | null;
}

type GateStep = 'profile' | 'connect' | 'verifying' | 'ready';

function computeGateStep(
  profile: Profile | null,
  stripe: StripeStatus | null
): GateStep {
  if (!isProfileCompleteForQuoting(profile)) return 'profile';
  if (!stripe?.charges_enabled) {
    if (stripe?.details_submitted) return 'verifying';
    return 'connect';
  }
  return 'ready';
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

function ProfileGate({
  ownerProfile,
  ownerPhone,
  onComplete,
}: {
  ownerProfile: Profile | null;
  ownerPhone: string;
  onComplete: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(ownerProfile?.display_name ?? '');
  const [businessName, setBusinessName] = useState(ownerProfile?.business_name ?? '');
  const [location, setLocation] = useState(ownerProfile?.location ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() && !businessName.trim()) {
      setError('Enter at least a display name or business name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const merged: Profile = {
        ...(ownerProfile ?? {
          user_phone: ownerPhone,
          display_name: '',
          business_name: '',
          headline: '',
          bio: '',
          avatar_url: '',
          gallery_urls: [],
          service_category: '',
          location: '',
          trust_bullets: [],
          prompt_blocks: [],
        }),
        user_phone: ownerPhone,
        display_name: displayName.trim(),
        business_name: businessName.trim(),
        location: location.trim(),
      };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: ownerPhone,
          display_name: merged.display_name,
          business_name: merged.business_name,
          headline: merged.headline,
          bio: merged.bio,
          avatar_url: merged.avatar_url,
          gallery_urls: merged.gallery_urls,
          service_category: merged.service_category,
          location: merged.location,
          trust_bullets: merged.trust_bullets,
          prompt_blocks: merged.prompt_blocks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save. Please try again.');
        return;
      }
      onComplete(merged);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        Quick setup — one time
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
        What should your customer see?
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Customers and invoices will show this name. You can edit it later.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gate-business" className="text-sm font-medium text-slate-700">
            Business name
          </label>
          <input
            id="gate-business"
            type="text"
            placeholder="Jake's Mobile Detail"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gate-display" className="text-sm font-medium text-slate-700">
            Your name
          </label>
          <input
            id="gate-display"
            type="text"
            placeholder="Jake Martinez"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gate-location" className="text-sm font-medium text-slate-700">
            Location <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="gate-location"
            type="text"
            placeholder="Lahaina, HI"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
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
            'w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5',
            'transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]',
            'shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'inline-flex items-center justify-center gap-2',
          )}
        >
          {loading ? <><Spinner /> Saving…</> : 'Save and continue →'}
        </button>
      </form>
    </div>
  );
}

function ConnectGate({ ownerPhone }: { ownerPhone: string }) {
  const encodedPhone = encodeURIComponent(ownerPhone);
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        Quick setup — one time
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
        Set up payments to send this quote
      </h2>
      <p className="text-sm text-slate-500 mb-3">
        We use Stripe to handle payments securely. Takes about 3 minutes and you only do this once. You&apos;ll return here automatically.
      </p>
      <p className="text-xs text-slate-400 mb-5">
        Stripe is the payment processor behind Shopify, Substack, and Lyft.
      </p>
      <a
        href={`/api/connect/start?phone=${encodedPhone}`}
        className={cn(
          'w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5',
          'transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]',
          'shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]',
          'inline-flex items-center justify-center',
        )}
      >
        Set up payments →
      </a>
    </div>
  );
}

function VerifyingGate({
  ownerPhone,
  onReady,
}: {
  ownerPhone: string;
  onReady: () => void;
}) {
  const [checking, setChecking] = useState(false);

  async function checkNow() {
    setChecking(true);
    try {
      const res = await fetch(`/api/connect/status?phone=${encodeURIComponent(ownerPhone)}`);
      const data = await res.json();
      if (data?.charges_enabled) onReady();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        Almost there
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">
        Stripe is verifying your info
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        This usually takes a few minutes. Refresh this page to check.
      </p>
      <button
        onClick={checkNow}
        disabled={checking}
        className={cn(
          'w-full rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-base px-6 py-3.5',
          'transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'inline-flex items-center justify-center gap-2',
        )}
      >
        {checking ? <><Spinner /> Checking…</> : 'Check status'}
      </button>
    </div>
  );
}

function QuoteForm({
  meeting,
  onQuoted,
}: {
  meeting: Meeting;
  onQuoted: (amountCents: number, description: string) => void;
}) {
  const [amountInput, setAmountInput] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstName = meeting.visitor_name.split(' ')[0];

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

  async function handleSubmit(e: React.FormEvent) {
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
      onQuoted(amountCents, description.trim());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        Send quote
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-5">
        How much do you charge?
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quote-desc" className="text-sm font-medium text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
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
          {loading ? <><Spinner /> Sending…</> : `Send quote to ${firstName} →`}
        </button>
      </form>
    </div>
  );
}

export function QuotePageClient({
  meeting: initialMeeting,
  ownerProfile: initialProfile,
  stripeStatus: initialStripe,
}: QuotePageClientProps) {
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [stripe, setStripe] = useState<StripeStatus | null>(initialStripe);
  const [gateStep, setGateStep] = useState<GateStep>(
    () => computeGateStep(initialProfile, initialStripe)
  );

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll Stripe status every 10s while verifying
  useEffect(() => {
    if (gateStep !== 'verifying') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    const phone = meeting.user_phone;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/connect/status?phone=${encodeURIComponent(phone)}`);
        const data: StripeStatus = await res.json();
        if (data?.charges_enabled) {
          setStripe(data);
          setGateStep('ready');
        }
      } catch {
        // ignore poll errors
      }
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gateStep, meeting.user_phone]);

  const firstName = meeting.visitor_name.split(' ')[0];
  const manageHref = meeting.manage_token ? `/manage/${meeting.manage_token}` : '#';

  function handleProfileComplete(updated: Profile) {
    setProfile(updated);
    const nextStep = computeGateStep(updated, stripe);
    setGateStep(nextStep);
  }

  function handleStripeReady() {
    setGateStep('ready');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40">
      <div className="max-w-[480px] mx-auto px-5 py-7 pb-16">
        <BrandMark />

        <div className="stagger space-y-4">
          {/* Booking request details card */}
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

          {/* ── Gate + status-driven second card ── */}

          {meeting.status === 'pending' && gateStep === 'profile' && (
            <ProfileGate
              ownerProfile={profile}
              ownerPhone={meeting.user_phone}
              onComplete={handleProfileComplete}
            />
          )}

          {meeting.status === 'pending' && gateStep === 'connect' && (
            <ConnectGate ownerPhone={meeting.user_phone} />
          )}

          {meeting.status === 'pending' && gateStep === 'verifying' && (
            <VerifyingGate ownerPhone={meeting.user_phone} onReady={handleStripeReady} />
          )}

          {meeting.status === 'pending' && gateStep === 'ready' && (
            <QuoteForm
              meeting={meeting}
              onQuoted={(amountCents, description) => {
                setMeeting(prev => ({
                  ...prev,
                  status: 'quoted',
                  quote_amount_cents: amountCents,
                  quote_description: description,
                  quoted_at: new Date().toISOString(),
                }));
              }}
            />
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

          {/* confirmed */}
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

          {/* Terminal states */}
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

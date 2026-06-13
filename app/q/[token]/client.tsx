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
  paymentsEnabled: boolean;
  subscribed: boolean;
  startQuoted: boolean;
}

type BookingChoice = 'unset' | 'quoted_service';

type GateStep = 'profile' | 'connect' | 'verifying' | 'ready';

function computeGateStep(
  profile: Profile | null,
  stripe: StripeStatus | null,
  paymentsEnabled: boolean = true
): GateStep {
  if (!isProfileCompleteForQuoting(profile)) return 'profile';
  if (paymentsEnabled && !stripe?.charges_enabled) {
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

function ConnectGate({ ownerPhone, onSkipped }: { ownerPhone: string; onSkipped: () => void }) {
  const encodedPhone = encodeURIComponent(ownerPhone);
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState('');

  async function handleSkip() {
    setSkipping(true);
    setSkipError('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ownerPhone, payments_enabled: false }),
      });
      if (!res.ok) {
        setSkipError('Could not save preference. Please try again.');
        return;
      }
      onSkipped();
    } catch {
      setSkipError('Network error. Please try again.');
    } finally {
      setSkipping(false);
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        Quick setup — one time
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
        How do you want to get paid?
      </h2>
      <p className="text-sm text-slate-500 mb-3">
        Connect Stripe to collect payment automatically after each appointment. Or skip if you handle payment yourself.
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
        Accept payments through AM or PM? →
      </a>
      <div className="mt-3 flex flex-col items-center gap-1">
        <button
          onClick={handleSkip}
          disabled={skipping}
          className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 disabled:opacity-50"
        >
          {skipping ? 'Saving…' : 'I collect payment separately'}
        </button>
        {skipError && <p className="text-xs text-red-500">{skipError}</p>}
      </div>
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
  paymentsEnabled,
  onQuoted,
}: {
  meeting: Meeting;
  paymentsEnabled: boolean;
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
            {paymentsEnabled ? 'Amount' : 'Agreed amount'}
          </label>
          {!paymentsEnabled && (
            <p className="text-xs text-slate-400 -mt-0.5">
              Shown to your customer — you collect payment directly.
            </p>
          )}
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

function BookingTypeChooser({
  onConsultation,
  onQuoted,
  accepting,
  error,
}: {
  onConsultation: () => void;
  onQuoted: () => void;
  accepting: boolean;
  error: string;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        New booking
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">
        What kind of booking is this?
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        You can pick a different type for every booking.
      </p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onConsultation}
          disabled={accepting}
          className={cn(
            'w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-4',
            'transition-all duration-200 hover:border-brand-300 hover:bg-brand-50',
            'focus:outline-none focus:ring-2 focus:ring-brand-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span className="block text-sm font-bold text-slate-900">
            {accepting ? 'Confirming…' : 'Consultation / meeting'}
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">
            No quote, no payment — just confirm the time. Discovery call, site survey, free consult.
          </span>
        </button>
        <button
          type="button"
          onClick={onQuoted}
          disabled={accepting}
          className={cn(
            'w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-4',
            'transition-all duration-200 hover:border-brand-300 hover:bg-brand-50',
            'focus:outline-none focus:ring-2 focus:ring-brand-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span className="block text-sm font-bold text-slate-900">Quoted service</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Send a price and collect payment after the appointment.
          </span>
        </button>
      </div>
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

function SubscriptionUpsell({
  ownerPhone,
  token,
  onContinue,
}: {
  ownerPhone: string;
  token: string | null;
  onContinue: () => void;
}) {
  const href = `/api/subscribe/start?phone=${encodeURIComponent(ownerPhone)}&token=${encodeURIComponent(token ?? '')}`;
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
        AM or PM? Pro
      </p>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
        Pay 4% instead of 7%
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Subscribe for <span className="font-semibold text-slate-700">$4.99/mo</span> and the platform
        fee on every paid booking drops from 7% to 4%. Cancel anytime.
      </p>
      <a
        href={href}
        className={cn(
          'w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5',
          'transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]',
          'shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]',
          'inline-flex items-center justify-center',
        )}
      >
        Subscribe — $4.99/mo →
      </a>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onContinue}
          className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Continue at 7%
        </button>
      </div>
    </div>
  );
}

export function QuotePageClient({
  meeting: initialMeeting,
  ownerProfile: initialProfile,
  stripeStatus: initialStripe,
  paymentsEnabled: initialPaymentsEnabled,
  subscribed,
  startQuoted,
}: QuotePageClientProps) {
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [stripe, setStripe] = useState<StripeStatus | null>(initialStripe);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(initialPaymentsEnabled);
  const [gateStep, setGateStep] = useState<GateStep>(
    () => computeGateStep(initialProfile, initialStripe, initialPaymentsEnabled)
  );
  // Owner first picks a booking type; quoted-service then runs the existing gate.
  const [bookingChoice, setBookingChoice] = useState<BookingChoice>(
    startQuoted ? 'quoted_service' : 'unset'
  );
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [acceptingConsult, setAcceptingConsult] = useState(false);
  const [consultError, setConsultError] = useState('');

  async function handleAcceptConsultation() {
    setAcceptingConsult(true);
    setConsultError('');
    try {
      const res = await fetch('/api/accept-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: meeting.quote_token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConsultError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMeeting(prev => ({
        ...prev,
        status: 'confirmed',
        booking_type: 'consultation',
        customer_confirmed_at: new Date().toISOString(),
      }));
    } catch {
      setConsultError('Network error. Please try again.');
    } finally {
      setAcceptingConsult(false);
    }
  }

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
    const nextStep = computeGateStep(updated, stripe, paymentsEnabled);
    setGateStep(nextStep);
  }

  function handleStripeReady() {
    setGateStep('ready');
  }

  function handlePaymentSkip() {
    setPaymentsEnabled(false);
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
              {meeting.visitor_phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500 w-16 flex-none">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {formatPhone(meeting.visitor_phone)}
                  </span>
                </div>
              )}
              {meeting.visitor_email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-500 w-16 flex-none">Email</span>
                  <span className="font-semibold text-slate-800 break-all">
                    {meeting.visitor_email}
                  </span>
                </div>
              )}
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

          {/* Step 1: owner picks a booking type */}
          {meeting.status === 'pending' && bookingChoice === 'unset' && (
            <BookingTypeChooser
              onConsultation={handleAcceptConsultation}
              onQuoted={() => setBookingChoice('quoted_service')}
              accepting={acceptingConsult}
              error={consultError}
            />
          )}

          {/* Step 2: quoted-service → $4.99 upsell (soft) then the existing gate */}
          {meeting.status === 'pending' && bookingChoice === 'quoted_service' && (
            <>
              <div className="-mb-1">
                <button
                  type="button"
                  onClick={() => { setBookingChoice('unset'); setUpsellDismissed(false); }}
                  className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  ← Choose a different booking type
                </button>
              </div>

              {!subscribed && !upsellDismissed ? (
                <SubscriptionUpsell
                  ownerPhone={meeting.user_phone}
                  token={meeting.quote_token}
                  onContinue={() => setUpsellDismissed(true)}
                />
              ) : (
                <>
                  {gateStep === 'profile' && (
                    <ProfileGate
                      ownerProfile={profile}
                      ownerPhone={meeting.user_phone}
                      onComplete={handleProfileComplete}
                    />
                  )}
                  {gateStep === 'connect' && (
                    <ConnectGate ownerPhone={meeting.user_phone} onSkipped={handlePaymentSkip} />
                  )}
                  {gateStep === 'verifying' && (
                    <VerifyingGate ownerPhone={meeting.user_phone} onReady={handleStripeReady} />
                  )}
                  {gateStep === 'ready' && (
                    <QuoteForm
                      meeting={meeting}
                      paymentsEnabled={paymentsEnabled}
                      onQuoted={(amountCents, description) => {
                        setMeeting(prev => ({
                          ...prev,
                          status: 'quoted',
                          booking_type: 'quoted_service',
                          quote_amount_cents: amountCents,
                          quote_description: description,
                          quoted_at: new Date().toISOString(),
                        }));
                      }}
                    />
                  )}
                </>
              )}
            </>
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
              <p className="text-sm text-slate-500">We&apos;ll email you when they accept.</p>
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
                {meeting.booking_type === 'consultation'
                  ? `Meeting confirmed for ${formatDateDisplay(meeting.meeting_date)} at ${formatTime(meeting.start_time)}`
                  : `${firstName} accepted — you're booked for ${formatDateDisplay(meeting.meeting_date)} at ${formatTime(meeting.start_time)}`}
              </h2>
              {meeting.booking_type === 'consultation' ? (
                <p className="text-sm text-slate-500 mt-2">
                  No payment needed — this is a consultation.
                </p>
              ) : (
                meeting.quote_amount_cents && (
                  <p className="text-sm text-slate-500 mt-2">
                    {formatAmountCents(meeting.quote_amount_cents)} ·{' '}
                    {paymentsEnabled ? 'invoice will be sent after the appointment' : 'payment collected separately'}
                  </p>
                )
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
                {meeting.booking_type === 'consultation'
                  ? 'This meeting is complete.'
                  : 'This booking has already wrapped up.'}
              </h2>
              {meeting.booking_type === 'consultation' ? (
                <p className="text-sm text-slate-500">Consultation — no payment.</p>
              ) : (
                meeting.quote_amount_cents && (
                  <p className="text-sm text-slate-500">
                    {formatAmountCents(meeting.quote_amount_cents)} ·{' '}
                    {meeting.status === 'paid'
                      ? 'Payment received'
                      : meeting.status === 'invoiced'
                      ? 'Invoice sent'
                      : 'Appointment complete'}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

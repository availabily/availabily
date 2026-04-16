'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatTime, formatDateDisplay, formatFullDay, toE164, isValidE164 } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface LockInFormProps {
  handle: string;
  date: string;
  startTime: string;
  onSuccess: () => void;
  onBack: () => void;
  className?: string;
}

export function LockInForm({ handle, date, startTime, onSuccess, onBack, className }: LockInFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please add your name';
    if (!phone.trim()) {
      newErrors.phone = 'We need a phone number to text you';
    } else {
      const normalized = phone.startsWith('+') ? phone : toE164(phone);
      if (!isValidE164(normalized)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    if (!smsConsent) {
      newErrors.smsConsent = 'Please agree to receive SMS about your booking';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const visitor_phone = phone.startsWith('+') ? phone : toE164(phone);
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          date,
          start_time: startTime,
          visitor_name: name.trim(),
          visitor_phone,
          visitor_address: note.trim() || email.trim() || '-',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dayName = formatFullDay(date);
  const timeLabel = formatTime(startTime);
  const submitLabel = `Request ${dayName} at ${timeLabel}`;

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        className
      )}
    >
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
          Lock it in
        </p>
        <h2 className="font-display text-2xl font-bold text-slate-900">Your details</h2>
      </div>

      {/* Selected time + Change button */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 border border-brand-100 px-4 py-3 mb-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
            Selected time
          </p>
          <p className="text-sm font-bold text-brand-900 mt-0.5 truncate">
            {formatDateDisplay(date)} · {timeLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex-none text-xs font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-2"
        >
          Change
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="lockin-name"
          label="Your name"
          placeholder="Jane"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="given-name"
        />

        <Input
          id="lockin-phone"
          label="Phone number"
          placeholder="+1 808 555 3434"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />

        <Input
          id="lockin-email"
          label="Email (optional)"
          placeholder="jane@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lockin-note" className="text-sm font-medium text-slate-700">
            Add a note (optional)
          </label>
          <textarea
            id="lockin-note"
            placeholder="Anything they should know — parking, pets, special requests…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none text-sm"
          />
        </div>

        {/* SMS Consent — preserved exactly */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="sms-consent"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="sms-consent" className="text-xs text-slate-500 leading-relaxed">
            I agree to receive SMS messages related to my booking request, including confirmations and updates. Message and data rates may apply. Reply STOP to opt out at any time.
          </label>
        </div>
        {errors.smsConsent && (
          <p className="text-xs text-red-500 -mt-2">{errors.smsConsent}</p>
        )}

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
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'inline-flex items-center justify-center gap-2'
          )}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  );
}

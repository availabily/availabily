'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTime, formatDateDisplay, toE164, isValidE164 } from '@/lib/utils';
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
    if (!name.trim()) newErrors.name = 'First name is required';
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const normalized = phone.startsWith('+') ? phone : toE164(phone);
      if (!isValidE164(normalized)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    if (!smsConsent) {
      newErrors.smsConsent = 'SMS consent is required to receive booking confirmations';
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

  return (
    <div className={cn('bg-white rounded-3xl border border-slate-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-300', className)}>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Lock in your spot</h2>
      <p className="text-sm text-slate-500 mb-5">Fill in your details to request this time.</p>

      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 mb-5">
        <p className="text-sm text-indigo-600 font-medium">Selected time</p>
        <p className="text-base font-bold text-indigo-900 mt-0.5">
          {formatDateDisplay(date)} at {formatTime(startTime)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="lockin-name"
          label="First name"
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
            Anything the business should know? (optional)
          </label>
          <textarea
            id="lockin-note"
            placeholder="e.g., special requests, parking info..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
          />
        </div>

        {/* SMS Consent — preserved exactly */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="sms-consent"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onBack} className="flex-none">
            ← Back
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Request this time
          </Button>
        </div>
      </form>
    </div>
  );
}

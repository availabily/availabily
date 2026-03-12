'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTime, formatDateDisplay, toE164, isValidE164 } from '@/lib/utils';

interface RequestFormProps {
  handle: string;
  date: string;
  startTime: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function RequestForm({ handle, date, startTime, onSuccess, onBack }: RequestFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const normalized = phone.startsWith('+') ? phone : toE164(phone);
      if (!isValidE164(normalized)) {
        newErrors.phone = 'Please enter a valid US phone number';
      }
    }
    if (!address.trim()) newErrors.address = 'Address is required';
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
          visitor_address: address.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
        <p className="text-sm text-indigo-600 font-medium">Selected time</p>
        <p className="text-base font-bold text-indigo-900 mt-0.5">
          {formatDateDisplay(date)} at {formatTime(startTime)}
        </p>
      </div>

      <Input
        id="name"
        label="Your name"
        placeholder="Jane Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoComplete="name"
      />

      <Input
        id="phone"
        label="Your phone number"
        placeholder="+1 808 555 3434"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        autoComplete="tel"
      />

      <Input
        id="address"
        label="Your address"
        placeholder="123 Main St, Lahaina, HI 96761"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors.address}
        autoComplete="street-address"
        maxLength={200}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-none">
          ← Back
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Request {formatDateDisplay(date).split(',')[0]} at {formatTime(startTime)}
        </Button>
      </div>
    </form>
  );
}

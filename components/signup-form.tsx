'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ProfileSetupSection,
  ProfileFormData,
} from '@/components/profile-setup-section';
import { toE164, isValidE164 } from '@/lib/utils';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
const DISPLAY_DOMAIN = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_SCHEDULE: Record<number, DaySchedule> = {
  0: { enabled: false, start_time: '09:00', end_time: '17:00' },
  1: { enabled: true, start_time: '09:00', end_time: '17:00' },
  2: { enabled: true, start_time: '09:00', end_time: '17:00' },
  3: { enabled: true, start_time: '09:00', end_time: '17:00' },
  4: { enabled: true, start_time: '09:00', end_time: '17:00' },
  5: { enabled: true, start_time: '09:00', end_time: '17:00' },
  6: { enabled: false, start_time: '09:00', end_time: '17:00' },
};

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const DEFAULT_PROFILE: ProfileFormData = {
  display_name: '',
  business_name: '',
  headline: '',
  bio: '',
  location: '',
  trust_bullets: ['', '', ''],
  prompt_blocks: [],
  avatar_url: '',
  gallery_urls: [],
  avatar_file: null,
  gallery_files: [],
};

function hasProfileData(data: ProfileFormData): boolean {
  return !!(
    data.display_name ||
    data.business_name ||
    data.headline ||
    data.bio ||
    data.location ||
    data.avatar_file ||
    data.gallery_files.length > 0 ||
    data.trust_bullets.some((b) => b.trim().length > 0) ||
    data.prompt_blocks.some((b) => b.prompt.trim() || b.answer.trim())
  );
}

async function uploadImageFile(
  file: File,
  phone: string,
  imageType: 'avatar' | 'gallery'
): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('phone', phone);
  formData.append('image_type', imageType);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.image?.url ?? null;
  } catch {
    return null;
  }
}

export function SignupForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [handle, setHandle] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/Los_Angeles';
    }
  });
  const [schedule, setSchedule] =
    useState<Record<number, DaySchedule>>(DEFAULT_SCHEDULE);
  const [profileData, setProfileData] =
    useState<ProfileFormData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleDay = (dayIndex: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], enabled: !prev[dayIndex].enabled },
    }));
  };

  const updateDayTime = (
    dayIndex: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [field]: value },
    }));
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setHandle(value);
  };

  const handleProfileChange = useCallback((data: ProfileFormData) => {
    setProfileData(data);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const normalized = phone.startsWith('+') ? phone : toE164(phone);
      if (!isValidE164(normalized)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (!handle.trim()) {
      newErrors.handle = 'Handle is required';
    } else if (
      !/^[a-z0-9-]+$/.test(handle) ||
      handle.length < 2 ||
      handle.length > 30
    ) {
      newErrors.handle =
        'Handle must be 2-30 lowercase alphanumeric characters or hyphens';
    }

    const enabledDays = Object.values(schedule).filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      newErrors.schedule = 'Please enable at least one day';
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
      const normalizedPhone = phone.startsWith('+') ? phone : toE164(phone);

      // Step 1: Create user + schedule
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          handle,
          timezone,
          schedule,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Step 2: Upload images to Supabase Storage (via /api/upload).
      // Must happen after user creation because profile_images.user_phone
      // has a FK to users.phone. In demo mode, uploads are kept in-memory.
      let finalAvatarUrl = '';
      if (profileData.avatar_file) {
        const uploadedUrl = await uploadImageFile(
          profileData.avatar_file,
          normalizedPhone,
          'avatar'
        );
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const finalGalleryUrls: string[] = [];
      for (const file of profileData.gallery_files) {
        const uploadedUrl = await uploadImageFile(
          file,
          normalizedPhone,
          'gallery'
        );
        if (uploadedUrl) finalGalleryUrls.push(uploadedUrl);
      }

      // Abort if the user provided images but all uploads failed.
      if (profileData.avatar_file && !finalAvatarUrl) {
        setError('Avatar upload failed. Please try again.');
        return;
      }
      if (profileData.gallery_files.length > 0 && finalGalleryUrls.length === 0) {
        setError('Gallery image upload failed. Please try again.');
        return;
      }

      // Step 3: Save profile data (if any fields are populated).
      if (hasProfileData(profileData)) {
        const profileRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalizedPhone,
            display_name: profileData.display_name,
            business_name: profileData.business_name,
            headline: profileData.headline,
            bio: profileData.bio,
            location: profileData.location,
            avatar_url: finalAvatarUrl,
            gallery_urls: finalGalleryUrls,
            trust_bullets: profileData.trust_bullets.filter(Boolean),
            prompt_blocks: profileData.prompt_blocks.filter(
              (b) => b.prompt && b.answer
            ),
          }),
        });

        if (!profileRes.ok) {
          const profileErr = await profileRes.json().catch(() => ({}));
          setError(
            (profileErr as { error?: string }).error ||
              'Failed to save profile. Please try again.'
          );
          return;
        }
      }

      router.push(`/signup/success?handle=${handle}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="phone"
        label="Business number for confirmations"
        placeholder="+1 808 555 3434"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        autoComplete="tel"
      />

      <div className="flex flex-col gap-1.5">
        <Input
          id="handle"
          label="Your link"
          placeholder="jake"
          value={handle}
          onChange={handleHandleChange}
          error={errors.handle}
          autoComplete="off"
        />
        {handle && !errors.handle && (
          <p className="text-xs text-slate-500">
            Your link:{' '}
            <span className="font-medium text-indigo-600">
              {DISPLAY_DOMAIN}/{handle}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="timezone" className="text-sm font-medium text-slate-700">
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
          {!TIMEZONES.find((tz) => tz.value === timezone) && (
            <option value={timezone}>{timezone}</option>
          )}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">
          Weekly availability
        </label>
        {errors.schedule && (
          <p className="text-xs text-red-500">{errors.schedule}</p>
        )}
        <div className="space-y-2">
          {DAYS.map((day, index) => {
            const daySchedule = schedule[index];
            return (
              <div
                key={day}
                className={`rounded-xl border-2 transition-all duration-200 ${
                  daySchedule.enabled
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      daySchedule.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                    role="switch"
                    aria-checked={daySchedule.enabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        daySchedule.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium w-10 ${
                      daySchedule.enabled
                        ? 'text-indigo-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {SHORT_DAYS[index]}
                  </span>
                  {daySchedule.enabled ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={daySchedule.start_time}
                        onChange={(e) =>
                          updateDayTime(index, 'start_time', e.target.value)
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 text-sm">–</span>
                      <input
                        type="time"
                        value={daySchedule.end_time}
                        onChange={(e) =>
                          updateDayTime(index, 'end_time', e.target.value)
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-slate-300">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile setup section */}
      <ProfileSetupSection
        data={profileData}
        onChange={handleProfileChange}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Set up your profile →
      </Button>

      <p className="text-center text-xs text-slate-400">
        By signing up, you agree to our{' '}
        <a
          href="/terms"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms and Conditions
        </a>{' '}
        and{' '}
        <a
          href="/privacy"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

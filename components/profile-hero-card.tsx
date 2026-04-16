'use client';

import { Profile } from '@/lib/types';
import { cn } from '@/lib/cn';
import { TrustBulletRow } from './trust-bullet-row';

interface ProfileHeroCardProps {
  profile: Profile;
  handle: string;
  className?: string;
}

function AvatarInitials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white font-bold',
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 18s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z" />
      <circle cx="10" cy="8" r="2.2" />
    </svg>
  );
}

export function ProfileHeroCard({ profile, handle, className }: ProfileHeroCardProps) {
  const displayName = profile.display_name || profile.business_name || '';
  const showBusinessLine = profile.business_name && profile.display_name;
  const hasName = !!displayName;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px] bg-white border border-slate-100 px-6 pt-10 pb-8',
        'shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {/* Background gradient wash — taller and warmer */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-200/60 via-brand-100/40 to-transparent pointer-events-none"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Avatar with gradient ring — larger for dating-app feel */}
        <div className="relative">
          <div className="rounded-full p-[3.5px] bg-gradient-to-br from-brand-400 via-brand-500 to-violet-500 shadow-[0_16px_40px_-12px_rgba(91,76,255,0.50)]">
            <div className="rounded-full bg-white p-[3.5px]">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName || `@${handle}`}
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <AvatarInitials
                  name={displayName || handle}
                  className="w-28 h-28 text-4xl"
                />
              )}
            </div>
          </div>
          {/* Online / active indicator dot */}
          <span
            aria-hidden
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-[3px] border-white shadow-sm"
          />
          <span className="sr-only">Available now</span>
        </div>

        {/* Name + handle */}
        <div className="mt-6">
          <h1 className="font-display text-[30px] leading-tight font-bold text-slate-900 tracking-tight">
            {hasName ? displayName : `@${handle}`}
          </h1>

          {showBusinessLine && (
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {profile.business_name}
            </p>
          )}

          <p className="mt-1.5 text-sm font-semibold text-brand-600">@{handle}</p>
        </div>

        {/* Headline */}
        {profile.headline && (
          <p className="mt-3.5 text-[15px] text-slate-600 leading-relaxed max-w-[34ch]">
            {profile.headline}
          </p>
        )}

        {/* Service category pill */}
        {profile.service_category && (
          <span className="mt-3 inline-flex items-center rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {profile.service_category}
          </span>
        )}

        {/* Location */}
        {profile.location && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <PinIcon className="w-4 h-4 text-brand-500" />
            <span>{profile.location}</span>
          </p>
        )}

        {/* Trust bullets */}
        {profile.trust_bullets.length > 0 && (
          <div className="mt-6 w-full">
            <TrustBulletRow bullets={profile.trust_bullets} />
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Profile } from '@/lib/types';
import { cn } from '@/lib/cn';
import { TrustBulletRow } from './trust-bullet-row';

interface ProfileHeroCardProps {
  profile: Profile;
  handle: string;
  hasAvailabilityToday?: boolean;
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

export function ProfileHeroCard({ profile, handle, hasAvailabilityToday = false, className }: ProfileHeroCardProps) {
  const displayName = profile.display_name || profile.business_name || '';
  const showBusinessLine = profile.business_name && profile.display_name;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px] bg-white border border-slate-100 px-6 pt-8 pb-7',
        'shadow-[0_4px_20px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {/* Soft background wash */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-100 via-brand-50 to-transparent opacity-80 pointer-events-none"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Gradient ring avatar */}
        <div className="relative">
          <div className="rounded-full p-[3px] bg-gradient-to-br from-brand-400 via-brand-500 to-violet-500 shadow-[0_12px_28px_-12px_rgba(91,76,255,0.55)]">
            <div className="rounded-full bg-white p-[3px]">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName || `@${handle}`}
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <AvatarInitials
                  name={displayName || handle}
                  className="w-28 h-28 text-3xl"
                />
              )}
            </div>
          </div>
          {/* Online / available today indicator */}
          {hasAvailabilityToday && (
            <span
              aria-label="Available today"
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm"
            />
          )}
        </div>

        {/* Name + handle */}
        <div className="mt-5">
          {displayName ? (
            <h1 className="font-display text-[28px] leading-tight font-bold text-slate-900 tracking-tight">
              {displayName}
            </h1>
          ) : (
            <h1 className="font-display text-[28px] leading-tight font-bold text-slate-900 tracking-tight">
              @{handle}
            </h1>
          )}

          {showBusinessLine && (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {profile.business_name}
            </p>
          )}

          {displayName && (
            <p className="mt-1 text-sm font-medium text-brand-600">@{handle}</p>
          )}

          {/* Service category badge */}
          {profile.service_category && (
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <svg
                className="w-3 h-3 text-brand-500 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {profile.service_category}
            </span>
          )}
        </div>

        {/* Headline */}
        {profile.headline && (
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed max-w-[34ch]">
            {profile.headline}
          </p>
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
          <div className="mt-5 w-full">
            <TrustBulletRow bullets={profile.trust_bullets} />
          </div>
        )}
      </div>
    </div>
  );
}

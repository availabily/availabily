'use client';

import { Profile } from '@/lib/types';
import { cn } from '@/lib/cn';
import { TrustBulletRow } from './trust-bullet-row';

interface ProfileHeroCardProps {
  profile: Profile;
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
        'flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-bold',
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}

export function ProfileHeroCard({ profile, className }: ProfileHeroCardProps) {
  const displayName = profile.display_name || profile.business_name || '';

  return (
    <div className={cn('bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      {/* Avatar area */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
          />
        ) : (
          <AvatarInitials name={displayName} className="w-24 h-24 text-3xl shadow-lg" />
        )}

        <div className="mt-4 text-center">
          {profile.display_name && (
            <h1 className="text-2xl font-bold text-slate-900">{profile.display_name}</h1>
          )}
          {profile.business_name && (
            <p className={cn(
              'font-medium',
              profile.display_name ? 'text-sm text-slate-500 mt-0.5' : 'text-2xl text-slate-900 font-bold'
            )}>
              {profile.business_name}
            </p>
          )}
          {profile.headline && (
            <p className="text-base text-slate-600 mt-2 leading-relaxed">{profile.headline}</p>
          )}
          {profile.location && (
            <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1">
              <span>📍</span> {profile.location}
            </p>
          )}
        </div>

        {profile.trust_bullets.length > 0 && (
          <div className="mt-4">
            <TrustBulletRow bullets={profile.trust_bullets} />
          </div>
        )}
      </div>
    </div>
  );
}

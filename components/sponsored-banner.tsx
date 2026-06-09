'use client';

import { cn } from '@/lib/cn';

interface SponsoredProfile {
  name: string;
  handle: string;
  headline: string;
  location: string;
  category: string;
}

// Curated demo examples. Swap these for real featured handles later.
const SPONSORED: SponsoredProfile[] = [
  {
    name: 'Maya Rivera Photography',
    handle: 'mayarivera',
    headline: 'Weddings, engagements & family sessions across Maui',
    location: 'Lahaina, HI',
    category: 'Photography',
  },
  {
    name: "Jake's Mobile Detail",
    handle: 'jakedetail',
    headline: 'Premium auto detailing — we come to you',
    location: 'Kihei, HI',
    category: 'Auto Detailing',
  },
  {
    name: 'Island Lawn & Garden',
    handle: 'islandlawn',
    headline: 'Lawn care and landscaping done right',
    location: 'Wailuku, HI',
    category: 'Landscaping',
  },
];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function SponsoredCard({ profile }: { profile: SponsoredProfile }) {
  return (
    <div className="flex-none w-[300px] rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-none w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-white font-bold flex items-center justify-center">
          {initialsOf(profile.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{profile.name}</p>
          <p className="text-xs font-semibold text-indigo-600 truncate">
            amorpm.com/{profile.handle}
          </p>
        </div>
        <span className="ml-auto flex-none rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
          Sponsored
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-snug line-clamp-2">
        {profile.headline}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 font-medium text-slate-500">
          {profile.category}
        </span>
        <span>· {profile.location}</span>
      </div>
    </div>
  );
}

export function SponsoredBanner({ className }: { className?: string }) {
  // Duplicate the list so the -50% marquee translation loops seamlessly.
  const track = [...SPONSORED, ...SPONSORED];

  return (
    <section className={cn('px-6 pb-16 max-w-5xl mx-auto', className)}>
      <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400 mb-8">
        Featured pros on AM or PM?
      </h2>
      <div className="relative overflow-hidden marquee-pause [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex gap-4 w-max animate-marquee">
          {track.map((profile, i) => (
            <SponsoredCard key={`${profile.handle}-${i}`} profile={profile} />
          ))}
        </div>
      </div>
    </section>
  );
}

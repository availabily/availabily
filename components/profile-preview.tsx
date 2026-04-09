'use client';

import { ProfileFormData } from '@/components/profile-setup-section';
import { ProfileHeroCard } from '@/components/profile-hero-card';
import { SwipeGallery } from '@/components/swipe-gallery';
import { PromptCard } from '@/components/prompt-card';
import { Profile } from '@/lib/types';
import { cn } from '@/lib/cn';

interface ProfilePreviewProps {
  data: ProfileFormData;
  handle?: string;
  className?: string;
}

export function ProfilePreview({ data, handle, className }: ProfilePreviewProps) {
  // Convert form data to Profile shape for the hero card
  const profile: Profile = {
    user_phone: '',
    display_name: data.display_name,
    business_name: data.business_name,
    headline: data.headline,
    bio: data.bio,
    avatar_url: data.avatar_url,
    gallery_urls: data.gallery_urls,
    service_category: '',
    location: data.location,
    trust_bullets: data.trust_bullets.filter(Boolean),
    prompt_blocks: data.prompt_blocks.filter(b => b.prompt && b.answer),
  };

  const hasContent = profile.display_name || profile.business_name || profile.headline || profile.bio || profile.avatar_url || profile.gallery_urls.length > 0;

  if (!hasContent) {
    return (
      <div className={cn('bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center', className)}>
        <div className="text-3xl mb-3">📱</div>
        <p className="text-sm font-medium text-slate-500">Live preview</p>
        <p className="text-xs text-slate-400 mt-1">Fill in your profile to see how it looks</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10 rounded-3xl border border-slate-200 p-4 space-y-4 overflow-hidden', className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live preview</span>
      </div>

      <ProfileHeroCard profile={profile} handle={handle || 'yourhandle'} />

      {profile.gallery_urls.length > 0 && (
        <SwipeGallery images={profile.gallery_urls} />
      )}

      {profile.bio && (
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.prompt_blocks.map((block) => (
        <PromptCard key={block.id} block={block} />
      ))}

      {/* CTA placeholder */}
      <div className="bg-indigo-600 rounded-2xl px-5 py-4 text-center">
        <p className="text-white font-semibold text-sm">Pick a time</p>
        <p className="text-indigo-200 text-xs mt-1">Time slots will appear here</p>
      </div>
    </div>
  );
}

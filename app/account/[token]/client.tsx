'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ProfileSetupSection,
  ProfileFormData,
} from '@/components/profile-setup-section';
import { PromptBlock } from '@/lib/types';

const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
const DISPLAY_DOMAIN = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');

const EMPTY_PROFILE: ProfileFormData = {
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

interface AccountPageClientProps {
  token: string;
  handle: string;
}

async function uploadImageFile(
  file: File,
  token: string,
  imageType: 'avatar' | 'gallery'
): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('token', token);
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

export function AccountPageClient({ token, handle }: AccountPageClientProps) {
  const [profileData, setProfileData] = useState<ProfileFormData>(EMPTY_PROFILE);
  // service_category isn't part of the editor form, but we round-trip it so a
  // save doesn't wipe a value set elsewhere.
  const [serviceCategory, setServiceCategory] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const shareUrl = `${rawBase}/${handle}`;
  const displayUrl = `${DISPLAY_DOMAIN}/${handle}`;

  // Load the current profile via the public read endpoint and prefill the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(handle)}`);
        const data = await res.json().catch(() => ({}));
        const p = data?.profile;
        if (!cancelled && p) {
          const gallery: string[] = Array.isArray(p.gallery_urls) ? p.gallery_urls : [];
          const bullets: string[] = Array.isArray(p.trust_bullets) ? p.trust_bullets : [];
          const blocks: PromptBlock[] = Array.isArray(p.prompt_blocks) ? p.prompt_blocks : [];
          setServiceCategory(p.service_category ?? '');
          setProfileData({
            display_name: p.display_name ?? '',
            business_name: p.business_name ?? '',
            headline: p.headline ?? '',
            bio: p.bio ?? '',
            location: p.location ?? '',
            trust_bullets: [0, 1, 2].map((i) => bullets[i] ?? ''),
            prompt_blocks: blocks,
            avatar_url: p.avatar_url ?? '',
            gallery_urls: gallery,
            avatar_file: null,
            // null placeholder per existing image keeps files index-aligned
            // with gallery_urls (see ProfileFormData docs).
            gallery_files: gallery.map(() => null),
          });
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const handleProfileChange = useCallback((data: ProfileFormData) => {
    setProfileData(data);
    setSaved(false);
  }, []);

  async function handleSave() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      // Avatar: upload a freshly picked file, otherwise keep the saved URL.
      let finalAvatarUrl = '';
      if (profileData.avatar_file) {
        const uploaded = await uploadImageFile(profileData.avatar_file, token, 'avatar');
        if (!uploaded) {
          setError('Avatar upload failed. Please try again.');
          return;
        }
        finalAvatarUrl = uploaded;
      } else if (profileData.avatar_url && !profileData.avatar_url.startsWith('blob:')) {
        finalAvatarUrl = profileData.avatar_url;
      }

      // Gallery: walk gallery_urls; upload new files, keep already-saved URLs,
      // preserving order. gallery_files is index-aligned with gallery_urls.
      const finalGalleryUrls: string[] = [];
      for (let i = 0; i < profileData.gallery_urls.length; i++) {
        const url = profileData.gallery_urls[i];
        const file = profileData.gallery_files[i] ?? null;
        if (file) {
          const uploaded = await uploadImageFile(file, token, 'gallery');
          if (!uploaded) {
            setError('Gallery image upload failed. Please try again.');
            return;
          }
          finalGalleryUrls.push(uploaded);
        } else if (url && !url.startsWith('blob:')) {
          finalGalleryUrls.push(url);
        }
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          display_name: profileData.display_name,
          business_name: profileData.business_name,
          headline: profileData.headline,
          bio: profileData.bio,
          location: profileData.location,
          service_category: serviceCategory,
          avatar_url: finalAvatarUrl,
          gallery_urls: finalGalleryUrls,
          trust_bullets: profileData.trust_bullets.filter(Boolean),
          prompt_blocks: profileData.prompt_blocks.filter((b) => b.prompt && b.answer),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Failed to save. Please try again.');
        return;
      }

      // Reflect the persisted state: saved images are now real URLs, no pending files.
      setProfileData((prev) => ({
        ...prev,
        avatar_url: finalAvatarUrl,
        avatar_file: null,
        gallery_urls: finalGalleryUrls,
        gallery_files: finalGalleryUrls.map(() => null),
      }));
      setSaved(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 px-6 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <Link
              href="/"
              className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity inline-block mb-4"
            >
              <span className="text-indigo-600">AM</span>
              <span className="text-slate-500"> or </span>
              <span className="text-indigo-600">PM?</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Edit your profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Changes go live at{' '}
              <Link href={`/${handle}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                {displayUrl}
              </Link>
            </p>
          </div>

          {initializing ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <ProfileSetupSection data={profileData} onChange={handleProfileChange} />

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {saved && !error && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  ✓ Saved. Your page is updated.
                </div>
              )}

              <Button onClick={handleSave} loading={loading} size="lg" className="w-full">
                Save changes
              </Button>

              <div className="flex items-center justify-between text-sm">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View your page →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

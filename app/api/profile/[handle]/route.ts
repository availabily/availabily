import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
  }

  if (isDemo) {
    const profile = demoStore.getProfileByHandle(handle);
    if (!profile) {
      return NextResponse.json({ profile: null });
    }
    const images = demoStore.getProfileImages(profile.user_phone);
    return NextResponse.json({
      profile: {
        display_name: profile.display_name,
        business_name: profile.business_name,
        headline: profile.headline,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        gallery_urls: profile.gallery_urls,
        service_category: profile.service_category,
        location: profile.location,
        trust_bullets: profile.trust_bullets,
        prompt_blocks: profile.prompt_blocks,
      },
      images,
    });
  }

  const supabase = createServerClient();

  // Look up user by handle
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('handle', handle)
    .single();

  if (!user) {
    return NextResponse.json({ profile: null });
  }

  const { data: profile } = await supabase
    .from('amorpm_profiles')
    .select('*')
    .eq('user_phone', user.phone)
    .single();

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  const { data: images } = await supabase
    .from('profile_images')
    .select('*')
    .eq('user_phone', user.phone)
    .order('sort_order', { ascending: true });

  // Fall back to profile_images (gallery type) if profiles.gallery_urls is empty.
  // This keeps the page working for users whose gallery was stored in the
  // profile_images table rather than inline on the profile row.
  const storedGallery: string[] = Array.isArray(profile.gallery_urls)
    ? profile.gallery_urls
    : [];
  const galleryUrls =
    storedGallery.length > 0
      ? storedGallery
      : (images ?? [])
          .filter((img) => img.image_type === 'gallery')
          .map((img) => img.url);

  return NextResponse.json({
    profile: {
      display_name: profile.display_name,
      business_name: profile.business_name,
      headline: profile.headline,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      gallery_urls: galleryUrls,
      service_category: profile.service_category,
      location: profile.location,
      trust_bullets: profile.trust_bullets ?? [],
      prompt_blocks: profile.prompt_blocks ?? [],
    },
    images: images ?? [],
  });
}

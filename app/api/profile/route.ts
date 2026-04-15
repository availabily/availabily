import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { isValidE164 } from '@/lib/utils';
import { Profile, PromptBlock } from '@/lib/types';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface ProfileBody {
  phone: string;
  display_name?: string;
  business_name?: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  gallery_urls?: string[];
  service_category?: string;
  location?: string;
  trust_bullets?: string[];
  prompt_blocks?: PromptBlock[];
}

function validateProfile(body: ProfileBody): string | null {
  if (!body.phone || !isValidE164(body.phone)) {
    return 'Valid phone number in E.164 format is required';
  }
  if (body.bio && body.bio.length > 300) {
    return 'Bio must be 300 characters or fewer';
  }
  if (body.trust_bullets && body.trust_bullets.length > 3) {
    return 'Maximum 3 trust bullets allowed';
  }
  if (body.trust_bullets) {
    for (const bullet of body.trust_bullets) {
      if (bullet.length > 50) {
        return 'Each trust bullet must be 50 characters or fewer';
      }
    }
  }
  if (body.prompt_blocks && body.prompt_blocks.length > 3) {
    return 'Maximum 3 prompt blocks allowed';
  }
  if (body.prompt_blocks) {
    for (const block of body.prompt_blocks) {
      if (!block.id || !block.prompt || !block.answer) {
        return 'Each prompt block must have id, prompt, and answer';
      }
      if (block.answer.length > 500) {
        return 'Prompt block answers must be 500 characters or fewer';
      }
    }
  }
  if (body.gallery_urls && body.gallery_urls.length > 5) {
    return 'Maximum 5 gallery images allowed';
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: ProfileBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validationError = validateProfile(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const profile: Profile = {
    user_phone: body.phone,
    display_name: body.display_name ?? '',
    business_name: body.business_name ?? '',
    headline: body.headline ?? '',
    bio: body.bio ?? '',
    avatar_url: body.avatar_url ?? '',
    gallery_urls: body.gallery_urls ?? [],
    service_category: body.service_category ?? '',
    location: body.location ?? '',
    trust_bullets: body.trust_bullets ?? [],
    prompt_blocks: body.prompt_blocks ?? [],
  };

  if (isDemo) {
    const user = demoStore.getUserByPhone(body.phone);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    demoStore.upsertProfile(profile);
    return NextResponse.json({ success: true });
  }

  const supabase = createServerClient();

  // Verify user exists
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('phone', body.phone)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('amorpm_profiles')
    .upsert({
      user_phone: body.phone,
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
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to upsert profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

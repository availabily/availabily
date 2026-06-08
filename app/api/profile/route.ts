import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { Profile, PromptBlock } from '@/lib/types';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface ProfileBody {
  // Owner is resolved from the secret manage_token (preferred, used by the
  // /account editor and signup) or from phone (server-trusted contexts like the
  // quote flow). The public handle is intentionally NOT accepted here — it would
  // let anyone overwrite a profile they don't own.
  token?: string;
  phone?: string;
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
  if (!body.phone && !body.token) {
    return 'Either token or phone is required';
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
  if (body.avatar_url && body.avatar_url.startsWith('blob:')) {
    return 'Invalid avatar URL';
  }
  if (body.gallery_urls?.some(url => url.startsWith('blob:'))) {
    return 'Invalid gallery URL';
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

  // Resolve phone from the secret manage_token when the caller supplies a token.
  // This is what authorizes an edit: only someone holding the token can write.
  let resolvedPhone = body.phone ?? '';
  if (body.token) {
    if (isDemo) {
      const u = demoStore.getUserByManageToken(body.token);
      if (!u) return NextResponse.json({ error: 'Invalid edit link' }, { status: 404 });
      resolvedPhone = u.phone;
    } else {
      const sb = createServerClient();
      const { data: u } = await sb.from('users').select('phone').eq('manage_token', body.token).maybeSingle();
      if (!u) return NextResponse.json({ error: 'Invalid edit link' }, { status: 404 });
      resolvedPhone = u.phone;
    }
  }

  const profile: Profile = {
    user_phone: resolvedPhone,
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
    const user = demoStore.getUserByPhone(resolvedPhone);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    demoStore.upsertProfile(profile);
    return NextResponse.json({ success: true });
  }

  const supabase = createServerClient();

  // Verify user exists (skip if we already resolved via token above)
  if (body.phone && !body.token) {
    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', resolvedPhone)
      .single();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_phone: resolvedPhone,
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

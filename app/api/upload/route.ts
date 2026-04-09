import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/demo-store';
import { isValidE164 } from '@/lib/utils';
import { ProfileImage } from '@/lib/types';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const phone = formData.get('phone') as string | null;
    const imageType = formData.get('image_type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!phone || !isValidE164(phone)) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }
    if (!imageType || !['avatar', 'gallery'].includes(imageType)) {
      return NextResponse.json({ error: 'image_type must be avatar or gallery' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }

    if (isDemo) {
      // In demo mode, store as base64 data URL
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const id = `img-${Math.random().toString(36).slice(2)}`;
      const existingImages = demoStore.getProfileImages(phone);
      const sortOrder = existingImages.length;

      const image: ProfileImage = {
        id,
        user_phone: phone,
        image_type: imageType as 'avatar' | 'gallery',
        url: dataUrl,
        thumbnail_url: dataUrl,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
      };

      demoStore.createProfileImage(image);

      return NextResponse.json({ success: true, image });
    }

    // Production: upload to Supabase Storage
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${phone.replace('+', '')}/${imageType}-${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    const url = publicUrl.publicUrl;

    // Save to profile_images table
    const existingImages = await supabase
      .from('profile_images')
      .select('id')
      .eq('user_phone', phone);

    const sortOrder = existingImages.data?.length ?? 0;

    const { data: image, error: dbError } = await supabase
      .from('profile_images')
      .insert({
        user_phone: phone,
        image_type: imageType,
        url,
        thumbnail_url: url,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, image });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

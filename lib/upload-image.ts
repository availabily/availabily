/**
 * Uploads an image file directly to Supabase Storage and returns the public URL.
 * Falls back to a local data URL when running in demo mode or if Storage is unavailable.
 */

import { createBrowserClient } from '@/lib/supabase';

const BUCKET = 'profile-images';
const MAX_WIDTH = 1200;

// ─── Supabase Storage upload (production) ────────────────────────────────────

export async function uploadImageToStorage(file: File): Promise<string> {
  const supabase = createBrowserClient();

  // Use a timestamp + random suffix to avoid collisions; keep the extension.
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}

// ─── Data URL fallback (demo mode / offline) ──────────────────────────────────

export function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Unified helper: uses Storage in production, data URL in demo mode ────────

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function uploadImage(file: File): Promise<string> {
  if (isDemo) {
    return imageToDataUrl(file);
  }
  try {
    return await uploadImageToStorage(file);
  } catch (err) {
    console.warn('Supabase Storage upload failed, falling back to data URL:', err);
    return imageToDataUrl(file);
  }
}

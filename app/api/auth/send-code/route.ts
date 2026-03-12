import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendEmail } from '@/lib/email';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildCodeEmail(code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;color:#1e293b;">
      <h2 style="color:#4f46e5;margin-bottom:8px;">Your sign-in code</h2>
      <p>Use this code to sign in to AM or PM?</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:20px;background:#eef2ff;border-radius:8px;text-align:center;margin:20px 0;">
        ${code}
      </div>
      <p style="color:#64748b;font-size:14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  // ── Demo mode ──
  if (isDemo) {
    const user = demoStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'No account found with that email address' }, { status: 404 });
    }
    demoStore.storeMagicCode(email, code, expiresAt.getTime());
    await sendEmail(email, 'Your AM or PM? sign-in code', buildCodeEmail(code));
    return NextResponse.json({ success: true });
  }

  // ── Production ──
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'No account found with that email address' }, { status: 404 });
  }

  // Store code in DB
  const { error: insertError } = await supabase
    .from('magic_codes')
    .insert({ email, code, expires_at: expiresAt.toISOString(), used: false });

  if (insertError) {
    console.error('Failed to store magic code:', insertError);
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 });
  }

  try {
    await sendEmail(email, 'Your AM or PM? sign-in code', buildCodeEmail(code));
  } catch (err) {
    console.error('Failed to send magic code email:', err);
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

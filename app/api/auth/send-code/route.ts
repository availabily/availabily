import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { generateOTP, storeOTP } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Look up user by email
  let user: { phone: string; handle: string; email: string } | null = null;

  if (isDemo) {
    const demoUser = demoStore.getUserByEmail(normalizedEmail);
    if (demoUser && demoUser.email) {
      user = { phone: demoUser.phone, handle: demoUser.handle, email: demoUser.email };
    }
  } else {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('users')
      .select('phone, handle, email')
      .eq('email', normalizedEmail)
      .single();
    if (data) {
      user = data as { phone: string; handle: string; email: string };
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  const code = generateOTP();
  storeOTP(normalizedEmail, code);

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px;">
        <span style="color:#4f46e5;">AM</span> or <span style="color:#4f46e5;">PM?</span>
      </h1>
      <p style="color:#64748b;margin-bottom:24px;">Here is your login code:</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${code}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail(normalizedEmail, 'Your AM or PM? login code', html);
  } catch (err) {
    console.error('Failed to send login email:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

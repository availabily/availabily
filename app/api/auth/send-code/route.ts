import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, storeOTP, getUserByEmail } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email: rawEmail } = body;
  if (!rawEmail || typeof rawEmail !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  const code = generateOTP();
  storeOTP(email, code);

  try {
    await sendEmail({
      to: email,
      subject: 'Your AM or PM? login code',
      text: `Your login code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `<p>Your login code is:</p><h2 style="font-size:2rem;letter-spacing:0.25rem;font-family:monospace">${code}</h2><p>This code expires in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error('Failed to send login code email:', err);
    return NextResponse.json({ error: 'Failed to send login code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

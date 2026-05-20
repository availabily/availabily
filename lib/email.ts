import { Resend } from 'resend';
import type { Meeting } from './types';

export function smsBodyToHtml(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split('\n')
    .map(line => {
      const parts = line.split(/(https?:\/\/[^\s]+)/g);
      const html = parts
        .map((p, i) => (i % 2 === 0 ? esc(p) : `<a href="${esc(p)}">${esc(p)}</a>`))
        .join('');
      return `<p>${html}</p>`;
    })
    .join('');
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  // Use `||` not `??`: a blank EMAIL_FROM env var must fall back to the default,
  // otherwise Resend rejects every send for having an empty `from` address.
  const from = process.env.EMAIL_FROM || 'AM or PM? <bookings@amorpm.com>';
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemo || !apiKey) {
    console.log('\n📧 [Email] Would send:');
    console.log(`  To: ${opts.to}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body:\n${opts.text.split('\n').map(l => `    ${l}`).join('\n')}\n`);
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    ...(opts.html ? { html: opts.html } : {}),
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }
}

export async function sendCompletionSummaryEmail(opts: {
  meeting: Meeting;
  ownerName: string;
  ownerEmail: string | null;
}): Promise<void> {
  const { meeting, ownerName, ownerEmail } = opts;
  const visitorEmail = meeting.visitor_email ?? null;

  const dateStr = new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const amountStr = meeting.quote_amount_cents
    ? `$${(meeting.quote_amount_cents / 100).toFixed(2)}`
    : null;

  if (visitorEmail) {
    const body = amountStr
      ? `Your appointment with ${ownerName} on ${dateStr} is complete. Agreed amount: ${amountStr}. ${ownerName} will collect payment directly — reach out to them with any questions.`
      : `Your appointment with ${ownerName} on ${dateStr} is complete. ${ownerName} will be in touch about payment.`;
    await sendEmail({
      to: visitorEmail,
      subject: `Appointment complete — ${ownerName}`,
      text: body,
      html: smsBodyToHtml(body),
    });
  }

  if (ownerEmail) {
    const body = amountStr
      ? `Appointment with ${meeting.visitor_name} on ${dateStr} is complete. Agreed amount: ${amountStr}. Collect payment directly from them.`
      : `Appointment with ${meeting.visitor_name} on ${dateStr} is complete. Collect payment directly from them.`;
    await sendEmail({
      to: ownerEmail,
      subject: `Appointment complete — ${meeting.visitor_name}`,
      text: body,
      html: smsBodyToHtml(body),
    });
  }
}

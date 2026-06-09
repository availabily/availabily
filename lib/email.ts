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

export interface EmailAttachment {
  filename: string;
  content: Buffer | string; // Buffer or base64-encoded string
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
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
    console.log(`  Body:\n${opts.text.split('\n').map(l => `    ${l}`).join('\n')}`);
    if (opts.attachments?.length) {
      console.log(`  Attachments: ${opts.attachments.map(a => a.filename).join(', ')}`);
    }
    console.log('');
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    ...(opts.html ? { html: opts.html } : {}),
    ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
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
  // Cash invoices have no Stripe number; use a stable reference from the meeting id.
  const invoiceRef = `CASH-${meeting.id.replace(/\W/g, '').slice(0, 8).toUpperCase()}`;

  if (visitorEmail) {
    const body = amountStr
      ? [
          `Invoice ${invoiceRef} for your ${dateStr} appointment with ${ownerName}.`,
          `Amount due: ${amountStr}`,
          `Payment method: Cash (collected in person)`,
          `${ownerName} collects payment directly — reach out to them with any questions.`,
        ].join('\n')
      : [
          `Invoice ${invoiceRef} for your ${dateStr} appointment with ${ownerName}.`,
          `Payment method: Cash (collected in person)`,
          `${ownerName} will be in touch about the amount due.`,
        ].join('\n');
    await sendEmail({
      to: visitorEmail,
      subject: `Invoice ${invoiceRef} — ${ownerName}`,
      text: body,
      html: smsBodyToHtml(body),
    });
  }

  if (ownerEmail) {
    const body = amountStr
      ? [
          `Invoice ${invoiceRef} — appointment with ${meeting.visitor_name} on ${dateStr} is complete.`,
          `Amount due: ${amountStr}`,
          `Payment method: Cash (collect in person)`,
        ].join('\n')
      : [
          `Invoice ${invoiceRef} — appointment with ${meeting.visitor_name} on ${dateStr} is complete.`,
          `Payment method: Cash (collect in person)`,
        ].join('\n');
    await sendEmail({
      to: ownerEmail,
      subject: `Invoice ${invoiceRef} — ${meeting.visitor_name} (cash)`,
      text: body,
      html: smsBodyToHtml(body),
    });
  }
}

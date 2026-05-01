import { Resend } from 'resend';

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
  const from = process.env.EMAIL_FROM ?? 'AM or PM? <bookings@amorpm.com>';
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

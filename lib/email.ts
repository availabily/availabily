import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemo || !apiKey) {
    console.log('\n📧 [Email] Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'AM or PM? <noreply@amorpm.com>',
    to,
    subject,
    html,
  });
}

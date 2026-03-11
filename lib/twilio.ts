import twilio from 'twilio';

export async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // In demo mode or when credentials are missing, log to console instead of sending
  if (isDemo || !accountSid || !authToken || !fromPhone) {
    console.log('\n📱 [SMS] Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Body:\n${body.split('\n').map(l => `    ${l}`).join('\n')}\n`);
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({ body, from: fromPhone, to });
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // In demo mode or when credentials are missing, log to console instead of sending
  if (isDemo || !accountSid || !authToken || !from) {
    console.log('\n📱 [SMS] Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Body:\n${body.split('\n').map(l => `    ${l}`).join('\n')}\n`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Twilio SMS failed with status ${response.status}: ${errorText}`);
  }
}

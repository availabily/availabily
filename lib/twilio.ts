export async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const hasCreds = accountSid && authToken && (messagingServiceSid || from);

  // In demo mode or when credentials are missing, log to console instead of sending
  if (isDemo || !hasCreds) {
    console.log('\n📱 [SMS] Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Body:\n${body.split('\n').map(l => `    ${l}`).join('\n')}\n`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // Prefer Messaging Service SID for better deliverability (including VoIP numbers)
  const sender = messagingServiceSid
    ? { MessagingServiceSid: messagingServiceSid }
    : { From: from as string };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, Body: body, ...sender }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Twilio SMS failed with status ${response.status}: ${errorText}`);
  }
}

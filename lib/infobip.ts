export async function sendSMS(to: string, body: string): Promise<void> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_API_BASE_URL;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // In demo mode or when credentials are missing, log to console instead of sending
  if (isDemo || !apiKey || !baseUrl) {
    console.log('\n📱 [SMS] Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Body:\n${body.split('\n').map(l => `    ${l}`).join('\n')}\n`);
    return;
  }

  // Validate baseUrl is a plain hostname (no protocol, path, or special chars)
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(baseUrl)) {
    throw new Error('Invalid INFOBIP_API_BASE_URL format');
  }

  const response = await fetch(`https://${baseUrl}/sms/2/text/advanced`, {
    method: 'POST',
    headers: {
      Authorization: `App ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      messages: [{ destinations: [{ to }], text: body }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Infobip SMS failed with status ${response.status}`);
  }
}

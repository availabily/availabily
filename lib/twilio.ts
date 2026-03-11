import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

export async function sendSMS(to: string, body: string): Promise<void> {
  const client = twilio(accountSid, authToken);
  await client.messages.create({
    body,
    from: fromPhone,
    to,
  });
}

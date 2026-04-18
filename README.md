# AM or PM?

A minimal, beautiful scheduling app. Share your availability link → visitors pick a time → you confirm by text.

## Quick preview (no accounts needed)

Run the app locally in **demo mode** — no Supabase, no Twilio, no sign-up required:

```bash
git clone https://github.com/availabily/availabily
cd availabily
npm install
cp .env.example .env.local   # already has NEXT_PUBLIC_DEMO_MODE=true
npm run dev
```

Then open:

| URL | What you'll see |
|-----|-----------------|
| [localhost:3000](http://localhost:3000) | Landing page |
| [localhost:3000/demo](http://localhost:3000/demo) | Pre-built availability page (Mon–Fri 9–5 PT) |
| [localhost:3000/signup](http://localhost:3000/signup) | Signup flow (creates users in-memory) |

In demo mode, SMS messages are **printed to your terminal** instead of sent. All data resets when you restart the server.

---

## How It Works

1. **Create your page** at `/signup` — add your phone, handle, and weekly availability
2. **Share your link** — `amorpm.com/yourhandle`
3. **Visitors pick a time** — they choose a slot and enter their info
4. **You get an SMS** with a confirm link
5. **Tap confirm** — you're redirected into your SMS app with a prewritten message to the visitor

## Tech Stack

- **Next.js App Router** + TypeScript
- **TailwindCSS**
- **Supabase** (PostgreSQL)
- **Twilio** (SMS)
- **Vercel** (deployment)

## Production Setup

### 1. Clone and install

```bash
git clone https://github.com/availabily/availabily
cd availabily
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your credentials (remove or set `NEXT_PUBLIC_DEMO_MODE=false`):

```
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=         # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=        # From Supabase project settings (secret)
TWILIO_ACCOUNT_SID=               # From Twilio console
TWILIO_AUTH_TOKEN=                # From Twilio console (secret)
TWILIO_PHONE_NUMBER=              # Your Twilio phone number in E.164 format (e.g. +18005551234)
NEXT_PUBLIC_BASE_URL=https://amorpm.com
```

### 3. Set up the database

In your Supabase SQL editor, run the contents of `supabase/schema.sql`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables in your Vercel project settings.

## Project Structure

```
availabily/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── signup/page.tsx         # Signup page
│   ├── [handle]/               # Public availability page
│   │   ├── page.tsx
│   │   └── client.tsx          # Client component
│   ├── c/[token]/route.ts      # Confirm route
│   └── api/
│       ├── signup/route.ts
│       ├── request/route.ts
│       └── availability/[handle]/route.ts
├── lib/
│   ├── scheduling.ts           # Slot computation engine
│   ├── demo-store.ts           # In-memory store for demo mode
│   ├── supabase.ts             # Supabase client
│   ├── twilio.ts               # Twilio SMS helper
│   ├── utils.ts                # Formatting utilities
│   └── types.ts                # TypeScript types
├── components/
│   ├── demo-banner.tsx         # Demo mode indicator banner
│   ├── day-selector.tsx
│   ├── time-slot-grid.tsx
│   ├── request-form.tsx
│   ├── signup-form.tsx
│   └── ui/
│       ├── button.tsx
│       └── input.tsx
└── supabase/
    └── schema.sql
```

## Database Schema

3 tables: `users`, `time_rules`, `meetings`. See `supabase/schema.sql` for full schema.

---

## Payments

This app uses Stripe Connect (Express accounts) to accept payments on behalf of business owners, with an application fee that routes to the platform.

### Setup

1. Create a Stripe account and enable Connect at https://dashboard.stripe.com/settings/connect
2. Grab test-mode API keys and set:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_APPLICATION_FEE_PERCENT=5
   ```
3. Set up the webhook at https://dashboard.stripe.com/test/webhooks
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen to:
     - `account.updated`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `invoice.finalization_failed`
   - Listen to: **Events on Connected accounts**
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`
4. Set `CRON_SECRET` to any long random string. Vercel will use this for the automated cron job.

### Local webhook testing

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen \
  --forward-to localhost:3000/api/stripe/webhook \
  --forward-connect-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_...` secret — use that as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

> **Keep `stripe listen` running the entire time you're testing locally.** If you restart it, you may get a new secret — update `.env.local` accordingly.

### Manually triggering the cron

```bash
curl -X GET http://localhost:3000/api/cron/generate-invoices \
  -H "Authorization: Bearer $CRON_SECRET"
```

The cron runs automatically every 15 minutes on Vercel (configured in `vercel.json`).

### Application fee

Set `STRIPE_APPLICATION_FEE_PERCENT` (e.g., `"5"` = 5%). The platform keeps this percentage of every paid invoice; the rest routes to the owner's connected account.

### Demo mode payment flow

With `NEXT_PUBLIC_DEMO_MODE=true`, the full payment flow is simulated without real Stripe calls:

1. Book an appointment via `/demo`
2. Owner sends quote via `/q/[token]`
3. Customer accepts via the accept link
4. Set `ends_at` to the past (via temp debug endpoint or `demo-store.ts`)
5. Hit the cron: `curl -H "Authorization: Bearer test" http://localhost:3000/api/cron/generate-invoices`
6. Visit `/demo/invoice/[id]` to see the personalized invoice
7. Click **Pay** to simulate payment success (or the failure button for the failure path)

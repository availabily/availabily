# Availabily

A minimal, beautiful scheduling app. Share your availability link → visitors pick a time → you confirm by text.

## How It Works

1. **Create your page** at `/signup` — add your phone, handle, and weekly availability
2. **Share your link** — `availabily.com/yourhandle`
3. **Visitors pick a time** — they choose a slot and enter their info
4. **You get an SMS** with a confirm link
5. **Tap confirm** — you're redirected into your SMS app with a prewritten message to the visitor

## Tech Stack

- **Next.js App Router** + TypeScript
- **TailwindCSS**
- **Supabase** (PostgreSQL)
- **Twilio** (SMS)
- **Vercel** (deployment)

## Setup

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

Fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=         # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=        # From Supabase project settings (secret)
TWILIO_ACCOUNT_SID=               # From Twilio console
TWILIO_AUTH_TOKEN=                # From Twilio console
TWILIO_PHONE_NUMBER=              # Your Twilio phone number (E.164 format)
NEXT_PUBLIC_BASE_URL=https://availabily.com
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
│   ├── supabase.ts             # Supabase client
│   ├── twilio.ts               # Twilio SMS helper
│   ├── utils.ts                # Formatting utilities
│   └── types.ts                # TypeScript types
├── components/
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

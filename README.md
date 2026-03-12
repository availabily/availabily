# AM or PM?

A minimal, beautiful scheduling app. Share your availability link → visitors pick a time → you get an email notification → confirm in the dashboard.

## Quick preview (no accounts needed)

Run the app locally in **demo mode** — no Supabase, no external services required:

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
| [localhost:3000/login](http://localhost:3000/login) | Owner login (email OTP) |
| [localhost:3000/dashboard](http://localhost:3000/dashboard) | Owner dashboard |

In demo mode, emails and SMS are **printed to your terminal** instead of sent. All data resets when you restart the server.

> **Demo login**: In demo mode, enter `demo@amorpm.com` as the email on the login page. The OTP code will appear in your terminal.

---

## How It Works

1. **Create your page** at `/signup` — add your phone, email, handle, and weekly availability
2. **Share your link** — `amorpm.com/yourhandle`
3. **Visitors pick a time** — they choose a slot and enter their info
4. **You get an email + in-app notification** with a confirm link
5. **Log in at `/login`** → your dashboard shows pending requests
6. **Tap confirm** → meeting is confirmed and visitor can receive a confirmation text

## Tech Stack

- **Next.js App Router** + TypeScript
- **TailwindCSS v4**
- **Supabase** (PostgreSQL)
- **Resend** (email notifications & auth OTP)
- **Infobip** (SMS fallback — optional, requires carrier registration)
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase project settings (secret)
SUPABASE_SERVICE_ROLE_KEY=        # From Supabase project settings (secret)
RESEND_API_KEY=                   # From resend.com (free tier: 3,000 emails/month)
INFOBIP_API_KEY=                  # Optional — Infobip SMS fallback
INFOBIP_API_BASE_URL=             # Optional — Infobip base URL
NEXT_PUBLIC_BASE_URL=https://amorpm.com
```

> **Note on the `from` email**: The default sender is `noreply@amorpm.com`. If you haven't verified this domain in Resend, update the `from` field in `lib/email.ts` to `onboarding@resend.dev` for testing, then switch to your verified domain in production.

### 3. Set up the database

In your Supabase SQL editor, run `supabase/schema.sql`.

If you already have the `users` table without the `email` column, run:
```sql
ALTER TABLE users ADD COLUMN email TEXT;
CREATE INDEX users_email_idx ON users(email);
```

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
│   ├── login/page.tsx          # Email OTP login
│   ├── dashboard/
│   │   ├── page.tsx            # Server component wrapper
│   │   └── client.tsx          # Dashboard UI (auth-gated)
│   ├── signup/page.tsx         # Signup page
│   ├── [handle]/               # Public availability page
│   │   ├── page.tsx
│   │   └── client.tsx
│   ├── c/[token]/route.ts      # Confirm route (HTML confirmation page)
│   └── api/
│       ├── auth/
│       │   ├── send-code/route.ts   # POST: send OTP email
│       │   ├── verify-code/route.ts # POST: verify OTP, set session cookie
│       │   ├── logout/route.ts      # POST: clear session
│       │   └── me/route.ts          # GET: current user info
│       ├── notifications/
│       │   ├── route.ts             # GET: fetch notifications
│       │   └── read/route.ts        # POST: mark as read
│       ├── dashboard/
│       │   └── meetings/route.ts    # GET: pending + recent meetings
│       ├── signup/route.ts
│       ├── request/route.ts
│       └── availability/[handle]/route.ts
├── lib/
│   ├── auth.ts                 # OTP store + session management
│   ├── email.ts                # Resend email helper
│   ├── scheduling.ts           # Slot computation engine
│   ├── demo-store.ts           # In-memory store for demo mode
│   ├── supabase.ts             # Supabase client
│   ├── infobip.ts              # Infobip SMS helper (fallback)
│   ├── utils.ts                # Formatting utilities
│   └── types.ts                # TypeScript types
├── components/
│   ├── demo-banner.tsx
│   ├── day-selector.tsx
│   ├── time-slot-grid.tsx
│   ├── request-form.tsx
│   ├── signup-form.tsx         # Now includes email field
│   └── ui/
│       ├── button.tsx
│       └── input.tsx
└── supabase/
    └── schema.sql
```

## Database Schema

4 tables: `users` (with `email` column), `time_rules`, `meetings`, `notifications`. See `supabase/schema.sql` for the full schema.

## Authentication

Email-based OTP login:
1. Owner enters email at `/login`
2. Server sends a 6-digit code via Resend
3. Owner enters the code → session cookie is set (7-day expiry, httpOnly)
4. Redirected to `/dashboard`

Sessions are stored in-memory on the server. They reset on server restart (fine for Vercel serverless as the cookie re-authenticates on next use).

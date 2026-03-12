# AM or PM?

A minimal, beautiful scheduling app. Share your availability link → visitors pick a time → you confirm by text.

## Quick preview (no accounts needed)

Run the app locally in **demo mode** — no Supabase, no Infobip, no sign-up required:

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
- **Infobip** (SMS)
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
INFOBIP_API_KEY=                  # From Infobip dashboard
INFOBIP_API_BASE_URL=             # From Infobip dashboard (e.g., abc123.api.infobip.com)
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
│   ├── infobip.ts              # Infobip SMS helper
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

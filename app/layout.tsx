import type { Metadata } from 'next';
import { DemoBanner } from '@/components/demo-banner';
import './globals.css';

const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
const metadataBaseUrl =
  rawBase.startsWith('https://') || rawBase.startsWith('http://')
    ? rawBase
    : `https://${rawBase}`;

export const metadata: Metadata = {
  title: 'AM or PM? — Share your availability, get booked by text',
  description: 'The simplest way to share your availability. Visitors pick a time, you confirm by text.',
  metadataBase: new URL(metadataBaseUrl),
  openGraph: {
    title: 'AM or PM?',
    description: 'Share your availability. Get booked by text.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: DM Sans for body, Playfair Display for headings */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}

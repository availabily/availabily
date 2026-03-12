import type { Metadata } from 'next';
import { DemoBanner } from '@/components/demo-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'AM or PM? — Share your availability, get booked by text',
  description: 'The simplest way to share your availability. Visitors pick a time, you confirm by text.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com'),
  openGraph: {
    title: 'AM or PM?',
    description: 'Share your availability. Get booked by text.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}

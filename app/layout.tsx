import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Availabily — Share your availability, get booked by text',
  description: 'The simplest way to share your availability. Visitors pick a time, you confirm by text.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://availabily.com'),
  openGraph: {
    title: 'Availabily',
    description: 'Share your availability. Get booked by text.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

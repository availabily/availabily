'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense } from 'react';

const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
const DISPLAY_DOMAIN = rawBase.replace(/^https?:\/\//, '').replace(/\/$/, '');

function SuccessContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get('handle') || '';
  const shareableUrl = `${rawBase}/${handle}`;
  const displayUrl = `${DISPLAY_DOMAIN}/${handle}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = shareableUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-6">
          <div className="text-6xl">🎉</div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Your profile is live ✨</h1>
            <p className="text-slate-500">Share your link with customers so they can book a time with you.</p>
          </div>

          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Your link</p>
            <p className="text-lg font-bold text-indigo-700 break-all">{displayUrl}</p>
          </div>

          <button
            onClick={copyLink}
            className={`w-full inline-flex items-center justify-center gap-2 font-semibold text-base px-6 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
              copied
                ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy link'}
          </button>

          <Link
            href={`/${handle}`}
            className="block text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View your page →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

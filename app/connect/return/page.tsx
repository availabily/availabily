import Link from 'next/link';
import { getAccountStatus } from '@/lib/stripe-connect';
import { isValidE164 } from '@/lib/utils';

export default async function ConnectReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; error?: string }>;
}) {
  const { phone = '', error = '' } = await searchParams;
  const status = isValidE164(phone) ? await getAccountStatus(phone) : null;

  const charges_enabled = status?.charges_enabled ?? false;
  const details_submitted = status?.details_submitted ?? false;
  const hasError = error === 'connect';
  const encodedPhone = encodeURIComponent(phone);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40 flex items-start justify-center pt-16 px-5">
      <div className="w-full max-w-[480px]">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity inline-block"
          >
            <span className="text-brand-500">AM</span>
            <span className="text-slate-500"> or </span>
            <span className="text-brand-500">PM?</span>
          </Link>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
          {hasError ? (
            <>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.14em] mb-1">
                Payments unavailable
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-3">
                We couldn&apos;t start payment setup
              </h1>
              <p className="text-sm text-slate-500 mb-4">
                Card payments aren&apos;t available just yet. You can still confirm this
                booking as a consultation, or collect payment yourself — head back to the
                booking link in your email and choose how you&apos;d like to handle it.
              </p>
              <a
                href={`/api/connect/start?phone=${encodedPhone}`}
                className="inline-flex items-center justify-center w-full rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-base px-6 py-3.5 transition-all duration-200 hover:bg-slate-50"
              >
                Try again →
              </a>
            </>
          ) : charges_enabled ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-none">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.14em]">
                  Payments ready
                </p>
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-3">
                You&apos;re all set. Payments are ready.
              </h1>
              <p className="text-sm text-slate-500">
                If a customer is waiting on a quote from you, check your email for the booking link and tap it again.
              </p>
            </>
          ) : details_submitted ? (
            <>
              <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
                Almost there
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-3">
                Stripe is verifying your info
              </h1>
              <p className="text-sm text-slate-500">
                Usually takes a few minutes; sometimes a day.
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-1">
                Setup incomplete
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-4">
                Setup isn&apos;t finished yet.
              </h1>
              <a
                href={`/api/connect/start?phone=${encodedPhone}`}
                className="inline-flex items-center justify-center w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5 transition-all duration-200 hover:bg-brand-700 shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]"
              >
                Continue setup →
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

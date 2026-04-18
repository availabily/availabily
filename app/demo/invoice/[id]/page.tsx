import { notFound } from 'next/navigation';
import Link from 'next/link';
import { demoStore } from '@/lib/demo-store';
import { ownerDisplayName, ownerLongName } from '@/lib/owner-display';
import { formatAmountCents, formatDateDisplay, formatShortDay, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function DemoInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDemo) notFound();

  const { id } = await params;
  const meeting = demoStore.getMeetingById(id);
  if (!meeting) notFound();

  const user = demoStore.getUserByPhone(meeting.user_phone);
  const profile = demoStore.getProfile(meeting.user_phone);

  if (!user) notFound();

  const ownerName = ownerDisplayName(profile, user);
  const ownerFull = ownerLongName(profile, user);
  const amountCents = meeting.quote_amount_cents ?? 0;

  const dueDateStr = meeting.invoice_sent_at
    ? new Date(new Date(meeting.invoice_sent_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '7 days from invoice';

  let lineDesc = meeting.quote_description || 'Service';
  if (profile?.service_category) {
    lineDesc = `${profile.service_category} — ${lineDesc}`;
  }

  const appointmentLabel = `${formatShortDay(meeting.meeting_date)} ${formatTime(meeting.start_time)}`;

  let footer = ownerName;
  if (profile?.location) footer += ` · ${profile.location}`;

  const isPaid = meeting.status === 'paid';

  return (
    <main className="min-h-screen bg-slate-50 flex items-start justify-center pt-10 px-4 pb-16">
      <div className="w-full max-w-[540px]">
        {/* Demo badge */}
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-1">
            Demo invoice — not a real Stripe page
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
                  Invoice
                </p>
                <p className="text-2xl font-bold">{ownerFull}</p>
                {profile?.location && (
                  <p className="text-sm opacity-75 mt-0.5">{profile.location}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold">{formatAmountCents(amountCents)}</p>
                <p className="text-xs opacity-70 mt-1">Due {dueDateStr}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-6">
            {/* Bill to */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Bill to
              </p>
              <p className="font-semibold text-slate-900">{meeting.visitor_name}</p>
              <p className="text-sm text-slate-500">{meeting.visitor_phone}</p>
            </div>

            {/* Line items */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Services
              </p>
              <div className="flex justify-between items-start gap-4 py-3 border-t border-b border-slate-100">
                <p className="text-sm text-slate-700 flex-1">{lineDesc}</p>
                <p className="font-semibold text-slate-900 shrink-0">
                  {formatAmountCents(amountCents)}
                </p>
              </div>
              <div className="flex justify-between items-center pt-3">
                <p className="font-semibold text-slate-900">Total</p>
                <p className="font-bold text-slate-900 text-lg">
                  {formatAmountCents(amountCents)}
                </p>
              </div>
            </div>

            {/* Custom fields */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Appointment</span>
                <span className="font-medium text-slate-800">{appointmentLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800">
                  {formatDateDisplay(meeting.meeting_date)}
                </span>
              </div>
              {profile?.service_category && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-800">{profile.service_category}</span>
                </div>
              )}
            </div>

            {/* Pay / paid */}
            {isPaid ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <p className="text-sm font-semibold text-emerald-700">Payment confirmed</p>
              </div>
            ) : (
              <form
                action="/api/demo/simulate-payment"
                method="POST"
              >
                <input type="hidden" name="meeting_id" value={meeting.id} />
                <input type="hidden" name="action" value="succeed" />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-brand-600 text-white font-semibold text-base px-6 py-3.5 transition-all duration-200 hover:bg-brand-700 shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)] inline-flex items-center justify-center"
                >
                  Pay {formatAmountCents(amountCents)}
                </button>
              </form>
            )}

            {/* Simulate failure — only when not paid */}
            {!isPaid && (
              <form action="/api/demo/simulate-payment" method="POST">
                <input type="hidden" name="meeting_id" value={meeting.id} />
                <input type="hidden" name="action" value="fail" />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-slate-200 bg-white text-slate-500 text-xs font-medium px-6 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  Simulate payment failure (testing)
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400">{footer}</p>
              {profile?.headline && (
                <p className="text-xs text-slate-400 mt-0.5">{profile.headline}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
            Back to AM or PM?
          </Link>
        </div>
      </div>
    </main>
  );
}

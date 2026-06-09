import { ProfileHeroCard } from '@/components/profile-hero-card';
import { Profile } from '@/lib/types';

// Curated example profile so visitors see exactly what their page becomes.
const EXAMPLE_PROFILE: Profile = {
  user_phone: '',
  display_name: 'Maya Rivera',
  business_name: 'Maya Rivera Photography',
  headline: 'Weddings, engagements & family sessions across Maui',
  bio: '',
  avatar_url: '',
  gallery_urls: [],
  service_category: 'Photography',
  location: 'Lahaina, HI',
  trust_bullets: ['5-star rated', 'Booked 200+ events', 'Fast turnaround'],
  prompt_blocks: [],
};

const EXAMPLE_SLOTS = ['9:00 AM', '11:30 AM', '1:00 PM', '3:30 PM'];

export function ExampleProfile() {
  return (
    <section className="px-6 pb-20 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
          See what your page looks like
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Every AM or PM? page shows who you are, then lets customers pick a length
          and a time in a couple of taps.
        </p>
      </div>

      <div className="max-w-[420px] mx-auto space-y-5">
        <ProfileHeroCard profile={EXAMPLE_PROFILE} handle="mayarivera" />

        {/* Mock booking card mirroring the real availability UI (non-interactive). */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
            Availability
          </p>
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-5">Pick a time</h3>

          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-1.5">How long do you need?</p>
            <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 flex items-center justify-between">
              <span>2 hr</span>
              <span className="text-slate-400">▾</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {EXAMPLE_SLOTS.map((slot, i) => (
              <div
                key={slot}
                className={
                  i === 1
                    ? 'rounded-2xl border border-brand-600 bg-brand-600 text-white px-3 py-3 text-sm font-semibold text-center'
                    : 'rounded-2xl border border-slate-100 bg-white text-slate-700 px-3 py-3 text-sm font-semibold text-center'
                }
              >
                {slot}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

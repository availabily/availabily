import { SignupForm } from '@/components/signup-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AM or PM? — Schedule jobs. Get booked by email.',
  description:
    'The simplest way to share your availability. Visitors pick a time, you confirm by email.',
};

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Set up your profile',
    description:
      'Build your business profile and schedule in 60 seconds. Get a link like amorpm.com/lahainawindows.',
    icon: '🏢',
  },
  {
    step: '2',
    title: 'Share it with customers',
    description:
      'Send your link to customers via any channel. No app required — just a simple URL.',
    icon: '💬',
  },
  {
    step: '3',
    title: 'They pick a time',
    description:
      'Customers see your open slots, pick one, and enter their name, number, and address.',
    icon: '📅',
  },
  {
    step: '4',
    title: 'You confirm by email',
    description:
      "You get an email with their details. Confirm and you're connected. Done.",
    icon: '✅',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-indigo-600">AM</span>
          <span className="text-slate-900"> or </span>
          <span className="text-indigo-600">PM?</span>
        </Link>
        <a
          href="#signup"
          className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Get started →
        </a>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-10 pb-14 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 mb-6">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Free &amp; simple
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
          Your booking profile,
          <br />
          <span className="text-indigo-600">in 2 minutes.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Let customers see who they&apos;re booking with — then pick a time. No
          apps, no dashboards, no friction.
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400 mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Step {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Signup form */}
      <section id="signup" className="px-6 pb-20 max-w-xl mx-auto scroll-mt-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Create your page
            </h2>
            <p className="text-slate-500">
              Set up your availability in under a minute.
            </p>
          </div>
          <SignupForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400">
          © 2026 AM or PM? Simple scheduling, done right.
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <Link href="/privacy" className="text-slate-400 hover:text-slate-600">
            Privacy
          </Link>
          <Link href="/terms" className="text-slate-400 hover:text-slate-600">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

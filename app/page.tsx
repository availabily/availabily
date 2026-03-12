import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AM or PM? — Share your availability, get booked by text',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-xl font-bold tracking-tight">
            <span className="text-indigo-600">AM</span>
            <span className="text-slate-900"> or </span>
            <span className="text-indigo-600">PM?</span>
          </span>
        <Link
          href="/signup"
          className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Create yours →
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 mb-6">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Free &amp; simple</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Share your availability.
          <br />
          <span className="text-indigo-600">Get booked by text.</span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          One link. Visitors pick a time, enter their info, and you get an SMS to confirm.
          No apps, no dashboards, no friction.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98]"
        >
          Create your page →
        </Link>
        <p className="mt-4 text-sm text-slate-400">Free. No credit card. Takes 60 seconds.</p>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400 mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Share your link',
              description: 'You get a simple link like amorpm.com/jake. Share it anywhere.',
              icon: '🔗',
            },
            {
              step: '2',
              title: 'They pick a time',
              description: 'Visitors see your open slots, pick one, and leave their name and phone.',
              icon: '📅',
            },
            {
              step: '3',
              title: 'You confirm by text',
              description: "You get an SMS. Tap confirm. You're dropped into a text with them. Done.",
              icon: '💬',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step {item.step}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Ready to simplify scheduling?</h2>
          <p className="text-slate-500 mb-8">Create your availability page in under a minute.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            Create your page →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400">
          © 2026 AM or PM? Simple scheduling, done right.
        </p>
      </footer>
    </main>
  );
}

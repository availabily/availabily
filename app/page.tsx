import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AM or PM? — Schedule jobs. Get booked by text.',
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
        <Link
          href="/login"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Log in
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 mb-6">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Free &amp; simple</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Schedule jobs.
          <br />
          <span className="text-indigo-600">Get booked by text.</span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          Create your business page, text the link to customers, and they pick a time and enter their details. You get notified instantly.
          No apps, no friction.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              title: 'Create your page',
              description: 'Set up your business schedule in 60 seconds. Get a link like amorpm.com/lahainawindows.',
              icon: '🏢',
            },
            {
              step: '2',
              title: 'Text it to customers',
              description: 'Send your link to customers via text. No app required — just a simple URL.',
              icon: '💬',
            },
            {
              step: '3',
              title: 'They pick a time',
              description: 'Customers see your open slots, pick one, and enter their name, number, and address.',
              icon: '📅',
            },
            {
              step: '4',
              title: 'You confirm by SMS',
              description: "You get a text with their details. Tap confirm and you're connected. Done.",
              icon: '✅',
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

import { SignupForm } from '@/components/signup-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create your page — Availabily',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      <nav className="px-6 py-5 max-w-xl mx-auto">
        <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
          Availabily
        </Link>
      </nav>

      <div className="px-6 py-8 max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your page</h1>
            <p className="text-slate-500">Set up your availability in under a minute.</p>
          </div>
          <SignupForm />
        </div>
      </div>
    </main>
  );
}

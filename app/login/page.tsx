'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess('Check your email — we sent you a 6-digit code.');
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid or expired code. Please try again.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-indigo-600">AM</span>
              <span className="text-slate-900"> or </span>
              <span className="text-indigo-600">PM?</span>
            </span>
          </Link>
          <p className="mt-2 text-slate-500 text-sm">Owner dashboard login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {step === 'email' ? (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h1>
              <p className="text-sm text-slate-500 mb-6">Enter your email to receive a login code.</p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Send code →
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Check your email</h1>
              <p className="text-sm text-slate-500 mb-6">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              {success && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  id="code"
                  label="6-digit code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="one-time-code"
                  autoFocus
                />

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Verify code →
                </Button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                  setSuccess('');
                }}
                className="mt-4 w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

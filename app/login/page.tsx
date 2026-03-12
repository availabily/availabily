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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.');
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
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

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {step === 'email' ? (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Sign in</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your business email and we&apos;ll send you a login code.
              </p>
              <form onSubmit={handleSendCode} className="space-y-4">
                <Input
                  id="email"
                  label="Business email"
                  placeholder="you@business.com"
                  type="email"
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
                  Send login code →
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Check your email</h1>
              <p className="text-sm text-slate-500 mb-6">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>.
                Enter it below to sign in.
              </p>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  id="code"
                  label="Login code"
                  placeholder="123456"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
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
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setCode(''); }}
                  className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
            Create yours →
          </Link>
        </p>
      </div>
    </main>
  );
}

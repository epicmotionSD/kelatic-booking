'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';

interface CheckInResult {
  matched: boolean;
  clientName?: string;
}

export default function CheckInPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sign-in failed');
      }

      setResult({ matched: !!data.matched, clientName: data.clientName });
      setName('');
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800 flex flex-col">
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-stone-800">
            KeLatic
          </Link>
          <PublicAuthLinks />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-medium text-stone-900">Sign In</h1>
          <p className="text-stone-500 mt-3">
            Let us know you&apos;re here — whether you have an appointment or just walked in.
          </p>
        </div>

        <div className="bg-white border border-[#e7ddcd] rounded-2xl p-6 shadow-sm">
          {result ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#e6efe2] border border-[#5b7a52]/40 flex items-center justify-center text-2xl text-[#5b7a52]">
                ✓
              </div>
              {result.matched ? (
                <>
                  <h2 className="font-playfair text-xl font-medium text-[#5b7a52]">
                    Welcome{result.clientName ? `, ${result.clientName}` : ''}!
                  </h2>
                  <p className="text-stone-600 text-sm">
                    We see your appointment — your stylist will be with you shortly.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-playfair text-xl font-medium text-[#5b7a52]">
                    You&apos;re signed in
                  </h2>
                  <p className="text-stone-600 text-sm">
                    Have a seat — we&apos;ll be with you as soon as we can.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-[#8a5a2b] hover:text-[#b08344] text-sm font-medium"
              >
                Sign in another person →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-[#9a4b34]/30 bg-[#9a4b34]/10 px-4 py-3 text-[#9a4b34] text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="checkin-name" className="block text-sm text-stone-600 mb-2">
                  Name
                </label>
                <input
                  id="checkin-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e7ddcd] text-stone-800 focus:outline-none focus:border-[#b08344]"
                  required
                />
              </div>

              <div>
                <label htmlFor="checkin-phone" className="block text-sm text-stone-600 mb-2">
                  Phone
                </label>
                <input
                  id="checkin-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e7ddcd] text-stone-800 focus:outline-none focus:border-[#b08344]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-[#b08344] text-white font-semibold text-lg hover:bg-[#9a6f33] shadow-sm hover:shadow-md transition-all hover:scale-[1.03] disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : "I'm Here"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Booked online?{' '}
          <Link href="/login?type=client&redirect=/account" className="text-[#8a5a2b] hover:text-[#b08344]">
            Sign in to your account
          </Link>{' '}
          for receipts and history.
        </p>
      </main>

      <Footer />
    </div>
  );
}
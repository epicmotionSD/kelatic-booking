'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import type { Profile } from '@/types/database';

const HEARD_ABOUT_OPTIONS = [
  'Instagram',
  'Google Search',
  'Friend/Family',
  'Walked by',
  'Returning client',
  'Other',
];

export default function WalkInPage() {
  const [stylists, setStylists] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [preferredStylistId, setPreferredStylistId] = useState('');

  useEffect(() => {
    async function fetchStylists() {
      try {
        const res = await fetch('/api/stylists');
        const data = await res.json();
        setStylists(data.stylists || []);
      } catch (err) {
        console.error('Failed to load stylists:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStylists();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const preferredStylist = stylists.find((s) => s.id === preferredStylistId);
      const res = await fetch('/api/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          heard_about: heardAbout || null,
          preferred_stylist_id: preferredStylistId || null,
          preferred_stylist_name: preferredStylist
            ? `${preferredStylist.first_name} ${preferredStylist.last_name}`
            : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit walk-in request');
      }

      setSuccess(true);
      setName('');
      setPhone('');
      setHeardAbout('');
      setPreferredStylistId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit walk-in request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-black font-black">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white">KELATIC</span>
                <span className="text-[9px] tracking-widest text-amber-400">WALK-IN</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link href="/book" className="text-sm text-white/60 hover:text-amber-400 transition-colors">
                Book appointment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-amber-400">
              Walk-in Check-In
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-4">Check in for a walk-in visit</h1>
            <p className="text-white/60 mt-3">
              Tell us a bit about you and we&apos;ll get you into the queue. If you&apos;re a returning client, you can
              sign in to save your info.
            </p>

            <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-zinc-900">
              <p className="text-white/70 text-sm">Already a client?</p>
              <Link
                href="/login"
                className="inline-flex items-center mt-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                Sign in to save your details →
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Walk-in Details</h2>

            {success && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm">
                Thanks! You&apos;re checked in. We&apos;ll call you shortly.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">How did you hear about us?</label>
                <select
                  value={heardAbout}
                  onChange={(e) => setHeardAbout(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select one</option>
                  {HEARD_ABOUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Preferred stylist</label>
                <select
                  value={preferredStylistId}
                  onChange={(e) => setPreferredStylistId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Any available stylist</option>
                  {loading ? (
                    <option value="" disabled>
                      Loading stylists...
                    </option>
                  ) : (
                    stylists.map((stylist) => (
                      <option key={stylist.id} value={stylist.id}>
                        {stylist.first_name} {stylist.last_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Check in'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

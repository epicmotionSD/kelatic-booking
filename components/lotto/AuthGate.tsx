'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';

export function useLottoSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const sb = lottoClient();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

interface Props {
  heading?: string;
  subheading?: string;
  children: (session: Session) => ReactNode;
}

// Passwordless email sign-in; returns the player to the exact page
// (including ?code=XXXXXX deep links) after they tap the email link.
export default function AuthGate({ heading = 'Sign in to play', subheading, children }: Props) {
  const session = useLottoSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (session === undefined) {
    return <div className="py-20 text-center text-slate-400">Loading…</div>;
  }
  if (session) return <>{children(session)}</>;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const next = window.location.pathname + window.location.search;
    const { error } = await lottoClient().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/lotto/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-bold text-white">{heading}</h2>
      {subheading && <p className="mt-1 text-slate-300">{subheading}</p>}
      {sent ? (
        <p className="mt-6 rounded-lg bg-emerald-500/15 p-4 text-emerald-200">
          Check <span className="font-semibold">{email}</span> and tap the link to continue. You can close this tab.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-4">
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-amber-400 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}
    </div>
  );
}

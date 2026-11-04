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
    return <div className="py-20 text-center text-[#A7A9D6]">Loading…</div>;
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
    <div className="mx-auto max-w-md rounded-2xl border border-[#2A2A5A] bg-[#16163A] p-6">
      <h2 className="font-[family-name:var(--font-ld-display)] text-2xl font-extrabold">{heading}</h2>
      {subheading && <p className="mt-1 text-[#A7A9D6]">{subheading}</p>}
      {sent ? (
        <p className="mt-6 rounded-lg bg-[#22D3B6]/15 p-4 text-[#22D3B6]">
          Check <span className="font-semibold">{email}</span> and tap the link to continue. You can close this tab.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-4">
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            className="w-full rounded-lg border border-[#2A2A5A] bg-[#0B0B1E] p-3 text-[#FFF8E7] placeholder:text-[#A7A9D6]/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-[#FF4D6D]">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#FFC93C] py-3 font-bold text-[#0B0B1E] disabled:opacity-50">
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}
    </div>
  );
}

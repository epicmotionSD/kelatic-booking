'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import AuthGate from '@/components/lotto/AuthGate';
import { lottoClient } from '@/lib/lotto/supabase';
import { GAMES, type LottoPool } from '@/lib/lotto/types';

export default function LottoHome() {
  return (
    <div className="space-y-8">
      <section className="space-y-3 pt-4 text-center">
        <h1 className="text-4xl font-black leading-tight text-white">Your crew vs. the draw.</h1>
        <p className="text-slate-300">
          Start a league, share one link, and everyone gets a card. Numbers light up live after every official draw.
        </p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/lotto/commissioner" className="rounded-xl bg-amber-400 py-4 text-center font-black text-slate-950">
          Start a league
        </Link>
        <Link href="/lotto/join" className="rounded-xl border border-white/15 py-4 text-center font-black text-white">
          I have a code
        </Link>
      </div>
      <AuthGate heading="Your leagues" subheading="Sign in to see the leagues you're in.">
        {(session) => <MyLeagues session={session} />}
      </AuthGate>
    </div>
  );
}

function MyLeagues({ session }: { session: Session }) {
  const [pools, setPools] = useState<LottoPool[] | null>(null);

  useEffect(() => {
    // RLS returns only leagues you commission or have a card in
    lottoClient()
      .from('lotto_pools')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPools((data ?? []) as LottoPool[]));
  }, []);

  if (!pools) return <p className="text-slate-400">Loading…</p>;
  if (pools.length === 0) return <p className="text-center text-slate-400">No leagues yet. Start one or join with a code.</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Your leagues</h2>
      {pools.map((p) => (
        <Link
          key={p.id}
          href={`/lotto/league/${p.id}`}
          className="flex items-center justify-between rounded-xl border border-white/10 p-4 hover:bg-white/5"
        >
          <div>
            <p className="font-bold text-white">{p.name}</p>
            <p className="text-xs text-slate-400">
              {GAMES[p.game].label} · {p.status}
              {p.commissioner_id === session.user.id && ' · you run this'}
            </p>
          </div>
          <span className="text-slate-500">→</span>
        </Link>
      ))}
    </section>
  );
}

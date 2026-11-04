'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import AuthGate from '@/components/lotto/AuthGate';
import { BingoCard } from '@/components/lotto/LottoBall';
import { lottoClient } from '@/lib/lotto/supabase';
import { GAMES, type LottoPool, type WaitlistRow } from '@/lib/lotto/types';

const STEPS = [
  { n: '1', title: 'Start a pool', body: 'Name it, share one link. Free for up to 10 players.' },
  { n: '2', title: 'Everyone gets a card', body: '5 numbers plus the Powerball, picked at random.' },
  { n: '3', title: 'Official draws mark it', body: 'Matches light up after every real Powerball drawing.' },
  { n: '4', title: 'Fill it, yell BINGO', body: 'First one to get all 6 wins. Then run it back.' },
];

export default function LottoHome() {
  return (
    <div className="space-y-10">
      <section className="space-y-5 pt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#FFC93C]">LottoDuel</p>
        <h1 className="font-[family-name:var(--font-ld-display)] text-4xl font-extrabold leading-[1.05] sm:text-5xl">
          The Bingo Pool Manager powered by official lottery drawings.
        </h1>
        <p className="mx-auto max-w-md text-[#A7A9D6]">
          First one to get all their numbers:{' '}
          <span className="font-[family-name:var(--font-ld-display)] font-extrabold text-[#FF4D6D]">BINGO!</span>
        </p>
        <div className="flex justify-center pt-1">
          <BingoCard numbers={[7, 19, 33, 48, 61]} special={12} matched={[19, 48]} specialMatched size="sm" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/lotto/commissioner" className="rounded-xl bg-[#FFC93C] py-4 text-center font-black text-[#0B0B1E] hover:brightness-105">
          Start a pool
        </Link>
        <Link href="/lotto/join" className="rounded-xl border border-[#2A2A5A] bg-[#16163A] py-4 text-center font-black hover:border-[#FFC93C]/50">
          I have a code
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4">
            <p className="font-[family-name:var(--font-ld-display)] text-2xl font-extrabold text-[#FFC93C]">{s.n}</p>
            <p className="mt-1 font-bold">{s.title}</p>
            <p className="mt-1 text-sm text-[#A7A9D6]">{s.body}</p>
          </div>
        ))}
      </section>

      <AuthGate heading="Your pools" subheading="Sign in to see the pools you're in.">
        {(session) => <MyPools session={session} />}
      </AuthGate>
    </div>
  );
}

function MyPools({ session }: { session: Session }) {
  const [pools, setPools] = useState<LottoPool[] | null>(null);
  const [waiting, setWaiting] = useState<WaitlistRow[]>([]);

  useEffect(() => {
    const sb = lottoClient();
    // RLS returns only pools you commission or have a card in
    sb.from('lotto_pools').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPools((data ?? []) as LottoPool[]));
    sb.from('lotto_my_waitlist').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setWaiting((data ?? []) as WaitlistRow[]));
  }, []);

  if (!pools) return <p className="text-[#A7A9D6]">Loading…</p>;

  return (
    <div className="space-y-6">
      {waiting.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Waiting for the next season</h2>
          {waiting.map((w) =>
            w.next_pool_code ? (
              <Link
                key={w.pool_id}
                href={`/lotto/join?code=${w.next_pool_code}`}
                className="flex items-center justify-between rounded-xl border border-[#FFC93C] bg-[#FFC93C]/10 p-4"
              >
                <div>
                  <p className="font-bold">{w.pool_name}: Season {w.season + 1} is open</p>
                  <p className="text-xs text-[#A7A9D6]">Tap to get your card</p>
                </div>
                <span className="font-black text-[#FFC93C]">Join →</span>
              </Link>
            ) : (
              <div key={w.pool_id} className="rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4">
                <p className="font-bold">{w.pool_name}</p>
                <p className="text-xs text-[#A7A9D6]">
                  You&apos;re on the list for Season {w.season + 1}. It opens after someone hits BINGO.
                </p>
              </div>
            )
          )}
        </section>
      )}

      {pools.length === 0 ? (
        waiting.length === 0 && <p className="text-center text-[#A7A9D6]">No pools yet. Start one or join with a code.</p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Your pools</h2>
          {pools.map((p) => (
            <Link
              key={p.id}
              href={`/lotto/league/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4 hover:border-[#FFC93C]/50"
            >
              <div>
                <p className="font-bold">
                  {p.name} {p.season > 1 && <span className="text-xs text-[#A7A9D6]">· Season {p.season}</span>}
                </p>
                <p className="text-xs text-[#A7A9D6]">
                  {GAMES[p.game].label} · {p.status === 'won' ? 'BINGO!' : p.status === 'live' ? 'in play' : 'open'}
                  {p.commissioner_id === session.user.id && ' · you run this'}
                </p>
              </div>
              <span className="text-[#A7A9D6]">→</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import { friendlyError, GAMES, type LottoGame, type LottoPool, type Tier } from '@/lib/lotto/types';
import { ShareInvite } from './ShareInvite';

const INPUT = 'w-full rounded-lg border border-[#2A2A5A] bg-[#0B0B1E] p-3 text-[#FFF8E7] placeholder:text-[#A7A9D6]/50';

export default function CreateLeague({ session }: { session: Session }) {
  const [tier, setTier] = useState<Tier>('free');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [game, setGame] = useState<LottoGame>('powerball');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<LottoPool | null>(null);

  useEffect(() => {
    lottoClient()
      .from('lotto_players')
      .select('tier, display_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tier) setTier(data.tier);
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [session.user.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error } = await lottoClient().rpc('lotto_create_pool', {
      p_name: name,
      p_game: game,
      p_win_condition: 6,
      p_display_name: displayName || null,
    });
    setBusy(false);
    if (error) setError(friendlyError(error.message));
    else setCreated(data as LottoPool);
  };

  if (created) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">Your pool is live</h2>
        <p className="text-[#A7A9D6]">Players join with this code:</p>
        <div className="font-mono text-6xl font-black tracking-[0.2em] text-[#FFC93C]">{created.join_code}</div>
        <ShareInvite code={created.join_code} poolName={created.name} />
        <Link
          href={`/lotto/league/${created.id}`}
          className="block rounded-lg border border-[#2A2A5A] py-3 font-semibold hover:border-[#FFC93C]/50"
        >
          Open the live board →
        </Link>
        <p className="text-xs text-[#A7A9D6]">
          Cards start counting at the next official {GAMES[created.game].label} drawing. Anyone who shows up after that goes on the waitlist for Season 2.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={create} className="space-y-6">
      <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">Start a bingo pool</h2>

      <Field label="Pool name">
        <input required maxLength={80} placeholder="e.g. KeLatic VIP Pool" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Your name on the board">
        <input maxLength={40} placeholder="Commissioner" className={INPUT} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </Field>

      <Field label="Drawn from">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(GAMES) as LottoGame[]).map((g) => {
            const locked = GAMES[g].pro && tier !== 'pro';
            return (
              <button
                type="button"
                key={g}
                disabled={locked}
                onClick={() => setGame(g)}
                className={`rounded-lg border p-3 text-left ${
                  game === g ? 'border-[#FFC93C] bg-[#FFC93C]/10' : 'border-[#2A2A5A] bg-[#16163A]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="font-bold">
                  {GAMES[g].label} {locked && <span className="ml-1 rounded bg-[#FFC93C]/15 px-1.5 text-xs text-[#FFC93C]">PRO</span>}
                </div>
                <div className="text-xs text-[#A7A9D6]">{GAMES[g].drawDays}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <div className="rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4 text-sm text-[#A7A9D6]">
        <p className="font-bold text-[#FFF8E7]">The rule</p>
        Every card has 5 numbers plus the {GAMES[game].special}. Matches add up across official drawings. First one to
        get all 6 hits <span className="font-black text-[#FF4D6D]">BINGO!</span> Pools usually run 1 to 3 months.
      </div>

      {error && <p className="text-[#FF4D6D]">{error}</p>}

      <button disabled={busy} className="w-full rounded-lg bg-[#FFC93C] py-4 text-lg font-black text-[#0B0B1E] disabled:opacity-50">
        {busy ? 'Creating…' : 'Create pool'}
      </button>
      <p className="text-center text-xs text-[#A7A9D6]/70">
        {tier === 'pro' ? 'Pro pools hold 100 players.' : 'Free pools hold 10 players.'} LottoDuel is a free game: no entry
        fees, no prizes paid through the app.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#A7A9D6]">{label}</span>
      {children}
    </label>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import { friendlyError, GAMES, type LottoGame, type LottoPool, type Tier } from '@/lib/lotto/types';
import ShareInvite from './ShareInvite';

export default function CreateLeague({ session }: { session: Session }) {
  const [tier, setTier] = useState<Tier>('free');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [game, setGame] = useState<LottoGame>('powerball');
  const [winCondition, setWinCondition] = useState(3);
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
      p_win_condition: winCondition,
      p_display_name: displayName || null,
    });
    setBusy(false);
    if (error) setError(friendlyError(error.message));
    else setCreated(data as LottoPool);
  };

  if (created) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-3xl font-black text-white">League created</h2>
        <p className="text-slate-300">Players join with this code:</p>
        <div className="font-mono text-6xl font-black tracking-[0.2em] text-amber-400">{created.join_code}</div>
        <ShareInvite code={created.join_code} poolName={created.name} />
        <Link
          href={`/lotto/league/${created.id}`}
          className="block rounded-lg border border-white/15 py-3 font-semibold text-white hover:bg-white/5"
        >
          Open the live board →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={create} className="space-y-6">
      <h2 className="text-3xl font-black text-white">Start a league</h2>

      <Field label="League name">
        <input
          required
          maxLength={80}
          placeholder="e.g. KeLatic VIP Pool"
          className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Your name on the board">
        <input
          maxLength={40}
          placeholder="Commissioner"
          className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>

      <Field label="Draws from">
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
                  game === g ? 'border-amber-400 bg-amber-400/10' : 'border-white/15'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="font-bold text-white">
                  {GAMES[g].label} {locked && <span className="ml-1 rounded bg-white/10 px-1.5 text-xs">PRO</span>}
                </div>
                <div className="text-xs text-slate-400">{GAMES[g].drawDays}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={`Win condition: first to ${winCondition} of 5 numbers`}>
        <input
          type="range"
          min={1}
          max={5}
          value={winCondition}
          onChange={(e) => setWinCondition(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
      </Field>

      {error && <p className="text-rose-300">{error}</p>}

      <button disabled={busy} className="w-full rounded-lg bg-amber-400 py-4 text-lg font-black text-slate-950 disabled:opacity-50">
        {busy ? 'Creating…' : 'Create league'}
      </button>
      <p className="text-center text-xs text-slate-500">
        Free leagues hold {tier === 'pro' ? 100 : 10} players. Lotto Duel is a free game: no entry fees, no prizes paid through the app.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

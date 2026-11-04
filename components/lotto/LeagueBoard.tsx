'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import { GAMES, type LottoDraw, type LottoPlayer, type LottoPool, type RosterRow } from '@/lib/lotto/types';
import LottoBall from './LottoBall';
import ShareInvite from './ShareInvite';
import SmsOptIn from './SmsOptIn';
import UpgradeCard from './UpgradeCard';

const STATUS_LABEL = { open: 'Open for players', live: 'Live · joins locked', won: 'Finished' } as const;

// Live leaderboard for every member. The Commissioner additionally sees
// the join code, share button, roster capacity and the Pro upgrade.
export default function LeagueBoard({ poolId, session }: { poolId: string; session: Session }) {
  const sb = lottoClient();
  const [pool, setPool] = useState<LottoPool | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [draws, setDraws] = useState<LottoDraw[]>([]);
  const [me, setMe] = useState<LottoPlayer | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  const loadRoster = useCallback(async () => {
    const { data } = await sb.from('lotto_roster').select('*').eq('pool_id', poolId);
    setRoster((data ?? []) as RosterRow[]);
  }, [sb, poolId]);

  const loadMe = useCallback(async () => {
    const { data } = await sb.from('lotto_players').select('*').eq('id', session.user.id).maybeSingle();
    setMe(data as LottoPlayer | null);
  }, [sb, session.user.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: p } = await sb.from('lotto_pools').select('*').eq('id', poolId).maybeSingle();
      if (cancelled) return;
      if (!p) return setState('missing');
      setPool(p as LottoPool);
      const [{ data: d }] = await Promise.all([
        sb.from('lotto_draws').select('*').eq('game', p.game).order('draw_date', { ascending: false }).limit(3),
        loadRoster(),
        loadMe(),
      ]);
      if (cancelled) return;
      setDraws((d ?? []) as LottoDraw[]);
      setState('ready');
    })();

    // Realtime: hits stream in as the draw trigger updates cards
    const channel = sb
      .channel(`lotto-pool-${poolId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lotto_entries', filter: `pool_id=eq.${poolId}` },
        ({ new: row }) =>
          setRoster((cur) =>
            cur.map((r) => (r.entry_id === row.id ? { ...r, matched_numbers: row.matched_numbers, won_at: row.won_at } : r))
          ))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lotto_entries', filter: `pool_id=eq.${poolId}` },
        () => loadRoster())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lotto_pools', filter: `id=eq.${poolId}` },
        ({ new: row }) => setPool((cur) => (cur ? { ...cur, ...(row as LottoPool) } : cur)))
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [sb, poolId, loadRoster, loadMe]);

  const sorted = useMemo(
    () =>
      [...roster].sort(
        (a, b) =>
          Number(!!b.won_at) - Number(!!a.won_at) ||
          b.matched_numbers.length - a.matched_numbers.length ||
          a.created_at.localeCompare(b.created_at)
      ),
    [roster]
  );

  if (state === 'loading') return <div className="py-20 text-center text-slate-400">Loading board…</div>;
  if (state === 'missing' || !pool) {
    return (
      <div className="py-20 text-center text-slate-300">
        This league doesn&apos;t exist or you&apos;re not in it. <Link href="/lotto/join" className="text-amber-300 underline">Join with a code</Link>
      </div>
    );
  }

  const isCommissioner = pool.commissioner_id === session.user.id;
  const isFree = me?.tier !== 'pro';
  const nearCap = roster.length >= pool.player_limit - 2;
  const needsSms = me && !me.phone_e164;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white">{pool.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {GAMES[pool.game].label} · first to {pool.win_condition} of 5 · {STATUS_LABEL[pool.status]}
          </p>
        </div>
        {isCommissioner && pool.status === 'open' && (
          <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Join code</p>
            <p className="font-mono text-2xl font-black tracking-[0.2em] text-amber-400">{pool.join_code}</p>
          </div>
        )}
      </header>

      {isCommissioner && pool.status === 'open' && (
        <div className="space-y-3">
          <ShareInvite code={pool.join_code} poolName={pool.name} />
          <CapacityBar used={roster.length} limit={pool.player_limit} />
        </div>
      )}
      {isCommissioner && isFree && pool.status !== 'won' && (
        <UpgradeCard returnPath={`/lotto/league/${pool.id}`} nearCap={nearCap} />
      )}

      {draws.length > 0 && (
        <section className="rounded-xl bg-white/5 p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Latest draw · {draws[0].draw_date}</p>
          <div className="flex gap-2">
            {draws[0].white_balls.map((n) => <LottoBall key={n} n={n} />)}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {pool.draws_counted === 0
              ? 'Cards start counting with the next official draw after the league was created.'
              : `${pool.draws_counted} draw${pool.draws_counted === 1 ? '' : 's'} counted so far.`}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Leaderboard · {roster.length} player{roster.length === 1 ? '' : 's'}</h2>
        {sorted.map((r) => (
          <div
            key={r.entry_id}
            className={`rounded-xl border p-4 ${
              r.won_at ? 'border-amber-400 bg-amber-400/10' : r.user_id === session.user.id ? 'border-white/25 bg-white/5' : 'border-white/10'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-white">
                {r.display_name}
                {r.user_id === session.user.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                {r.won_at && <span className="ml-2 text-xs font-black text-amber-300">WINNER</span>}
              </span>
              <span className="text-sm tabular-nums text-slate-400">
                {r.matched_numbers.length} / {pool.win_condition}
              </span>
            </div>
            <div className="flex gap-2">
              {r.assigned_numbers.map((n) => (
                <LottoBall key={n} n={n} hit={r.matched_numbers.includes(n)} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {needsSms && pool.status !== 'won' && <SmsOptIn onSaved={loadMe} />}
    </div>
  );
}

function CapacityBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Roster</span>
        <span className="tabular-nums">{used} / {limit}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

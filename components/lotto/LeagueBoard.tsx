'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import {
  CARD_SIZE, friendlyError, GAMES, hits,
  type LottoDraw, type LottoPlayer, type LottoPool, type RosterRow,
} from '@/lib/lotto/types';
import LottoBall, { BingoCard } from './LottoBall';
import ShareButton, { ShareInvite } from './ShareInvite';
import SmsOptIn from './SmsOptIn';
import UpgradeCard from './UpgradeCard';

const STATUS_LABEL = { open: 'Open for players', live: 'In play · new players go to the waitlist', won: 'BINGO!' } as const;

// Live board for every member. The Commissioner also sees the join code,
// roster cap, waitlist and the Pro upgrade. After BINGO the board becomes
// the launch pad for the next round of pools (share, run it back, start your own).
export default function LeagueBoard({ poolId, session }: { poolId: string; session: Session }) {
  const sb = lottoClient();
  const router = useRouter();
  const [pool, setPool] = useState<LottoPool | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [draws, setDraws] = useState<LottoDraw[]>([]);
  const [me, setMe] = useState<LottoPlayer | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [rematchBusy, setRematchBusy] = useState(false);
  const [rematchError, setRematchError] = useState('');

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
      const [{ data: d }, { data: w }] = await Promise.all([
        sb.from('lotto_draws').select('*').eq('game', p.game).order('draw_date', { ascending: false }).limit(3),
        sb.rpc('lotto_waitlist_count', { p_pool: poolId }),
        loadRoster(),
        loadMe(),
      ]);
      if (cancelled) return;
      setDraws((d ?? []) as LottoDraw[]);
      setWaiting(typeof w === 'number' ? w : 0);
      setState('ready');
    })();

    // Realtime: hits stream in as the draw trigger updates cards
    const channel = sb
      .channel(`lotto-pool-${poolId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lotto_entries', filter: `pool_id=eq.${poolId}` },
        ({ new: row }) =>
          setRoster((cur) =>
            cur.map((r) =>
              r.entry_id === row.id
                ? { ...r, matched_numbers: row.matched_numbers, special_matched: row.special_matched, won_at: row.won_at }
                : r
            )
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
          hits(b) - hits(a) ||
          a.created_at.localeCompare(b.created_at)
      ),
    [roster]
  );

  if (state === 'loading') return <div className="py-20 text-center text-[#A7A9D6]">Loading board…</div>;
  if (state === 'missing' || !pool) {
    return (
      <div className="py-20 text-center text-[#A7A9D6]">
        This pool doesn&apos;t exist or you&apos;re not in it.{' '}
        <Link href="/lotto/join" className="text-[#FFC93C] underline">Join with a code</Link>
      </div>
    );
  }

  const game = GAMES[pool.game];
  const isCommissioner = pool.commissioner_id === session.user.id;
  const isFree = me?.tier !== 'pro';
  const nearCap = roster.length >= pool.player_limit - 2;
  const needsSms = me && !me.phone_e164;
  const winners = sorted.filter((r) => r.won_at);
  const winnerNames = winners.map((w) => w.display_name).join(' & ');
  const iWon = winners.some((w) => w.user_id === session.user.id);

  const runItBack = async () => {
    setRematchBusy(true);
    setRematchError('');
    const { data, error } = await sb.rpc('lotto_rematch', { p_pool: pool.id });
    setRematchBusy(false);
    if (error) return setRematchError(friendlyError(error.message));
    router.push(`/lotto/league/${(data as LottoPool).id}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2A2A5A] pb-5">
        <div>
          <h1 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">{pool.name}</h1>
          <p className="mt-1 text-sm text-[#A7A9D6]">
            {pool.season > 1 && `Season ${pool.season} · `}
            {game.label} · all 5 + the {game.special} · {STATUS_LABEL[pool.status]}
          </p>
        </div>
        {isCommissioner && pool.status === 'open' && (
          <div className="rounded-xl border border-[#2A2A5A] bg-[#16163A] px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#A7A9D6]">Join code</p>
            <p className="font-mono text-2xl font-black tracking-[0.2em] text-[#FFC93C]">{pool.join_code}</p>
          </div>
        )}
      </header>

      {/* BINGO: the network-effect moment */}
      {pool.status === 'won' && (
        <section className="space-y-4 rounded-2xl border-2 border-[#FF4D6D] bg-[#FF4D6D]/10 p-6 text-center">
          <p className="font-[family-name:var(--font-ld-display)] text-5xl font-extrabold text-[#FF4D6D]">BINGO!</p>
          <p className="text-lg">
            {iWon ? 'You filled the whole card. You won the pool!' : `${winnerNames} filled the whole card.`}
          </p>
          <p className="text-sm text-[#A7A9D6]">
            Took {pool.draws_counted} official drawing{pool.draws_counted === 1 ? '' : 's'}.
          </p>
          <ShareButton
            label={iWon ? 'Brag about it' : 'Share the win'}
            title="BINGO on LottoDuel"
            text={`${iWon ? 'I' : winnerNames} just hit BINGO in "${pool.name}" on LottoDuel, the bingo pool powered by official lottery drawings. Start your own pool free:`}
            path="/lotto"
          />
          {isCommissioner ? (
            pool.next_pool_code ? (
              <Link href={`/lotto/join?code=${pool.next_pool_code}`} className="block rounded-lg border border-[#FFC93C] py-4 text-lg font-black text-[#FFC93C]">
                Go to Season {pool.season + 1} →
              </Link>
            ) : (
              <button onClick={runItBack} disabled={rematchBusy} className="w-full rounded-lg border border-[#FFC93C] py-4 text-lg font-black text-[#FFC93C] disabled:opacity-50">
                {rematchBusy ? 'Opening Season…' : `Run it back · Season ${pool.season + 1}`}
              </button>
            )
          ) : pool.next_pool_code ? (
            <Link href={`/lotto/join?code=${pool.next_pool_code}`} className="block rounded-lg border border-[#FFC93C] py-4 text-lg font-black text-[#FFC93C]">
              Season {pool.season + 1} is open: get your card →
            </Link>
          ) : (
            <Link href="/lotto/commissioner" className="block rounded-lg border border-[#FFC93C] py-4 text-lg font-black text-[#FFC93C]">
              Start your own pool
            </Link>
          )}
          {isCommissioner && !pool.next_pool_code && (
            <p className="text-xs text-[#A7A9D6]">
              Everyone in this pool{waiting > 0 && ` plus ${waiting} on the waitlist`} gets an invite to the next season.
            </p>
          )}
          {rematchError && <p className="text-sm text-[#FF4D6D]">{rematchError}</p>}
        </section>
      )}

      {isCommissioner && pool.status === 'open' && (
        <div className="space-y-3">
          <ShareInvite code={pool.join_code} poolName={pool.name} />
          <CapacityBar used={roster.length} limit={pool.player_limit} />
        </div>
      )}
      {isCommissioner && !isFree && waiting > 0 && pool.status === 'live' && (
        <p className="rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4 text-sm text-[#A7A9D6]">
          <span className="font-bold text-[#FFC93C]">{waiting} waiting</span> for Season {pool.season + 1}. They get an invite the moment you run it back after BINGO.
        </p>
      )}
      {isCommissioner && isFree && pool.status !== 'won' && (
        <UpgradeCard returnPath={`/lotto/league/${pool.id}`} nearCap={nearCap} waiting={waiting} />
      )}

      {draws.length > 0 && pool.status !== 'won' && (
        <section className="rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-[#A7A9D6]">Latest official draw · {draws[0].draw_date}</p>
          <div className="flex items-center gap-1.5">
            {draws[0].white_balls.map((n) => <LottoBall key={n} n={n} />)}
            {draws[0].special_ball != null && (
              <>
                <span className="mx-0.5 h-6 w-px bg-[#2A2A5A]" aria-hidden />
                <LottoBall n={draws[0].special_ball} special />
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-[#A7A9D6]">
            {pool.draws_counted === 0
              ? 'Cards start counting at the next official drawing after the pool was created.'
              : `${pool.draws_counted} drawing${pool.draws_counted === 1 ? '' : 's'} counted so far.`}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Leaderboard · {roster.length} player{roster.length === 1 ? '' : 's'}</h2>
        {sorted.map((r) => (
          <div
            key={r.entry_id}
            className={`rounded-xl border p-4 ${
              r.won_at
                ? 'border-[#FF4D6D] bg-[#FF4D6D]/10'
                : r.user_id === session.user.id
                  ? 'border-[#FFC93C]/40 bg-[#16163A]'
                  : 'border-[#2A2A5A] bg-[#16163A]'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">
                {r.display_name}
                {r.user_id === session.user.id && <span className="ml-2 text-xs text-[#A7A9D6]">(you)</span>}
                {r.won_at && <span className="ml-2 text-xs font-black text-[#FF4D6D]">BINGO</span>}
              </span>
              <span className="text-sm tabular-nums text-[#A7A9D6]">
                {hits(r)} / {CARD_SIZE}
              </span>
            </div>
            <div className="overflow-x-auto">
              <BingoCard
                numbers={r.assigned_numbers}
                special={r.assigned_special}
                matched={r.matched_numbers}
                specialMatched={r.special_matched}
              />
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
      <div className="flex justify-between text-xs text-[#A7A9D6]">
        <span>Roster</span>
        <span className="tabular-nums">{used} / {limit}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2A2A5A]">
        <div className={`h-full ${pct >= 80 ? 'bg-[#FFC93C]' : 'bg-[#22D3B6]'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

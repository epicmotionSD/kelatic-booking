'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import { friendlyError, toE164, type JoinResult } from '@/lib/lotto/types';
import { ConsentCheckbox } from './SmsOptIn';
import { BingoCard } from './LottoBall';

const INPUT = 'w-full rounded-lg border border-[#2A2A5A] bg-[#0B0B1E] p-3 text-[#FFF8E7] placeholder:text-[#A7A9D6]/50';

export default function JoinLeague({ session }: { session: Session }) {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<JoinResult | null>(null);

  // Deep link: /lotto/join?code=7A3B9V
  useEffect(() => {
    const c = params.get('code');
    if (c) setCode(c.toUpperCase().slice(0, 6));
    setResult(null);
  }, [params]);

  useEffect(() => {
    lottoClient()
      .from('lotto_players')
      .select('display_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => data?.display_name && setDisplayName(data.display_name));
  }, [session.user.id]);

  const join = async (e?: React.FormEvent, overrideCode?: string) => {
    e?.preventDefault();
    setError('');
    const e164 = phone.trim() ? toE164(phone) : null;
    if (phone.trim() && !e164) return setError("That phone number doesn't look right.");
    if (e164 && !consent) return setError('Check the box to allow texts, or clear the phone number.');

    setBusy(true);
    const sb = lottoClient();
    const { data, error } = await sb.rpc('lotto_join_pool', {
      p_code: overrideCode ?? code,
      p_display_name: displayName || null,
    });
    if (error) {
      setBusy(false);
      return setError(friendlyError(error.message));
    }
    const res = data as JoinResult;
    // Save phone whenever we'll want to reach them: a card, or a waitlist spot
    if (e164 && res.status !== 'not_found' && res.status !== 'next_season') {
      await sb.rpc('lotto_set_phone', { p_phone: e164, p_sms_opt_in: true });
    }
    setBusy(false);
    setResult(res);
  };

  if (result?.status === 'joined' || result?.status === 'existing') {
    return (
      <div className="space-y-6 text-center">
        <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">
          {result.status === 'joined' ? "You're in!" : 'Welcome back'}
        </h2>
        <p className="text-[#A7A9D6]">
          Your card for <span className="font-semibold text-[#FFF8E7]">{result.pool_name}</span>
          {result.season > 1 && ` · Season ${result.season}`}:
        </p>
        <div className="flex justify-center">
          <BingoCard numbers={result.entry.assigned_numbers} special={result.entry.assigned_special} size="lg" />
        </div>
        <p className="text-sm text-[#A7A9D6]">
          Matches light up after every official drawing. Get all 6 to hit{' '}
          <span className="font-black text-[#FF4D6D]">BINGO!</span>
        </p>
        <button
          onClick={() => router.push(`/lotto/league/${result.entry.pool_id}`)}
          className="w-full rounded-lg bg-[#FFC93C] py-4 text-lg font-black text-[#0B0B1E]"
        >
          See the live board →
        </button>
      </div>
    );
  }

  if (result?.status === 'waitlisted' || result?.status === 'full') {
    return (
      <div className="space-y-5 text-center">
        <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">You&apos;re on the waitlist</h2>
        <p className="text-[#A7A9D6]">
          {result.status === 'full'
            ? `${result.pool_name} is full at ${result.limit} players. We've let the Commissioner know.`
            : `${result.pool_name} is already in play.`}{' '}
          You&apos;ll get first call for <span className="font-semibold text-[#FFF8E7]">Season {result.season}</span>.
          {phone.trim() ? " We'll text you when it opens." : ' Check your LottoDuel home page when it opens.'}
        </p>
        <Link href="/lotto/commissioner" className="block rounded-lg bg-[#FFC93C] py-4 text-lg font-black text-[#0B0B1E]">
          Can&apos;t wait? Start your own pool
        </Link>
        <Link href="/lotto" className="block text-sm text-[#A7A9D6] underline">Back to home</Link>
      </div>
    );
  }

  if (result?.status === 'next_season') {
    return (
      <div className="space-y-5 text-center">
        <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">
          Season {result.season} is open
        </h2>
        <p className="text-[#A7A9D6]">
          {result.pool_name} already hit BINGO, and the next season just started.
        </p>
        <button
          disabled={busy}
          onClick={() => {
            setCode(result.join_code);
            join(undefined, result.join_code);
          }}
          className="w-full rounded-lg bg-[#FFC93C] py-4 text-lg font-black text-[#0B0B1E] disabled:opacity-50"
        >
          {busy ? 'Claiming your card…' : `Get my Season ${result.season} card`}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="space-y-5">
      <h2 className="font-[family-name:var(--font-ld-display)] text-3xl font-extrabold">Join a bingo pool</h2>

      {result?.status === 'not_found' && (
        <div className="rounded-lg bg-[#FF4D6D]/15 p-4 text-[#FFB3C1]">
          No pool uses that code. Double-check it with your Commissioner.
        </div>
      )}
      {error && <div className="rounded-lg bg-[#FF4D6D]/15 p-4 text-[#FFB3C1]">{error}</div>}

      <input
        required
        maxLength={6}
        placeholder="7A3B9V"
        className="w-full rounded-lg border border-[#2A2A5A] bg-[#0B0B1E] p-4 text-center font-mono text-3xl font-black uppercase tracking-[0.3em] text-[#FFC93C] placeholder:text-[#2A2A5A]"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <input maxLength={40} placeholder="Your name on the board" className={INPUT} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <div className="space-y-3 rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4">
        <input type="tel" autoComplete="tel" placeholder="Mobile number (optional)" className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
        {phone.trim() && <ConsentCheckbox checked={consent} onChange={setConsent} />}
      </div>

      <button disabled={busy || code.length < 6} className="w-full rounded-lg bg-[#FFC93C] py-4 text-lg font-black text-[#0B0B1E] disabled:opacity-50">
        {busy ? 'Claiming your card…' : 'Get my card'}
      </button>
    </form>
  );
}

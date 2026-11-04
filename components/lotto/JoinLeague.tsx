'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { lottoClient } from '@/lib/lotto/supabase';
import { friendlyError, toE164, type JoinResult } from '@/lib/lotto/types';
import { ConsentCheckbox } from './SmsOptIn';
import LottoBall from './LottoBall';

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
  }, [params]);

  useEffect(() => {
    lottoClient()
      .from('lotto_players')
      .select('display_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => data?.display_name && setDisplayName(data.display_name));
  }, [session.user.id]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const e164 = phone.trim() ? toE164(phone) : null;
    if (phone.trim() && !e164) return setError('That phone number doesn\'t look right.');
    if (e164 && !consent) return setError('Check the box to allow texts, or clear the phone number.');

    setBusy(true);
    const sb = lottoClient();
    const { data, error } = await sb.rpc('lotto_join_pool', { p_code: code, p_display_name: displayName || null });
    if (error) {
      setBusy(false);
      return setError(friendlyError(error.message));
    }
    const res = data as JoinResult;
    if ((res.status === 'joined' || res.status === 'existing') && e164) {
      await sb.rpc('lotto_set_phone', { p_phone: e164, p_sms_opt_in: true });
    }
    setBusy(false);
    setResult(res);
  };

  if (result?.status === 'joined' || result?.status === 'existing') {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-3xl font-black text-white">
          {result.status === 'joined' ? "You're in!" : 'Welcome back'}
        </h2>
        <p className="text-slate-300">Your card for <span className="font-semibold text-white">{result.pool_name}</span>:</p>
        <div className="flex justify-center gap-2">
          {result.entry.assigned_numbers.map((n) => <LottoBall key={n} n={n} size="lg" />)}
        </div>
        <p className="text-sm text-slate-400">Numbers light up automatically after each official draw.</p>
        <button
          onClick={() => router.push(`/lotto/league/${result.entry.pool_id}`)}
          className="w-full rounded-lg bg-amber-400 py-4 text-lg font-black text-slate-950"
        >
          See the live board →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="space-y-5">
      <h2 className="text-3xl font-black text-white">Join a league</h2>

      {result && (
        <div className="rounded-lg bg-rose-500/15 p-4 text-rose-100">
          {result.status === 'not_found' && 'No league uses that code. Double-check it with your Commissioner.'}
          {result.status === 'closed' && `${result.pool_name} has already started, so new players can't join.`}
          {result.status === 'full' &&
            `${result.pool_name} has reached its ${result.limit}-player limit. We've let your Commissioner know.`}
        </div>
      )}
      {error && <div className="rounded-lg bg-rose-500/15 p-4 text-rose-100">{error}</div>}

      <input
        required
        maxLength={6}
        placeholder="7A3B9V"
        className="w-full rounded-lg border border-white/15 bg-slate-900 p-4 text-center font-mono text-3xl font-black uppercase tracking-[0.3em] text-white placeholder:text-slate-700"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <input
        maxLength={40}
        placeholder="Your name on the board"
        className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <input
          type="tel"
          autoComplete="tel"
          placeholder="Mobile number (optional)"
          className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {phone.trim() && <ConsentCheckbox checked={consent} onChange={setConsent} />}
      </div>

      <button
        disabled={busy || code.length < 6}
        className="w-full rounded-lg bg-amber-400 py-4 text-lg font-black text-slate-950 disabled:opacity-50"
      >
        {busy ? 'Claiming your card…' : 'Get my numbers'}
      </button>
    </form>
  );
}

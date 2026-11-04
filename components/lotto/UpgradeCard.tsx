'use client';

import { useState } from 'react';
import { lottoClient } from '@/lib/lotto/supabase';
import { FREE_PLAYER_LIMIT, PRO_PLAYER_LIMIT } from '@/lib/lotto/types';

// Commissioner-only. Players never see a paywall.
export default function UpgradeCard({ returnPath, nearCap }: { returnPath: string; nearCap: boolean }) {
  const [busy, setBusy] = useState<'monthly' | 'yearly' | null>(null);
  const [error, setError] = useState('');

  const upgrade = async (plan: 'monthly' | 'yearly') => {
    setBusy(plan);
    setError('');
    const { data, error } = await lottoClient().functions.invoke('lotto-create-checkout', {
      body: { plan, return_path: returnPath },
    });
    if (error || !data?.url) {
      setBusy(null);
      setError('Upgrades aren\'t available yet. Try again soon.');
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className={`rounded-xl border p-5 ${nearCap ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5'}`}>
      <p className="text-lg font-black text-white">
        {nearCap ? 'Your league is almost full' : 'Go Pro'}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-slate-300">
        <li>• {PRO_PLAYER_LIMIT} players per league (free: {FREE_PLAYER_LIMIT})</li>
        <li>• Text alerts for your whole roster when numbers hit</li>
        <li>• Mega Millions leagues</li>
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => upgrade('monthly')}
          disabled={!!busy}
          className="rounded-lg bg-amber-400 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {busy === 'monthly' ? '…' : '$4.99 / mo'}
        </button>
        <button
          onClick={() => upgrade('yearly')}
          disabled={!!busy}
          className="rounded-lg border border-amber-400 py-3 font-black text-amber-300 disabled:opacity-50"
        >
          {busy === 'yearly' ? '…' : '$29 / yr'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { lottoClient } from '@/lib/lotto/supabase';
import { FREE_PLAYER_LIMIT, PRO_PLAYER_LIMIT } from '@/lib/lotto/types';

// Commissioner-only. Players never see a paywall.
export default function UpgradeCard({ returnPath, nearCap, waiting }: { returnPath: string; nearCap: boolean; waiting: number }) {
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
      setError("Upgrades aren't available yet. Try again soon.");
      return;
    }
    window.location.href = data.url;
  };

  const urgent = nearCap || waiting > 0;
  return (
    <div className={`rounded-xl border p-5 ${urgent ? 'border-[#FFC93C] bg-[#FFC93C]/10' : 'border-[#2A2A5A] bg-[#16163A]'}`}>
      <p className="font-[family-name:var(--font-ld-display)] text-lg font-extrabold">
        {waiting > 0
          ? `${waiting} ${waiting === 1 ? 'person is' : 'people are'} waiting to get in`
          : nearCap
            ? 'Your pool is almost full'
            : 'Go Pro'}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-[#A7A9D6]">
        <li>• {PRO_PLAYER_LIMIT} players per pool (free: {FREE_PLAYER_LIMIT})</li>
        <li>• Text alerts for your whole roster: hits, BINGO, new seasons</li>
        <li>• Mega Millions pools</li>
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => upgrade('monthly')} disabled={!!busy} className="rounded-lg bg-[#FFC93C] py-3 font-black text-[#0B0B1E] disabled:opacity-50">
          {busy === 'monthly' ? '…' : '$4.99 / mo'}
        </button>
        <button onClick={() => upgrade('yearly')} disabled={!!busy} className="rounded-lg border border-[#FFC93C] py-3 font-black text-[#FFC93C] disabled:opacity-50">
          {busy === 'yearly' ? '…' : '$29 / yr'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-[#FF4D6D]">{error}</p>}
    </div>
  );
}

'use client';

import { useState } from 'react';

// Native share sheet (iMessage/WhatsApp) with clipboard fallback — no alert() popups.
export default function ShareInvite({ code, poolName }: { code: string; poolName: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/lotto/join?code=${code}`;
    const text = `Join my Lotto Duel league "${poolName}"! Tap to get your card, or enter code ${code}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my Lotto Duel league', text, url });
        return;
      } catch {
        /* user cancelled: fall through to copy */
      }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button onClick={share} className="w-full rounded-lg bg-amber-400 py-4 text-lg font-black text-slate-950">
      {copied ? 'Invite copied ✓' : 'Share invite link'}
    </button>
  );
}

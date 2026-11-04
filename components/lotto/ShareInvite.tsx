'use client';

import { useState } from 'react';

interface Props {
  label: string;
  title: string;
  text: string;
  path: string; // e.g. /lotto/join?code=ABC123
  variant?: 'primary' | 'secondary';
}

// Native share sheet (iMessage/WhatsApp) with clipboard fallback, no alert() popups.
export default function ShareButton({ label, title, text, path, variant = 'primary' }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
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
    <button
      onClick={share}
      className={`w-full rounded-lg py-4 text-lg font-black ${
        variant === 'primary'
          ? 'bg-[#FFC93C] text-[#0B0B1E]'
          : 'border border-[#FFC93C] text-[#FFC93C]'
      }`}
    >
      {copied ? 'Link copied ✓' : label}
    </button>
  );
}

export function ShareInvite({ code, poolName }: { code: string; poolName: string }) {
  return (
    <ShareButton
      label="Share invite link"
      title="Join my LottoDuel bingo pool"
      text={`Join my LottoDuel bingo pool "${poolName}"! Tap to get your card, or enter code ${code}.`}
      path={`/lotto/join?code=${code}`}
    />
  );
}

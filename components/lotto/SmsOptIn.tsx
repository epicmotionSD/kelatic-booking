'use client';

import { useState } from 'react';
import { lottoClient } from '@/lib/lotto/supabase';
import { toE164 } from '@/lib/lotto/types';

export const SMS_CONSENT_TEXT =
  'Text me LottoDuel alerts about my card, BINGO and new seasons. Message frequency varies (a few per week per pool). ' +
  'Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to play.';

// Standalone opt-in card (used on the board for players who skipped it at join)
export default function SmsOptIn({ onSaved }: { onSaved?: () => void }) {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164(phone);
    if (!e164) return setMsg('Enter a valid mobile number.');
    if (!consent) return setMsg('Check the box to allow texts.');
    setBusy(true);
    const { error } = await lottoClient().rpc('lotto_set_phone', { p_phone: e164, p_sms_opt_in: true });
    setBusy(false);
    if (error) setMsg('Could not save. Try again.');
    else {
      setMsg("Saved. We'll text you when your numbers hit.");
      onSaved?.();
    }
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-[#2A2A5A] bg-[#16163A] p-4">
      <p className="font-semibold">Get a text when you hit</p>
      <input
        type="tel"
        autoComplete="tel"
        placeholder="(713) 555-0100"
        className="w-full rounded-lg border border-[#2A2A5A] bg-[#0B0B1E] p-3 text-[#FFF8E7] placeholder:text-[#A7A9D6]/50"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <ConsentCheckbox checked={consent} onChange={setConsent} />
      {msg && <p className="text-sm text-[#A7A9D6]">{msg}</p>}
      <button disabled={busy} className="w-full rounded-lg border border-[#FFC93C] py-2 font-bold text-[#FFC93C] disabled:opacity-50">
        {busy ? 'Saving…' : 'Turn on text alerts'}
      </button>
    </form>
  );
}

export function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-xs leading-relaxed text-[#A7A9D6]">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#FFC93C]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{SMS_CONSENT_TEXT}</span>
    </label>
  );
}

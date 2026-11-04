'use client';

import { useState } from 'react';
import { lottoClient } from '@/lib/lotto/supabase';
import { toE164 } from '@/lib/lotto/types';

export const SMS_CONSENT_TEXT =
  'Text me Lotto Duel alerts when my numbers hit. Message frequency varies (a few per week per league). ' +
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
      setMsg('Saved. You\'ll get a text when your numbers hit.');
      onSaved?.();
    }
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="font-semibold text-white">Get a text when you hit</p>
      <input
        type="tel"
        autoComplete="tel"
        placeholder="(713) 555-0100"
        className="w-full rounded-lg border border-white/15 bg-slate-900 p-3 text-white placeholder:text-slate-500"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <ConsentCheckbox checked={consent} onChange={setConsent} />
      {msg && <p className="text-sm text-slate-300">{msg}</p>}
      <button disabled={busy} className="w-full rounded-lg border border-amber-400 py-2 font-bold text-amber-300 disabled:opacity-50">
        {busy ? 'Saving…' : 'Turn on text alerts'}
      </button>
    </form>
  );
}

export function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-400">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{SMS_CONSENT_TEXT}</span>
    </label>
  );
}

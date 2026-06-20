'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Gem, Sparkles } from 'lucide-react';
import type { CustomerView } from '@/lib/agents/modules/loyalty';

export type LoyaltyWidgetVariant = 'light' | 'dark';

interface Props {
  /** Identity proof: the order_id the customer just paid (commerce). */
  orderId?: string;
  /** Identity proof: the appointment_id the customer just booked (salon). */
  appointmentId?: string;
  /** Theme variant -- match the surrounding surface. */
  variant?: LoyaltyWidgetVariant;
  /** Optional className for the outer container. */
  className?: string;
}

/**
 * Drop-in loyalty card for customer-facing success / confirmation pages.
 * Self-fetching, self-hiding: renders nothing when there's no program,
 * no client match, or the API call fails.
 *
 * Earn rows for the just-completed payment are written by the Stripe
 * webhook, which can lag this page render by a few seconds. We poll a
 * couple of times so "You earned X" appears as soon as it's available.
 */
export function LoyaltyWidget({
  orderId,
  appointmentId,
  variant = 'light',
  className,
}: Props) {
  const [view, setView] = useState<CustomerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchView() {
      const url = new URL('/api/loyalty/me', window.location.origin);
      if (orderId) url.searchParams.set('orderId', orderId);
      if (appointmentId) url.searchParams.set('appointmentId', appointmentId);
      try {
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return (data.customerView as CustomerView | null) ?? null;
      } catch {
        return null;
      }
    }

    async function loadAndPoll() {
      const first = await fetchView();
      if (cancelled) return;
      setView(first);
      setLoading(false);

      // If the webhook hasn't written the earn row yet, poll up to 3 times
      // at 2s intervals so the "You earned X" line appears without a refresh.
      if (first && first.earnedThisVisit === null && pollsRef.current < 3) {
        const interval = setInterval(async () => {
          pollsRef.current += 1;
          const next = await fetchView();
          if (cancelled) return;
          if (next?.earnedThisVisit !== null) {
            setView(next);
            clearInterval(interval);
          } else if (pollsRef.current >= 3) {
            clearInterval(interval);
          }
        }, 2000);
        return () => clearInterval(interval);
      }
    }

    setLoading(true);
    loadAndPoll();
    return () => {
      cancelled = true;
    };
  }, [orderId, appointmentId]);

  if (loading || !view) return null;

  const theme = variant === 'dark' ? DARK_THEME : LIGHT_THEME;

  function copyCode() {
    if (!view?.referralCode) return;
    navigator.clipboard?.writeText(view.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`${theme.container} ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Gem className={`w-5 h-5 ${theme.accent}`} />
        <h3 className={`font-semibold ${theme.heading}`}>{view.programName}</h3>
      </div>

      {view.earnedThisVisit != null && view.earnedThisVisit > 0 && (
        <div className={`${theme.earnedBanner} mb-3 flex items-center gap-2`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            You earned{' '}
            <strong>
              {view.earnedThisVisit} {view.currencyLabel}
            </strong>{' '}
            on this {orderId ? 'order' : 'appointment'}.
          </span>
        </div>
      )}

      <div className={`grid grid-cols-2 gap-3 ${theme.statBox}`}>
        <div>
          <div className={`text-[10px] uppercase tracking-wider ${theme.statLabel}`}>
            Balance
          </div>
          <div className={`text-2xl font-bold ${theme.statValue}`}>
            {view.balance}{' '}
            <span className={`text-sm font-normal ${theme.statLabel}`}>
              {view.currencyLabel}
            </span>
          </div>
        </div>
        <div>
          <div className={`text-[10px] uppercase tracking-wider ${theme.statLabel}`}>
            Tier
          </div>
          <div className={`text-2xl font-bold ${theme.statValue}`}>
            {view.currentTier ?? '—'}
          </div>
        </div>
      </div>

      {view.tierPerks.length > 0 && (
        <ul className={`mt-3 space-y-1 text-sm ${theme.perkText}`}>
          {view.tierPerks.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className={`w-3.5 h-3.5 ${theme.accent}`} />
              {p}
            </li>
          ))}
        </ul>
      )}

      {view.referralsEnabled && view.referralCode && (
        <div className={`mt-4 pt-3 border-t ${theme.divider}`}>
          <div className={`text-xs ${theme.body} mb-2`}>
            Share your code &mdash; friends get{' '}
            <strong>
              {view.refereeBonusPoints} {view.currencyLabel}
            </strong>{' '}
            on signup, you get{' '}
            <strong>
              {view.referrerBonusPoints} {view.currencyLabel}
            </strong>{' '}
            when they pay.
          </div>
          <button
            type="button"
            onClick={copyCode}
            className={theme.codeButton}
          >
            <span className="data-mono text-base tracking-wider">
              {view.referralCode}
            </span>
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// THEMES
// ============================================================

interface Theme {
  container: string;
  heading: string;
  body: string;
  accent: string;
  statBox: string;
  statLabel: string;
  statValue: string;
  perkText: string;
  divider: string;
  earnedBanner: string;
  codeButton: string;
}

// Matches the Vitality House cream + green checkout surface
const LIGHT_THEME: Theme = {
  container: 'bg-white rounded-2xl shadow-sm p-5 text-left border border-[#1f3d2b]/10',
  heading: 'text-[#1f3d2b]',
  body: 'text-[#1f3d2b]/70',
  accent: 'text-[#3f7d4f]',
  statBox: '',
  statLabel: 'text-[#1f3d2b]/50',
  statValue: 'text-[#1f3d2b]',
  perkText: 'text-[#1f3d2b]/70',
  divider: 'border-[#1f3d2b]/10',
  earnedBanner:
    'rounded-lg px-3 py-2 text-sm bg-[#eef4ec] text-[#3f7d4f] border border-[#3f7d4f]/20',
  codeButton:
    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#eef4ec] text-[#1f3d2b] border border-[#3f7d4f]/30 hover:bg-[#e3ecde] transition-colors',
};

// Matches the salon booking confirmation dark + amber surface
const DARK_THEME: Theme = {
  container: 'bg-zinc-900 backdrop-blur rounded-xl border border-white/20 p-5 text-left',
  heading: 'text-white',
  body: 'text-white/70',
  accent: 'text-amber-400',
  statBox: '',
  statLabel: 'text-white/50',
  statValue: 'text-white',
  perkText: 'text-white/70',
  divider: 'border-white/10',
  earnedBanner:
    'rounded-lg px-3 py-2 text-sm bg-amber-500/15 text-amber-300 border border-amber-500/30',
  codeButton:
    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors',
};

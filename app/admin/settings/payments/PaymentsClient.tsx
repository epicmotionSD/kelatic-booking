'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { ConnectAccountSummary } from '@/lib/stripe/connect';

interface Props {
  businessName: string;
  businessSlug: string;
  initialAccountId: string | null;
  initialStatus: string | null;
  platformFeePercent: number;
  /** True when the user just returned from Stripe-hosted onboarding. */
  justReturned: boolean;
}

export default function PaymentsClient({
  businessName,
  initialAccountId,
  initialStatus,
  platformFeePercent,
  justReturned,
}: Props) {
  const [accountId, setAccountId] = useState<string | null>(initialAccountId);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [summary, setSummary] = useState<ConnectAccountSummary | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stripe/status');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load status');
        return;
      }
      if (data.connected) {
        setSummary(data.summary);
        setStatus(data.summary.status);
        setAccountId(data.summary.accountId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // On mount: if the user just came back from the Stripe onboarding flow,
  // refresh the status from Stripe so the badge updates immediately.
  // Also fetch summary the first time the page loads with an existing account
  // so the requirements list is populated.
  useEffect(() => {
    if (accountId) {
      refreshStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startOnboarding() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to start Stripe onboarding');
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setConnecting(false);
    }
  }

  const isActive = status === 'active' && summary?.ready;
  const isPending = accountId && !isActive;

  return (
    <div className="x3o-term space-y-5 max-w-3xl">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-[#00ffb2]" />
          <h1 className="text-xl font-bold">Payments</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect <strong>{businessName}</strong> to Stripe so customer payments
          land directly in your account. Platform fee:{' '}
          <strong>{platformFeePercent}%</strong>.
        </p>
      </header>

      {justReturned && !error && (
        <div className="rounded border border-[#00ffb2]/30 bg-[#00ffb2]/10 px-3 py-2 text-sm">
          Welcome back. Refreshing your account status…
        </div>
      )}

      {/* Not connected */}
      {!accountId && (
        <div className="rounded border border-border p-5 bg-card">
          <h2 className="font-semibold mb-1">Not connected yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We&apos;ll redirect you to Stripe to verify your identity and bank
            account. Takes about 5 minutes. Until you finish, payments will
            continue to flow through the x3o platform account.
          </p>
          <button
            type="button"
            onClick={startOnboarding}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#00ffb2] text-black font-semibold rounded hover:bg-[#00e0a0] disabled:opacity-50"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Connect with Stripe
          </button>
        </div>
      )}

      {/* Connected and active */}
      {isActive && (
        <div className="rounded border border-[#00ffb2]/30 bg-[#00ffb2]/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00ffb2] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold mb-1">Stripe is connected</h2>
              <p className="text-sm text-muted-foreground mb-3">
                New customer payments route directly to your Stripe account.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <Stat
                  label="Charges"
                  value={summary?.chargesEnabled ? 'Enabled' : 'Disabled'}
                  good={summary?.chargesEnabled ?? false}
                />
                <Stat
                  label="Payouts"
                  value={summary?.payoutsEnabled ? 'Enabled' : 'Disabled'}
                  good={summary?.payoutsEnabled ?? false}
                />
              </div>
              {accountId && (
                <p className="text-xs text-muted-foreground data-mono">
                  {accountId}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={loadingStatus}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:border-[#00ffb2] hover:text-[#00ffb2]"
              aria-label="Refresh status"
            >
              {loadingStatus ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pending / restricted */}
      {isPending && (
        <div className="rounded border border-yellow-400/30 bg-yellow-400/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold mb-1">Stripe setup is incomplete</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Your Stripe account exists but isn&apos;t cleared to accept
                payments yet. Finish onboarding to start collecting on this
                tenant.
              </p>
              {summary?.requirementsDue && summary.requirementsDue.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Stripe needs
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {summary.requirementsDue.slice(0, 6).map((req) => (
                      <li key={req} className="data-mono text-xs">
                        · {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startOnboarding}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#00ffb2] text-black font-semibold rounded hover:bg-[#00e0a0] disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Continue setup
                </button>
                <button
                  type="button"
                  onClick={refreshStatus}
                  disabled={loadingStatus}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded hover:border-[#00ffb2]"
                >
                  {loadingStatus ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Check status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          How does this work?
        </summary>
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
          <p>
            x3o is a Stripe Connect platform. When you connect, you create an
            Express account that lives under x3o&apos;s platform but stays under
            your control — you have your own dashboard, your own bank account,
            and you&apos;re the merchant of record on every charge.
          </p>
          <p>
            Each charge keeps {(100 - platformFeePercent).toFixed(2)}% of the
            transaction. The {platformFeePercent}% platform fee covers the
            booking engine, AI agents, loyalty, hosting, and support.
          </p>
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className={`text-sm font-semibold ${good ? 'text-[#00ffb2]' : 'text-muted-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

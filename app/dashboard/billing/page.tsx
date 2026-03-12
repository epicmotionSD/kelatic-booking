'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Crown,
  MessageSquare,
  User,
} from 'lucide-react';

interface SubscriptionDetails {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  plan_status: string;
  subscription_current_period_start: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_canceled_at: string | null;
  trial_ends_at: string | null;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  willCancelAtPeriodEnd: boolean;
  stripeSubscription?: any;
}

interface UsageData {
  campaigns: { used: number; limit: number; percentage: number };
  contacts: { used: number; limit: number; percentage: number };
  sms: { used: number; limit: number; percentage: number };
  period_end: string | null;
}

const PLANS = {
  trinity_monthly: {
    name: 'Trinity AI - Monthly',
    price: '$297',
    interval: '/month',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    features: [
      'Ghost client reactivation campaigns',
      'Conversation recovery (abandoned DMs)',
      'Instant slot filling (waitlist)',
      '24/7 AI chatbot (Kela)',
      'Trinity content generation',
      'Monthly revenue recovery report',
      'Email & SMS support',
    ],
  },
  trinity_annual: {
    name: 'Trinity AI - Annual',
    price: '$2,970',
    interval: '/year',
    badge: 'Save $594',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    features: [
      'All Monthly features',
      'Save $594/year (2 months free)',
      'Priority support',
      'Quarterly strategy calls',
    ],
  },
  free: {
    name: 'Free Plan',
    price: '$0',
    interval: '/month',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      'Limited AI generations (10/month)',
      'Basic features only',
      'Community support',
    ],
  },
};

const STATUS_BADGES = {
  active: { label: 'Active', icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  trialing: { label: 'Trial', icon: Sparkles, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  past_due: { label: 'Past Due', icon: AlertCircle, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  canceled: { label: 'Canceled', icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  incomplete: { label: 'Incomplete', icon: AlertCircle, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
    fetchUsage();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/billing/status');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch('/api/billing/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }

  async function handleSubscribe(plan: 'trinity_monthly' | 'trinity_annual') {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, trialDays: 14 }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Failed to start subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url; // Redirect to Stripe Customer Portal
      } else {
        alert('Failed to open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel? Your subscription will remain active until the end of the billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false }),
      });

      if (res.ok) {
        await fetchSubscription();
        alert('Subscription will be canceled at the end of the billing period.');
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/reactivate', {
        method: 'POST',
      });

      if (res.ok) {
        await fetchSubscription();
        alert('Subscription reactivated successfully!');
      } else {
        alert('Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Reactivate error:', error);
      alert('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevenueSprint() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/revenue-sprint', {
        method: 'POST',
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        alert('Failed to start Revenue Sprint checkout');
      }
    } catch (error) {
      console.error('Revenue Sprint error:', error);
      alert('Failed to start Revenue Sprint checkout');
    } finally {
      setActionLoading(false);
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentPlan = subscription?.plan ? PLANS[subscription.plan as keyof typeof PLANS] : PLANS.free;
  const statusBadge = subscription?.plan_status ? STATUS_BADGES[subscription.plan_status as keyof typeof STATUS_BADGES] : STATUS_BADGES.canceled;
  const CurrentPlanIcon = currentPlan.icon;
  const StatusIcon = statusBadge.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-white/60">Manage your x3o.ai subscription and billing</p>
      </div>

      {/* Success/Cancel Messages */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === 'true' && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <h3 className="text-green-400 font-semibold">Subscription activated!</h3>
            <p className="text-green-400/80 text-sm">Your subscription is now active. Welcome to Trinity AI!</p>
          </div>
        </div>
      )}

      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('canceled') === 'true' && (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-semibold">Checkout canceled</h3>
            <p className="text-amber-400/80 text-sm">No charges were made. You can try again anytime.</p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      {subscription?.stripe_subscription_id && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CurrentPlanIcon className="w-8 h-8 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-white">{currentPlan.name}</h2>
                <p className="text-white/60 text-sm">Your current plan</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {statusBadge && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1.5 ${statusBadge.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusBadge.label}</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Price</p>
              <p className="text-white text-lg font-semibold">
                {currentPlan.price}<span className="text-white/60 text-sm font-normal">{currentPlan.interval}</span>
              </p>
            </div>

            {subscription.subscription_current_period_end && (
              <div>
                <p className="text-white/40 text-sm mb-1">
                  {subscription.willCancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                </p>
                <p className="text-white text-lg font-semibold">
                  {formatDate(subscription.subscription_current_period_end)}
                </p>
              </div>
            )}

            {subscription.isTrialing && subscription.trial_ends_at && (
              <div>
                <p className="text-white/40 text-sm mb-1">Trial ends</p>
                <p className="text-white text-lg font-semibold">
                  {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>Manage Billing</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            {subscription.willCancelAtPeriodEnd ? (
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors disabled:opacity-50"
              >
                Reactivate Subscription
              </button>
            ) : subscription.isActive && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Usage Summary */}
      {subscription?.stripe_subscription_id && subscription?.isActive && usage && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Usage Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Campaigns</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{usage.campaigns.used}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">of {usage.campaigns.limit} per month</span>
                <span className="text-emerald-400">{usage.campaigns.percentage}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${usage.campaigns.percentage}%` }} />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Contacts</span>
                <User className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{usage.contacts.used}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">of {usage.contacts.limit} total</span>
                <span className="text-emerald-400">{usage.contacts.percentage}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${usage.contacts.percentage}%` }} />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">SMS Messages</span>
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{usage.sms.used}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">of {usage.sms.limit} per month</span>
                <span className="text-emerald-400">{usage.sms.percentage}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${usage.sms.percentage}%` }} />
              </div>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-4">
            Usage resets on {usage.period_end ? formatDate(usage.period_end) : 'your next billing date'}
          </p>
        </div>
      )}

      {/* No Active Subscription - Show Plans */}
      {!subscription?.stripe_subscription_id && !subscription?.isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 hover:border-amber-500/50 transition-colors">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${PLANS.trinity_monthly.color} flex items-center justify-center mb-4`}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{PLANS.trinity_monthly.name}</h3>
            <p className="text-3xl font-bold text-white mb-1">
              {PLANS.trinity_monthly.price}
              <span className="text-white/60 text-base font-normal">{PLANS.trinity_monthly.interval}</span>
            </p>
            <p className="text-white/60 text-sm mb-6">14-day free trial included</p>

            <ul className="space-y-3 mb-6">
              {PLANS.trinity_monthly.features.map((feature, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('trinity_monthly')}
              disabled={actionLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Start 14-Day Trial</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Annual Plan */}
          <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-lg p-6 relative hover:border-purple-500/50 transition-colors">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-purple-500 rounded-full text-white text-xs font-bold">
              SAVE $594
            </div>
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${PLANS.trinity_annual.color} flex items-center justify-center mb-4`}>
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{PLANS.trinity_annual.name}</h3>
            <p className="text-3xl font-bold text-white mb-1">
              {PLANS.trinity_annual.price}
              <span className="text-white/60 text-base font-normal">{PLANS.trinity_annual.interval}</span>
            </p>
            <p className="text-white/60 text-sm mb-6">14-day free trial included</p>

            <ul className="space-y-3 mb-6">
              {PLANS.trinity_annual.features.map((feature, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('trinity_annual')}
              disabled={actionLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Start 14-Day Trial</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Revenue Sprint */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Revenue Sprint</h3>
              <p className="text-white/80">7-Day intensive campaign to recover lost revenue</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">$1,500</p>
            <p className="text-white/60 text-sm">one-time</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-semibold mb-3">What's Included:</h4>
            <ul className="space-y-2">
              {[
                '100% ghost client list outreach',
                'Hummingbird 4-day cadence',
                'Personal concierge support',
                'Guaranteed results or refund',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Expected Results:</h4>
            <ul className="space-y-2">
              {[
                '$1,800-$3,100 recovered revenue',
                '8-12% ghost reactivation rate',
                'Campaign completes in 7 days',
                '6-10x ROI on investment',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-white/80">
                  <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={handleRevenueSprint}
          disabled={actionLoading}
          className="mt-6 w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-bold text-lg transition-all disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Purchase Revenue Sprint</span>
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Gem, Plus, Search, Sparkles, Trash2, Trophy, UserPlus, X } from 'lucide-react';
import type {
  LoyaltyMember,
  LoyaltyProgram,
  LoyaltyReward,
  LoyaltyRewardType,
  ReferralLeader,
  ReferralWithClients,
} from '@/lib/agents/modules/loyalty';

type Tab = 'members' | 'program' | 'rewards' | 'referrals';

const REWARD_TYPES: LoyaltyRewardType[] = [
  'percent_off',
  'amount_off',
  'free_product',
  'free_service',
  'free_addon',
];

interface Props {
  businessName: string;
  initialProgram: LoyaltyProgram | null;
  initialMembers: LoyaltyMember[];
  initialRewards: LoyaltyReward[];
  initialReferrals: ReferralWithClients[];
  initialLeaders: ReferralLeader[];
}

export default function LoyaltyAdmin({
  businessName,
  initialProgram,
  initialMembers,
  initialRewards,
  initialReferrals,
  initialLeaders,
}: Props) {
  const [tab, setTab] = useState<Tab>('members');
  const [program, setProgram] = useState<LoyaltyProgram | null>(initialProgram);
  const [members, setMembers] = useState<LoyaltyMember[]>(initialMembers);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(initialRewards);
  const [referrals, setReferrals] = useState<ReferralWithClients[]>(initialReferrals);
  const [leaders] = useState<ReferralLeader[]>(initialLeaders);
  const [awardTarget, setAwardTarget] = useState<LoyaltyMember | null>(null);

  const stats = useMemo(() => {
    const totalOutstanding = members.reduce((sum, m) => sum + m.balance, 0);
    const byTier: Record<string, number> = {};
    for (const m of members) {
      const key = m.currentTier ?? '—';
      byTier[key] = (byTier[key] ?? 0) + 1;
    }
    return { count: members.length, totalOutstanding, byTier };
  }, [members]);

  if (!program) {
    return (
      <div className="x3o-term p-8">
        <h1 className="text-xl font-bold mb-2">Loyalty &amp; Rewards</h1>
        <p className="text-sm text-muted-foreground mb-4">
          No active loyalty program for <strong>{businessName}</strong>. The
          program is created by migration <code>060_loyalty.sql</code> for seeded
          tenants; for new tenants insert a row into{' '}
          <code>loyalty_programs</code> first.
        </p>
      </div>
    );
  }

  async function refreshMembers(search?: string) {
    const url = new URL('/api/agents/loyalty/members', window.location.origin);
    if (search) url.searchParams.set('search', search);
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
  }

  return (
    <div className="x3o-term space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-[#00ffb2]" />
            <h1 className="text-xl font-bold">{program.name}</h1>
            <span className="term-label text-muted-foreground">
              · {program.currencyLabel}
            </span>
          </div>
          {program.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {program.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs data-mono">
          <Stat label="Members" value={stats.count} />
          <Stat label="Outstanding" value={`${stats.totalOutstanding} ${program.currencyLabel}`} />
        </div>
      </header>

      <nav className="flex gap-1 border-b border-border" role="tablist">
        {(['members', 'program', 'rewards', 'referrals'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 capitalize transition-colors ${
              tab === t
                ? 'border-[#00ffb2] text-[#00ffb2]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'members' && (
        <MembersTab
          members={members}
          currency={program.currencyLabel}
          onSearch={refreshMembers}
          onAward={(m) => setAwardTarget(m)}
        />
      )}

      {tab === 'program' && (
        <ProgramTab
          program={program}
          onSaved={(p) => setProgram(p)}
        />
      )}

      {tab === 'rewards' && (
        <RewardsTab
          rewards={rewards}
          currency={program.currencyLabel}
          onChange={setRewards}
        />
      )}

      {tab === 'referrals' && (
        <ReferralsTab
          program={program}
          referrals={referrals}
          leaders={leaders}
          onRefresh={async () => {
            const res = await fetch('/api/agents/loyalty/referrals');
            if (res.ok) {
              const data = await res.json();
              setReferrals(data.referrals ?? []);
            }
          }}
        />
      )}

      {awardTarget && (
        <AwardModal
          member={awardTarget}
          currency={program.currencyLabel}
          onClose={() => setAwardTarget(null)}
          onSuccess={() => {
            setAwardTarget(null);
            refreshMembers();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// MEMBERS
// ============================================================

function MembersTab({
  members,
  currency,
  onSearch,
  onAward,
}: {
  members: LoyaltyMember[];
  currency: string;
  onSearch: (q: string) => void;
  onAward: (m: LoyaltyMember) => void;
}) {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch(search);
            }}
            className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:border-[#00ffb2]"
          />
        </div>
        <button
          type="button"
          onClick={() => onSearch(search)}
          className="px-3 py-1.5 text-sm bg-card border border-border rounded hover:border-[#00ffb2] transition-colors"
        >
          Search
        </button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No members yet. Members appear here automatically when they earn from
          an order or appointment.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground term-label">
              <tr>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-left px-3 py-2">Tier</th>
                <th className="text-right px-3 py-2">Balance</th>
                <th className="text-right px-3 py-2">Lifetime</th>
                <th className="text-left px-3 py-2">Last activity</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.accountId} className="border-t border-border hover:bg-white/5">
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {[m.firstName, m.lastName].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground data-mono">
                      {m.email ?? m.phone ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {m.currentTier ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-[#00ffb2]/15 text-[#00ffb2]">
                        {m.currentTier}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right data-mono">
                    {m.balance} <span className="text-muted-foreground">{currency}</span>
                  </td>
                  <td className="px-3 py-2 text-right data-mono text-muted-foreground">
                    {m.lifetimePoints}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {m.lastActivityAt
                      ? new Date(m.lastActivityAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onAward(m)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:border-[#00ffb2] hover:text-[#00ffb2] transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Award
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROGRAM
// ============================================================

function ProgramTab({
  program,
  onSaved,
}: {
  program: LoyaltyProgram;
  onSaved: (p: LoyaltyProgram) => void;
}) {
  const [name, setName] = useState(program.name);
  const [currencyLabel, setCurrencyLabel] = useState(program.currencyLabel);
  const [description, setDescription] = useState(program.description ?? '');
  const [earnRulesText, setEarnRulesText] = useState(
    JSON.stringify(program.earnRules, null, 2)
  );
  const [tierConfigText, setTierConfigText] = useState(
    JSON.stringify(program.tierConfig, null, 2)
  );
  const [pointsExpireDays, setPointsExpireDays] = useState(
    program.pointsExpireDays?.toString() ?? ''
  );
  const [referralsEnabled, setReferralsEnabled] = useState(program.referralsEnabled);
  const [referrerBonus, setReferrerBonus] = useState(
    program.referrerBonusPoints.toString()
  );
  const [refereeBonus, setRefereeBonus] = useState(
    program.refereeBonusPoints.toString()
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    let earnRules;
    let tierConfig;
    try {
      earnRules = JSON.parse(earnRulesText);
    } catch {
      setError('Earn rules: invalid JSON');
      return;
    }
    try {
      tierConfig = JSON.parse(tierConfigText);
    } catch {
      setError('Tier config: invalid JSON');
      return;
    }
    const referrerBonusN = parseInt(referrerBonus, 10);
    const refereeBonusN = parseInt(refereeBonus, 10);
    if (!Number.isFinite(referrerBonusN) || referrerBonusN < 0) {
      setError('Referrer bonus must be a non-negative integer');
      return;
    }
    if (!Number.isFinite(refereeBonusN) || refereeBonusN < 0) {
      setError('Referee bonus must be a non-negative integer');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/agents/loyalty/program', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          currencyLabel,
          description: description || null,
          earnRules,
          tierConfig,
          referralsEnabled,
          referrerBonusPoints: referrerBonusN,
          refereeBonusPoints: refereeBonusN,
          pointsExpireDays: pointsExpireDays
            ? parseInt(pointsExpireDays, 10)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Save failed');
      } else {
        onSaved(data.program);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Program name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Currency label">
          <input
            type="text"
            value={currencyLabel}
            onChange={(e) => setCurrencyLabel(e.target.value)}
            className={inputCls}
            placeholder="Locs, Stars, Points…"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Field>

      <Field
        label="Earn rules (JSON)"
        hint='Array of triggers. Example: {"rules":[{"trigger":"order.paid","points":1,"per":"dollar"}]}'
      >
        <textarea
          value={earnRulesText}
          onChange={(e) => setEarnRulesText(e.target.value)}
          rows={10}
          className={`${inputCls} data-mono text-xs`}
        />
      </Field>

      <Field
        label="Tiers (JSON)"
        hint='Each tier needs name, threshold (lifetime points), perks[].'
      >
        <textarea
          value={tierConfigText}
          onChange={(e) => setTierConfigText(e.target.value)}
          rows={8}
          className={`${inputCls} data-mono text-xs`}
        />
      </Field>

      <Field
        label="Points expire after (days)"
        hint="Leave blank for non-expiring points."
      >
        <input
          type="number"
          min={1}
          value={pointsExpireDays}
          onChange={(e) => setPointsExpireDays(e.target.value)}
          className={inputCls}
        />
      </Field>

      <fieldset className="border border-border rounded p-3 space-y-3">
        <legend className="text-xs term-label text-muted-foreground px-2">
          Referrals
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={referralsEnabled}
            onChange={(e) => setReferralsEnabled(e.target.checked)}
            className="accent-[#00ffb2]"
          />
          Enable referrals
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            label={`Referee bonus (${currencyLabel})`}
            hint="Awarded immediately when a new client applies a referral code."
          >
            <input
              type="number"
              min={0}
              value={refereeBonus}
              onChange={(e) => setRefereeBonus(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label={`Referrer bonus (${currencyLabel})`}
            hint="Awarded after the referee's first paid order or appointment."
          >
            <input
              type="number"
              min={0}
              value={referrerBonus}
              onChange={(e) => setReferrerBonus(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm bg-[#00ffb2] text-black font-semibold rounded hover:bg-[#00e0a0] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save program'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// REWARDS
// ============================================================

interface RewardDraft {
  id?: string;
  name: string;
  description: string;
  costPoints: string;
  rewardType: LoyaltyRewardType;
  tierRequired: string;
  configText: string;
}

const EMPTY_REWARD: RewardDraft = {
  name: '',
  description: '',
  costPoints: '',
  rewardType: 'percent_off',
  tierRequired: '',
  configText: '{}',
};

function RewardsTab({
  rewards,
  currency,
  onChange,
}: {
  rewards: LoyaltyReward[];
  currency: string;
  onChange: (r: LoyaltyReward[]) => void;
}) {
  const [draft, setDraft] = useState<RewardDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setError(null);
    setDraft(EMPTY_REWARD);
  }

  function startEdit(r: LoyaltyReward) {
    setError(null);
    setDraft({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      costPoints: r.costPoints.toString(),
      rewardType: r.rewardType,
      tierRequired: r.tierRequired ?? '',
      configText: JSON.stringify(r.config, null, 2),
    });
  }

  async function save() {
    if (!draft) return;
    setError(null);
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(draft.configText || '{}');
    } catch {
      setError('Config: invalid JSON');
      return;
    }
    const cost = parseInt(draft.costPoints, 10);
    if (!Number.isFinite(cost) || cost < 0) {
      setError('Cost points must be a non-negative integer');
      return;
    }

    const body = {
      name: draft.name,
      description: draft.description || null,
      costPoints: cost,
      rewardType: draft.rewardType,
      tierRequired: draft.tierRequired || null,
      config,
    };

    const url = draft.id
      ? `/api/agents/loyalty/rewards/${draft.id}`
      : '/api/agents/loyalty/rewards';
    const method = draft.id ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Save failed');
      return;
    }
    const saved: LoyaltyReward = data.reward;
    onChange(
      draft.id
        ? rewards.map((r) => (r.id === saved.id ? saved : r))
        : [...rewards, saved]
    );
    setDraft(null);
  }

  async function toggleActive(r: LoyaltyReward) {
    const res = await fetch(`/api/agents/loyalty/rewards/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      onChange(rewards.map((x) => (x.id === r.id ? data.reward : x)));
    }
  }

  async function remove(r: LoyaltyReward) {
    if (!confirm(`Delete reward "${r.name}"?`)) return;
    const res = await fetch(`/api/agents/loyalty/rewards/${r.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onChange(rewards.filter((x) => x.id !== r.id));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rewards.length} reward{rewards.length === 1 ? '' : 's'} in catalog
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-card border border-border rounded hover:border-[#00ffb2] hover:text-[#00ffb2]"
        >
          <Plus className="w-4 h-4" />
          New reward
        </button>
      </div>

      {rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No rewards yet. Create one above.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rewards.map((r) => (
            <div
              key={r.id}
              className={`p-3 border rounded ${
                r.isActive ? 'border-border' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{r.name}</h3>
                  <p className="text-xs text-muted-foreground data-mono">
                    {r.rewardType} · {r.costPoints} {currency}
                    {r.tierRequired ? ` · ${r.tierRequired}+ tier` : ''}
                  </p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="text-muted-foreground hover:text-red-400 shrink-0"
                  aria-label="Delete reward"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="text-xs px-2 py-1 border border-border rounded hover:border-[#00ffb2]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(r)}
                  className="text-xs px-2 py-1 border border-border rounded hover:border-[#00ffb2]"
                >
                  {r.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <Modal onClose={() => setDraft(null)} title={draft.id ? 'Edit reward' : 'New reward'}>
          <div className="space-y-3">
            <Field label="Name">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Cost (${currency})`}>
                <input
                  type="number"
                  min={0}
                  value={draft.costPoints}
                  onChange={(e) => setDraft({ ...draft, costPoints: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Type">
                <select
                  value={draft.rewardType}
                  onChange={(e) =>
                    setDraft({ ...draft, rewardType: e.target.value as LoyaltyRewardType })
                  }
                  className={inputCls}
                >
                  {REWARD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Tier required (optional)"
              hint="Must match a tier name in the program's tier_config."
            >
              <input
                type="text"
                value={draft.tierRequired}
                onChange={(e) => setDraft({ ...draft, tierRequired: e.target.value })}
                className={inputCls}
                placeholder="e.g. Insider"
              />
            </Field>
            <Field
              label="Config (JSON)"
              hint='e.g. {"percent":10,"max_discount_cents":2000} for percent_off'
            >
              <textarea
                value={draft.configText}
                onChange={(e) => setDraft({ ...draft, configText: e.target.value })}
                rows={4}
                className={`${inputCls} data-mono text-xs`}
              />
            </Field>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-3 py-1.5 text-sm border border-border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="px-3 py-1.5 text-sm bg-[#00ffb2] text-black font-semibold rounded"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// REFERRALS
// ============================================================

function ReferralsTab({
  program,
  referrals,
  leaders,
  onRefresh,
}: {
  program: LoyaltyProgram;
  referrals: ReferralWithClients[];
  leaders: ReferralLeader[];
  onRefresh: () => void | Promise<void>;
}) {
  const totalConverted = referrals.filter((r) => r.status === 'converted').length;
  const totalPending = referrals.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {!program.referralsEnabled && (
        <div className="p-3 border border-border rounded bg-card text-sm text-muted-foreground">
          Referrals are disabled. Enable them in the <strong>Program</strong> tab
          and set referrer + referee bonus amounts.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 border border-border rounded">
          <div className="term-label text-muted-foreground">Total</div>
          <div className="text-lg font-semibold">{referrals.length}</div>
        </div>
        <div className="p-3 border border-border rounded">
          <div className="term-label text-muted-foreground">Converted</div>
          <div className="text-lg font-semibold text-[#00ffb2]">{totalConverted}</div>
        </div>
        <div className="p-3 border border-border rounded">
          <div className="term-label text-muted-foreground">Pending</div>
          <div className="text-lg font-semibold">{totalPending}</div>
        </div>
        <div className="p-3 border border-border rounded">
          <div className="term-label text-muted-foreground">Bonuses</div>
          <div className="text-sm">
            {program.refereeBonusPoints} → new ·{' '}
            <span className="text-[#00ffb2]">{program.referrerBonusPoints}</span>{' '}
            on convert
          </div>
        </div>
      </div>

      {leaders.length > 0 && (
        <div className="rounded border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
            <Trophy className="w-4 h-4 text-[#00ffb2]" />
            <h2 className="text-sm font-semibold">Top referrers</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              by conversions
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground term-label bg-card/50">
              <tr>
                <th className="text-left px-3 py-1.5 w-10">#</th>
                <th className="text-left px-3 py-1.5">Referrer</th>
                <th className="text-left px-3 py-1.5">Tier</th>
                <th className="text-right px-3 py-1.5">Converted</th>
                <th className="text-right px-3 py-1.5">Total</th>
                <th className="text-right px-3 py-1.5">
                  {program.currencyLabel} earned
                </th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l, i) => (
                <tr key={l.clientId} className="border-t border-border hover:bg-white/5">
                  <td className="px-3 py-2 text-muted-foreground data-mono">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {[l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground data-mono">
                      {l.email ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {l.currentTier ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-[#00ffb2]/15 text-[#00ffb2]">
                        {l.currentTier}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right data-mono text-[#00ffb2]">
                    {l.convertedReferrals}
                  </td>
                  <td className="px-3 py-2 text-right data-mono text-muted-foreground">
                    {l.totalReferrals}
                  </td>
                  <td className="px-3 py-2 text-right data-mono">
                    {l.pointsEarned}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing most recent referrals
        </p>
        <button
          type="button"
          onClick={() => onRefresh()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-card border border-border rounded hover:border-[#00ffb2]"
        >
          <UserPlus className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {referrals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No referrals yet. When a new client applies a code, they show up here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground term-label">
              <tr>
                <th className="text-left px-3 py-2">Referrer</th>
                <th className="text-left px-3 py-2">Referee</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Applied</th>
                <th className="text-left px-3 py-2">Converted</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-white/5">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.referrerName}</div>
                    <div className="text-xs text-muted-foreground data-mono">
                      {r.referrerEmail ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.refereeName}</div>
                    <div className="text-xs text-muted-foreground data-mono">
                      {r.refereeEmail ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        r.status === 'converted'
                          ? 'bg-[#00ffb2]/15 text-[#00ffb2]'
                          : r.status === 'pending'
                          ? 'bg-yellow-400/15 text-yellow-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.convertedAt
                      ? new Date(r.convertedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AWARD MODAL
// ============================================================

function AwardModal({
  member,
  currency,
  onClose,
  onSuccess,
}: {
  member: LoyaltyMember;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState<'adjust' | 'referral' | 'signup_bonus' | 'expire'>('adjust');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    const parsed = parseInt(delta, 10);
    if (!Number.isFinite(parsed) || parsed === 0) {
      setError('Enter a non-zero integer (negative to deduct).');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/agents/loyalty/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: member.clientId,
          delta: parsed,
          reason,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Award failed');
      } else {
        onSuccess();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Award failed');
    } finally {
      setSaving(false);
    }
  }

  const memberName =
    [member.firstName, member.lastName].filter(Boolean).join(' ') || 'this client';

  return (
    <Modal onClose={onClose} title={`Award ${currency}`}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Adjust loyalty balance for <strong>{memberName}</strong>. Current
          balance: {member.balance} {currency}.
        </p>
        <Field label={`Delta (${currency})`} hint="Use a negative value to deduct.">
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            className={inputCls}
            autoFocus
          />
        </Field>
        <Field label="Reason">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
            className={inputCls}
          >
            <option value="adjust">Adjust</option>
            <option value="referral">Referral</option>
            <option value="signup_bonus">Signup bonus</option>
            <option value="expire">Expire</option>
          </select>
        </Field>
        <Field label="Note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-[#00ffb2] text-black font-semibold rounded disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// PRIMITIVES
// ============================================================

const inputCls =
  'w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:border-[#00ffb2]';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="term-label text-muted-foreground block mb-1">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground mt-1">{hint}</span>
      )}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <div className="term-label text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

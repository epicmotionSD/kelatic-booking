'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Mail,
  Palette,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Template = 'booking' | 'commerce';
type BrandVoice = 'warm' | 'professional' | 'playful' | 'inspiring';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Los_Angeles', label: 'Pacific' },
];

const BRAND_COLORS = [
  '#00ffb2', // x3o mint
  '#f59e0b', // amber (salon)
  '#3f7d4f', // herbal green (cafe)
  '#7c3aed', // violet
  '#0ea5e9', // sky
  '#ef4444', // red
];

export default function GetStartedPage() {
  return (
    <Suspense fallback={<Shell><div className="p-8">Loading…</div></Shell>}>
      <GetStartedInner />
    </Suspense>
  );
}

function GetStartedInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  // Two phases: "email" (pre-auth) and "configure" (post-auth, the rest of
  // the wizard). When the user clicks the magic link they come back to this
  // page already authenticated, so we skip directly to "configure".
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  // Magic-link step state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state (configure phase)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'available' }
    | { state: 'taken' | 'reserved' | 'invalid_format' | 'empty' }
  >({ state: 'idle' });
  const [businessType, setBusinessType] = useState<string>('salon');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [template, setTemplate] = useState<Template>('booking');
  const [primaryColor, setPrimaryColor] = useState('#00ffb2');
  const [brandVoice, setBrandVoice] = useState<BrandVoice>('warm');
  const [submitting, setSubmitting] = useState(false);

  // Auth check on mount + on URL change (handles the magic-link redirect)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthed(!!data.user);
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, params]);

  // Auto-suggest a slug from the business name, only until the user edits it
  useEffect(() => {
    if (slugTouched) return;
    setSlug(normalizeSlug(businessName));
  }, [businessName, slugTouched]);

  // Live slug availability (debounced)
  const slugSeq = useRef(0);
  useEffect(() => {
    if (!slug) {
      setSlugStatus({ state: 'idle' });
      return;
    }
    setSlugStatus({ state: 'checking' });
    const seq = ++slugSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/platform/check-slug?slug=${encodeURIComponent(slug)}`
        );
        if (seq !== slugSeq.current) return;
        const data = await res.json();
        if (seq !== slugSeq.current) return;
        if (data.available) setSlugStatus({ state: 'available' });
        else setSlugStatus({ state: data.reason ?? 'taken' });
      } catch {
        if (seq !== slugSeq.current) return;
        setSlugStatus({ state: 'idle' });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  async function sendMagicLink() {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/get-started`,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      setEmailSent(true);
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    setError(null);
    if (slugStatus.state !== 'available') {
      setError('Pick an available subdomain to continue.');
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/platform/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerFirstName,
          ownerLastName,
          slug,
          businessName,
          businessType,
          city,
          state: stateCode,
          timezone,
          template,
          primaryColor,
          brandVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create your business.');
        return;
      }
      // Redirect to <slug>.<root>/admin so the tenant's middleware picks them up
      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN || window.location.host.split(':')[0];
      const proto = window.location.protocol;
      // Local dev: <slug>.localhost
      const localhostDev = rootDomain.includes('localhost');
      const host = localhostDev
        ? `${data.business.slug}.${rootDomain}`
        : `${data.business.slug}.${rootDomain}`;
      window.location.href = `${proto}//${host}/admin?welcome=1`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────── render ───────────────────────

  if (!authChecked) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#00ffb2]" />
        </div>
      </Shell>
    );
  }

  if (!authed) {
    return (
      <Shell>
        <div className="max-w-md mx-auto py-12">
          <h1 className="text-3xl font-bold mb-2">Start your platform</h1>
          <p className="text-zinc-400 mb-8">
            Drop your email and we&apos;ll send a one-click sign-in link. Then
            you&apos;ll pick a template and your subdomain goes live.
          </p>

          {emailSent ? (
            <div className="border border-[#00ffb2]/30 bg-[#00ffb2]/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#00ffb2] font-semibold mb-2">
                <Mail className="w-5 h-5" />
                Check your email
              </div>
              <p className="text-sm text-zinc-300">
                We sent a link to <strong>{email}</strong>. Click it from this
                same browser and you&apos;ll come back here to finish setup.
              </p>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="mt-3 text-xs text-zinc-500 underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
                  placeholder="you@yourbusiness.com"
                  className={inputDark}
                  autoFocus
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00ffb2] text-black font-semibold hover:bg-[#00e0a0] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Email me the link
              </button>
              <p className="text-xs text-zinc-500 text-center pt-2">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // Authenticated — the configure wizard
  return (
    <Shell>
      <div className="max-w-2xl mx-auto py-10">
        <StepIndicator step={step} />

        {step === 1 && (
          <Section title="Tell us about you" description="A name on your account.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  className={inputDark}
                  autoFocus
                />
              </Field>
              <Field label="Last name">
                <input
                  type="text"
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                  className={inputDark}
                />
              </Field>
            </div>
            <NavButtons
              onNext={() => setStep(2)}
              nextDisabled={!ownerFirstName.trim()}
            />
          </Section>
        )}

        {step === 2 && (
          <Section
            title="Name your business"
            description="This will be your subdomain. You can wire a custom domain later."
          >
            <Field label="Business name">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Kelatic Hair Lounge"
                className={inputDark}
                autoFocus
              />
            </Field>
            <Field
              label="Subdomain"
              hint={`Your storefront lives at ${slug || '<your-subdomain>'}.x3o.ai`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(normalizeSlug(e.target.value));
                  }}
                  className={inputDark}
                  placeholder="your-business"
                />
                <SlugBadge status={slugStatus} />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Business type">
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={inputDark}
                  aria-label="Business type"
                >
                  <option value="salon">Salon / Beauty</option>
                  <option value="barbershop">Barbershop</option>
                  <option value="spa">Spa / Wellness</option>
                  <option value="cafe">Café / Wellness Bar</option>
                  <option value="retail">Retail / Products</option>
                </select>
              </Field>
              <Field label="Timezone">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputDark}
                  aria-label="Timezone"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="City">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputDark}
                  />
                </Field>
              </div>
              <Field label="State">
                <input
                  type="text"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                  className={inputDark}
                  placeholder="TX"
                />
              </Field>
            </div>
            <NavButtons
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextDisabled={
                !businessName.trim() ||
                slugStatus.state !== 'available'
              }
            />
          </Section>
        )}

        {step === 3 && (
          <Section
            title="Pick your template"
            description="Two starting points — both fully editable once you're in."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TemplateCard
                selected={template === 'booking'}
                onClick={() => setTemplate('booking')}
                icon={<Store className="w-5 h-5" />}
                title="Booking"
                blurb="Services, stylists, schedules, online booking, POS. For salons, barbershops, spas."
              />
              <TemplateCard
                selected={template === 'commerce'}
                onClick={() => setTemplate('commerce')}
                icon={<ShoppingBag className="w-5 h-5" />}
                title="Commerce"
                blurb="Product catalog with modifiers, public storefront, in-person Stripe Terminal. For cafés, retail, products."
              />
            </div>
            <NavButtons
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          </Section>
        )}

        {step === 4 && (
          <Section title="Make it yours" description="You can change all of this later.">
            <Field label="Brand color">
              <div className="flex flex-wrap gap-2">
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    aria-label={`Use color ${c}`}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform ${
                      primaryColor === c
                        ? 'border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg bg-transparent border border-zinc-700 cursor-pointer"
                  aria-label="Custom color"
                />
              </div>
            </Field>
            <Field label="Brand voice">
              <select
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value as BrandVoice)}
                className={inputDark}
                aria-label="Brand voice"
              >
                <option value="warm">Warm</option>
                <option value="professional">Professional</option>
                <option value="playful">Playful</option>
                <option value="inspiring">Inspiring</option>
              </select>
            </Field>

            <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Summary
              </div>
              <ul className="text-sm space-y-1 text-zinc-300">
                <li><strong>{businessName}</strong> — {businessType}</li>
                <li className="text-zinc-500">
                  Subdomain: <span className="data-mono">{slug}.x3o.ai</span>
                </li>
                <li className="text-zinc-500">
                  Template: <strong className="text-zinc-300 capitalize">{template}</strong>
                </li>
                <li className="text-zinc-500">
                  Brand voice: <strong className="text-zinc-300 capitalize">{brandVoice}</strong>
                </li>
              </ul>
            </div>

            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            <NavButtons
              onBack={() => setStep(3)}
              onNext={submit}
              nextLabel={submitting ? 'Launching…' : 'Launch my platform'}
              nextDisabled={submitting}
              nextIcon={
                submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            />
          </Section>
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────── primitives ───────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-900 px-5 py-3">
        <Link href="/" className="font-bold tracking-tight">
          x3o<span className="text-[#00ffb2]">.ai</span>
        </Link>
      </header>
      <div className="px-5">{children}</div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2 mb-6 text-xs uppercase tracking-wider text-zinc-500">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              n === step
                ? 'bg-[#00ffb2] text-black'
                : n < step
                ? 'bg-[#00ffb2]/20 text-[#00ffb2]'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {n < step ? <Check className="w-3 h-3" /> : n}
          </span>
          {n < 4 && <span className="w-6 h-px bg-zinc-800" />}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      {description && <p className="text-sm text-zinc-400 mb-6">{description}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

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
      <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-zinc-500 mt-1">{hint}</span>}
    </label>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  nextIcon,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pt-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00ffb2] text-black font-semibold hover:bg-[#00e0a0] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {nextLabel}
        {nextIcon ?? <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TemplateCard({
  selected,
  onClick,
  icon,
  title,
  blurb,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-colors ${
        selected
          ? 'border-[#00ffb2] bg-[#00ffb2]/10'
          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 text-[#00ffb2]">
        {icon}
        <span className="font-semibold text-white">{title}</span>
        {selected && <CheckCircle2 className="w-4 h-4 ml-auto" />}
      </div>
      <p className="text-sm text-zinc-400">{blurb}</p>
    </button>
  );
}

function SlugBadge({
  status,
}: {
  status:
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'available' }
    | { state: 'taken' | 'reserved' | 'invalid_format' | 'empty' };
}) {
  if (status.state === 'idle') return null;
  if (status.state === 'checking') {
    return (
      <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> checking
      </span>
    );
  }
  if (status.state === 'available') {
    return (
      <span className="text-xs text-[#00ffb2] inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> available
      </span>
    );
  }
  const labels: Record<string, string> = {
    taken: 'taken',
    reserved: 'reserved',
    invalid_format: 'invalid',
    empty: '',
  };
  return <span className="text-xs text-red-400">{labels[status.state] ?? 'unavailable'}</span>;
}

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

const inputDark =
  'w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-[#00ffb2] text-white placeholder-zinc-600';

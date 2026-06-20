'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Status dot ──────────────────────────────────────────────
type Tone = 'up' | 'down' | 'warn' | 'idle';
const TONE: Record<Tone, string> = {
  up: 'text-[#00ffb2]',
  down: 'text-[#ef4444]',
  warn: 'text-[#f59e0b]',
  idle: 'text-white/30',
};

export function StatusDot({ tone = 'up', className }: { tone?: Tone; className?: string }) {
  return <span className={cn('term-dot', TONE[tone], className)} aria-hidden />;
}

// ── Live clock ──────────────────────────────────────────────
export function Clock({ className }: { className?: string }) {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={cn('data-mono', className)}>{now || '--:--:--'}</span>;
}

// ── Panel (terminal card) ───────────────────────────────────
export function Panel({
  title,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-md border border-border bg-card', className)}>
      {(title || right) && (
        <header className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="term-label text-muted-foreground">{title}</span>
          {right}
        </header>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

// ── Delta arrow ─────────────────────────────────────────────
export function Delta({ dir }: { dir: 'up' | 'down' }) {
  const Icon = dir === 'up' ? ArrowUpRight : ArrowDownRight;
  return <Icon className={cn('w-3.5 h-3.5 inline', dir === 'up' ? 'text-[#00ffb2]' : 'text-[#ef4444]')} />;
}

// ── Stat tile ───────────────────────────────────────────────
export function StatTile({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: 'up' | 'down';
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-3">
      <div className="term-label text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="data-mono text-2xl font-bold text-foreground">{value}</span>
        {delta && <Delta dir={delta} />}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

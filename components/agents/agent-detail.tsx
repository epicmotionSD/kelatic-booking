'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Play, ChevronUp } from 'lucide-react';
import type { PrimaryAgent } from '@/lib/agents/primary/types';
import { AgentIcon } from './icons';
import AgentAction from './actions/agent-action';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[#2563eb]/15 text-[#60a5fa]',
  POST: 'bg-[#00ffb2]/15 text-[#00ffb2]',
  PATCH: 'bg-[#f59e0b]/15 text-[#f59e0b]',
  DELETE: 'bg-[#ef4444]/15 text-[#ef4444]',
};

export default function AgentDetail({
  agent,
  businessId,
}: {
  agent: PrimaryAgent;
  businessId: string | null;
}) {
  const [openTool, setOpenTool] = useState<string | null>(null);

  return (
    <div>
      <Link href="/admin/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> All agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-12 h-12 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
        >
          <AgentIcon name={agent.icon} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{agent.name}</h1>
          <p className="text-sm font-medium" style={{ color: agent.color }}>{agent.tagline}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{agent.description}</p>
        </div>
      </div>

      {/* Modules */}
      <div className="grid gap-3">
        {agent.modules.map((m) => (
          <div key={m.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-white/5 text-muted-foreground flex items-center justify-center shrink-0">
                  <AgentIcon name={m.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                </div>
              </div>
              {m.adminPath && (
                <Link
                  href={m.adminPath}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-[#00ffb2]/40 transition-colors"
                >
                  Open full view <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <div className="term-label text-muted-foreground mb-2">Tools</div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {m.tools.map((t) => {
                  const runnable = !!t.action;
                  const isOpen = openTool === t.id;
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      {t.method && (
                        <span className={`data-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[t.method] || 'bg-white/5 text-muted-foreground'}`}>
                          {t.method}
                        </span>
                      )}
                      <span className="text-foreground/90">{t.name}</span>
                      {runnable && (
                        <button
                          onClick={() => setOpenTool(isOpen ? null : t.id)}
                          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded text-black"
                          style={{ backgroundColor: '#00ffb2' }}
                        >
                          {isOpen ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><Play className="w-3.5 h-3.5" /> Run</>}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {m.tools.map((t) =>
                t.action && openTool === t.id ? (
                  <AgentAction key={`panel-${t.id}`} action={t.action} endpoint={t.endpoint} businessId={businessId} color="#00ffb2" />
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { PrimaryAgent } from '@/lib/agents/primary/types';
import type { OrchestratorReadiness, AgentReadiness } from '@/lib/agents/primary';
import { AgentIcon } from './icons';
import { StatusDot } from '@/components/terminal';

export default function AgentsBoard({
  agents,
  readiness,
}: {
  agents: PrimaryAgent[];
  readiness: OrchestratorReadiness;
}) {
  const byId = new Map<string, AgentReadiness>(readiness.agents.map((a) => [a.id, a]));
  const { agentCount, moduleCount, toolCount, runnableToolCount, unwiredToolCount } = readiness.summary;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Your AI Team</h1>
        <p className="text-sm text-muted-foreground">
          Three agents run your business. Open one to see its modules and jump into the work.
        </p>
      </div>

      {/* Orchestrator readiness summary */}
      <div className="mb-4 rounded-md border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5 term-label text-muted-foreground">
          <StatusDot tone={unwiredToolCount > 0 ? 'warn' : 'up'} /> orchestrator
        </span>
        <span className="data-mono text-[11px] text-muted-foreground">
          {agentCount} agents · {moduleCount} modules · {toolCount} tools · {runnableToolCount} runnable
        </span>
        {unwiredToolCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#f59e0b] data-mono">
            <AlertTriangle className="w-3.5 h-3.5" /> {unwiredToolCount} without an endpoint
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const r = byId.get(agent.id);
          const total = r?.toolCount ?? agent.modules.reduce((n, m) => n + m.tools.length, 0);
          const wired = r
            ? r.modules.reduce((n, m) => n + m.tools.filter((t) => t.wired).length, 0)
            : total;
          const runnable = r?.runnableToolCount ?? 0;
          const allWired = wired === total;

          return (
            <Link
              key={agent.id}
              href={`/admin/agents/${agent.id}`}
              className="group rounded-md border border-border bg-card hover:border-[#00ffb2]/40 transition-colors p-4 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
                >
                  <AgentIcon name={agent.icon} className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 term-label text-muted-foreground">
                  <StatusDot tone={allWired ? 'up' : 'warn'} />
                  {allWired ? 'ready' : `${wired}/${total} wired`}
                </span>
              </div>

              <h2 className="mt-3 font-semibold text-foreground">{agent.name}</h2>
              <p className="text-xs font-medium" style={{ color: agent.color }}>{agent.tagline}</p>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{agent.description}</p>

              <div className="flex flex-wrap gap-1 mt-3">
                {agent.modules.map((m) => (
                  <span key={m.id} className="term-label text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {m.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="data-mono text-[11px] text-muted-foreground">
                  {agent.modules.length} mod · {total} tools · {runnable} runnable
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-foreground group-hover:text-[#00ffb2] group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

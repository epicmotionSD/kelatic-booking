'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PrimaryAgent } from '@/lib/agents/primary/types';
import { AgentIcon } from './icons';
import { StatusDot } from '@/components/terminal';

export default function AgentsBoard({ agents }: { agents: PrimaryAgent[] }) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Your AI Team</h1>
        <p className="text-sm text-muted-foreground">
          Three agents run your business. Open one to see its modules and jump into the work.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const toolCount = agent.modules.reduce((n, m) => n + m.tools.length, 0);
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
                  <StatusDot tone="up" /> active
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
                  {agent.modules.length} mod · {toolCount} tools
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

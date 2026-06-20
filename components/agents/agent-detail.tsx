'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Play, ChevronUp } from 'lucide-react';
import type { PrimaryAgent } from '@/lib/agents/primary/types';
import { AgentIcon } from './icons';
import AgentAction from './actions/agent-action';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-600',
  POST: 'bg-emerald-50 text-emerald-700',
  PATCH: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-600',
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
    <div className="bg-gray-50 rounded-2xl p-6 min-h-[calc(100vh-8rem)]">
      <Link href="/admin/agents" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> All agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${agent.color}1a`, color: agent.color }}
        >
          <AgentIcon name={agent.icon} className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
          <p className="font-medium" style={{ color: agent.color }}>{agent.tagline}</p>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">{agent.description}</p>
        </div>
      </div>

      {/* Modules */}
      <div className="grid gap-4">
        {agent.modules.map((m) => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <AgentIcon name={m.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500">{m.description}</p>
                </div>
              </div>
              {m.adminPath && (
                <Link
                  href={m.adminPath}
                  className="shrink-0 inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Open full view <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Tools</div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {m.tools.map((t) => {
                  const runnable = !!t.action;
                  const isOpen = openTool === t.id;
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      {t.method && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[t.method] || 'bg-gray-100 text-gray-500'}`}>
                          {t.method}
                        </span>
                      )}
                      <span className="text-gray-700">{t.name}</span>
                      {runnable && (
                        <button
                          onClick={() => setOpenTool(isOpen ? null : t.id)}
                          className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md text-white"
                          style={{ backgroundColor: agent.color }}
                        >
                          {isOpen ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><Play className="w-3.5 h-3.5" /> Run</>}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Inline action panels */}
              {m.tools.map((t) =>
                t.action && openTool === t.id ? (
                  <AgentAction key={`panel-${t.id}`} action={t.action} endpoint={t.endpoint} businessId={businessId} color={agent.color} />
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

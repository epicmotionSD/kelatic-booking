'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PrimaryAgent } from '@/lib/agents/primary/types';
import { AgentIcon } from './icons';

export default function AgentsBoard({ agents }: { agents: PrimaryAgent[] }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 min-h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your AI Team</h1>
        <p className="text-sm text-gray-500">
          Three agents run your business. Open one to see what it handles and jump into the work.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const toolCount = agent.modules.reduce((n, m) => n + m.tools.length, 0);
          return (
            <Link
              key={agent.id}
              href={`/admin/agents/${agent.id}`}
              className="group bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 transition-colors flex flex-col"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${agent.color}1a`, color: agent.color }}
              >
                <AgentIcon name={agent.icon} className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-gray-900">{agent.name}</h2>
              <p className="text-sm font-medium" style={{ color: agent.color }}>
                {agent.tagline}
              </p>
              <p className="text-sm text-gray-500 mt-2 flex-1">{agent.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {agent.modules.map((m) => (
                  <span key={m.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {m.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {agent.modules.length} modules · {toolCount} tools
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 group-hover:gap-2 transition-all">
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

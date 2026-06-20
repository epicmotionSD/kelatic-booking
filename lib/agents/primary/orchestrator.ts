// Primary Orchestrator — coordinates the THREE owner-facing agents:
// Attract, Retain, Serve.
//
// This is the orchestration layer the product is built around ("orchestrate
// with the 3 main agents"). It supersedes the legacy Board-of-Directors
// orchestrator (lib/agents/orchestrator.ts), which models a different set of
// roles (CEO / CTO / CMO / CFO) and is retained only for the command-center.
//
// The orchestrator is a thin, dependency-free coordination layer over the
// primary-agent registry. It does three things:
//   1. ROUTE  — map a high-level intent to the agent / module / tool that owns it.
//   2. DISPATCH — invoke a tool by calling its API route (fetch), passing the
//      tenant's businessId and an optional payload.
//   3. REPORT — produce a readiness snapshot of every agent, module, and tool.

import {
  PRIMARY_AGENTS,
  listPrimaryAgents,
  getPrimaryAgent,
  resolveTool,
} from './registry';
import type { PrimaryAgent, PrimaryAgentId, AgentModule, AgentTool } from './types';

// ============================================================
// INTENTS
// ============================================================

/** Owner-facing intents, each routed to exactly one tool in the registry. */
export type AgentIntent =
  | 'create-content' // Attract → Content Studio
  | 'run-campaign' //    Attract → Campaigns
  | 'win-back-clients' // Retain  → Win-Back
  | 'fill-calendar' //   Retain  → Rebooking & Scheduling
  | 'answer-client' //   Serve   → Client Support
  | 'send-reminders' //  Serve   → Reminders & Notifications
  | 'reward-loyalty'; //  Serve   → Loyalty & Rewards

/** Stable intent → tool-id map. Tool ids are the source of truth in registry.ts. */
const INTENT_TO_TOOL: Record<AgentIntent, string> = {
  'create-content': 'content.generate',
  'run-campaign': 'campaigns.generate',
  'win-back-clients': 'winback.ghostClients',
  'fill-calendar': 'scheduling.gaps',
  'answer-client': 'support.chat',
  'send-reminders': 'reminders.run',
  'reward-loyalty': 'loyalty.balance',
};

// ============================================================
// PUBLIC SHAPES
// ============================================================

export interface ResolvedRoute {
  agent: PrimaryAgent;
  module: AgentModule;
  tool: AgentTool;
}

export interface DispatchContext {
  /** Absolute origin for server-side fetch (e.g. https://kelatic.com). Omit for same-origin client calls. */
  baseUrl?: string;
  /** Tenant id — injected into the query (GET) or JSON body (POST/PATCH). */
  businessId?: string | null;
  /** JSON body for POST / PATCH / DELETE tools. */
  payload?: Record<string, unknown>;
  /** Extra query-string params for GET tools. */
  query?: Record<string, string>;
  /** Escape hatch for headers / signal / credentials. */
  init?: RequestInit;
}

export interface DispatchResult {
  ok: boolean;
  status: number;
  agentId: PrimaryAgentId;
  moduleId: string;
  toolId: string;
  data?: unknown;
  error?: string;
}

export interface ToolReadiness {
  id: string;
  name: string;
  endpoint?: string;
  method?: string;
  /** True when the tool can be run inline from the agent UI (has an action). */
  runnable: boolean;
  /** True when the tool is backed by an API route. */
  wired: boolean;
}

export interface ModuleReadiness {
  id: string;
  name: string;
  adminPath?: string;
  tools: ToolReadiness[];
}

export interface AgentReadiness {
  id: PrimaryAgentId;
  name: string;
  tagline: string;
  moduleCount: number;
  toolCount: number;
  runnableToolCount: number;
  modules: ModuleReadiness[];
}

export interface OrchestratorReadiness {
  agents: AgentReadiness[];
  summary: {
    agentCount: number;
    moduleCount: number;
    toolCount: number;
    runnableToolCount: number;
    /** Tools that declare no endpoint — i.e. not wired to a route. */
    unwiredToolCount: number;
  };
}

// ============================================================
// ORCHESTRATOR
// ============================================================

export class PrimaryOrchestrator {
  // -------- read the roster --------

  listAgents(): PrimaryAgent[] {
    return listPrimaryAgents();
  }

  getAgent(id: PrimaryAgentId): PrimaryAgent | undefined {
    return getPrimaryAgent(id);
  }

  // -------- routing --------

  /** Resolve a tool id to its owning agent + module. */
  resolveTool(toolId: string): ResolvedRoute | undefined {
    return resolveTool(toolId);
  }

  /** Resolve a high-level intent to the agent / module / tool that handles it. */
  resolveIntent(intent: AgentIntent): ResolvedRoute | undefined {
    const toolId = INTENT_TO_TOOL[intent];
    return toolId ? resolveTool(toolId) : undefined;
  }

  // -------- dispatch --------

  /** Invoke a tool by id, calling its API route. Returns a normalized result. */
  async dispatchTool(toolId: string, ctx: DispatchContext = {}): Promise<DispatchResult> {
    const route = resolveTool(toolId);
    if (!route) {
      return {
        ok: false,
        status: 0,
        agentId: 'attract',
        moduleId: '',
        toolId,
        error: `Unknown tool: ${toolId}`,
      };
    }

    const { agent, module, tool } = route;
    const base = { agentId: agent.id, moduleId: module.id, toolId: tool.id };

    if (!tool.endpoint) {
      return { ok: false, status: 0, ...base, error: `Tool ${tool.id} has no endpoint.` };
    }

    const method = (tool.method || 'GET').toUpperCase();
    const url = this.buildUrl(tool.endpoint, ctx, method);

    const init: RequestInit = { method, ...ctx.init };
    if (method !== 'GET' && method !== 'DELETE') {
      init.headers = { 'Content-Type': 'application/json', ...(ctx.init?.headers || {}) };
      init.body = JSON.stringify({
        ...(ctx.businessId ? { businessId: ctx.businessId } : {}),
        ...(ctx.payload || {}),
      });
    }

    try {
      const res = await fetch(url, init);
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        const error =
          (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : null) || `Request failed (${res.status}).`;
        return { ok: false, status: res.status, ...base, data, error };
      }
      return { ok: true, status: res.status, ...base, data };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        ...base,
        error: e instanceof Error ? e.message : 'Network error.',
      };
    }
  }

  /** Dispatch by intent rather than tool id. */
  async dispatchIntent(intent: AgentIntent, ctx: DispatchContext = {}): Promise<DispatchResult> {
    const toolId = INTENT_TO_TOOL[intent];
    if (!toolId) {
      return {
        ok: false,
        status: 0,
        agentId: 'attract',
        moduleId: '',
        toolId: intent,
        error: `Unknown intent: ${intent}`,
      };
    }
    return this.dispatchTool(toolId, ctx);
  }

  // -------- reporting --------

  /** Readiness snapshot for a single agent. */
  getReadinessFor(id: PrimaryAgentId): AgentReadiness | undefined {
    const agent = getPrimaryAgent(id);
    return agent ? toAgentReadiness(agent) : undefined;
  }

  /** Readiness snapshot for all three agents + a roll-up summary. */
  getReadiness(): OrchestratorReadiness {
    const agents = PRIMARY_AGENTS.map(toAgentReadiness);
    const summary = agents.reduce(
      (acc, a) => {
        acc.moduleCount += a.moduleCount;
        acc.toolCount += a.toolCount;
        acc.runnableToolCount += a.runnableToolCount;
        for (const m of a.modules) for (const t of m.tools) if (!t.wired) acc.unwiredToolCount += 1;
        return acc;
      },
      { agentCount: agents.length, moduleCount: 0, toolCount: 0, runnableToolCount: 0, unwiredToolCount: 0 },
    );
    return { agents, summary };
  }

  // -------- internals --------

  private buildUrl(endpoint: string, ctx: DispatchContext, method: string): string {
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    const base = ctx.baseUrl?.replace(/\/$/, '') || '';
    let url = isAbsolute ? endpoint : `${base}${endpoint}`;

    if (method === 'GET' || method === 'DELETE') {
      const params = new URLSearchParams(ctx.query || {});
      if (ctx.businessId) params.set('businessId', ctx.businessId);
      const qs = params.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return url;
  }
}

function toAgentReadiness(agent: PrimaryAgent): AgentReadiness {
  const modules: ModuleReadiness[] = agent.modules.map((m) => ({
    id: m.id,
    name: m.name,
    adminPath: m.adminPath,
    tools: m.tools.map((t) => ({
      id: t.id,
      name: t.name,
      endpoint: t.endpoint,
      method: t.method,
      runnable: !!t.action,
      wired: !!t.endpoint,
    })),
  }));
  const toolCount = modules.reduce((n, m) => n + m.tools.length, 0);
  const runnableToolCount = modules.reduce(
    (n, m) => n + m.tools.filter((t) => t.runnable).length,
    0,
  );
  return {
    id: agent.id,
    name: agent.name,
    tagline: agent.tagline,
    moduleCount: modules.length,
    toolCount,
    runnableToolCount,
    modules,
  };
}

// ============================================================
// SINGLETON
// ============================================================

let instance: PrimaryOrchestrator | null = null;

export function getPrimaryOrchestrator(): PrimaryOrchestrator {
  if (!instance) instance = new PrimaryOrchestrator();
  return instance;
}

export default PrimaryOrchestrator;

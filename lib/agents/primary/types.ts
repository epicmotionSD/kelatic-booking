// Primary Agents — type definitions.
//
// The owner interacts with exactly THREE primary agents: Attract, Retain, Serve.
// Each primary agent owns a set of MODULES; each module exposes one or more
// TOOLS (callable capabilities, usually backed by an API route). The previous
// functional agents (marketing, scheduling, retention, support) and Trinity
// content are now modules under these three.

export type PrimaryAgentId = 'attract' | 'retain' | 'serve';

export interface AgentTool {
  /** Stable tool id, e.g. 'content.generate'. */
  id: string;
  name: string;
  description?: string;
  /** API route that exposes this tool, if any. */
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** If set, this tool can be run inline from the agent UI. */
  action?:
    | 'generate-content'
    | 'generate-campaign'
    | 'find-gaps'
    | 'ghost-clients'
    | 'view-tickets'
    | 'knowledge-search'
    | 'support-chat';
}

export interface AgentModule {
  /** Stable module id, e.g. 'content'. */
  id: string;
  name: string;
  description: string;
  /** Lucide icon name (string) for UI. */
  icon: string;
  /** Owner-facing admin page for this module, if any. */
  adminPath?: string;
  tools: AgentTool[];
}

export interface PrimaryAgent {
  id: PrimaryAgentId;
  /** Owner-facing display name. */
  name: string;
  tagline: string;
  description: string;
  icon: string;
  /** Brand accent color (hex) for UI. */
  color: string;
  modules: AgentModule[];
}

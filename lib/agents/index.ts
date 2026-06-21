// Agent system for x3o.ai
//
// The PRIMARY model is the three owner-facing agents — Attract, Retain, Serve —
// coordinated by the PrimaryOrchestrator (lib/agents/primary). The legacy
// Board-of-Directors model (CEO / CTO / CMO / CFO) below is retained for the
// command-center only.

// --- Primary agents: Attract / Retain / Serve (current model) ---
export * from './primary';

// --- Legacy Board of Directors (command-center only) ---
export * from './types';
export * from './service';
export * from './orchestrator';

// Re-export commonly used items
export { getAgentService, AgentService } from './service';
export { getOrchestrator } from './orchestrator';
export { getPrimaryOrchestrator, PrimaryOrchestrator } from './primary';

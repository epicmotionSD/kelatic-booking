// Primary Agents — public entry point.
// The owner interacts with three agents: Attract, Retain, Serve.

export * from './types';
export {
  PRIMARY_AGENTS,
  listPrimaryAgents,
  getPrimaryAgent,
  getModule,
  resolveTool,
} from './registry';
export {
  PrimaryOrchestrator,
  getPrimaryOrchestrator,
} from './orchestrator';
export type {
  AgentIntent,
  ResolvedRoute,
  DispatchContext,
  DispatchResult,
  ToolReadiness,
  ModuleReadiness,
  AgentReadiness,
  OrchestratorReadiness,
} from './orchestrator';

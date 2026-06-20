import { listPrimaryAgents, getPrimaryOrchestrator } from '@/lib/agents/primary';
import AgentsBoard from '@/components/agents/agents-board';

// Server component: reads the primary-agent registry + the orchestrator's
// readiness snapshot, and hands plain data to the client board (keeps
// server-only agent code out of the browser). The same readiness payload is
// served by GET /api/a
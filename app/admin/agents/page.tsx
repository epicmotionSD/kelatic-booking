import { listPrimaryAgents } from '@/lib/agents/primary';
import AgentsBoard from '@/components/agents/agents-board';

// Server component: reads the primary-agent registry and hands plain data
// to the client board (keeps server-only agent code out of the browser).
export default function AgentsPage() {
  const agents = listPrimaryAgents();
  return <AgentsBoard agents={agents} />;
}

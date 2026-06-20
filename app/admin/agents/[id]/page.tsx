import { notFound } from 'next/navigation';
import { getPrimaryAgent } from '@/lib/agents/primary';
import type { PrimaryAgentId } from '@/lib/agents/primary/types';
import { getTenantContext } from '@/lib/tenant/server';
import AgentDetail from '@/components/agents/agent-detail';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getPrimaryAgent(id as PrimaryAgentId);
  if (!agent) notFound();

  // Best-effort tenant resolution so campaign tools can pass a businessId.
  let businessId: string | null = null;
  try {
    const ctx = await getTenantContext();
    businessId = ctx?.business?.id ?? null;
  } catch {
    businessId = null;
  }

  return <AgentDetail agent={agent} businessId={businessId} />;
}

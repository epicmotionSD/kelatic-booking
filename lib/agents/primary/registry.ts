// Primary Agent Registry — the single source of truth for the THREE
// owner-facing agents and the modules/tools assigned to each.
//
// Grouping (Attract / Retain / Serve):
//   ATTRACT — get customers:  Content Studio (Trinity) + Campaigns
//   RETAIN  — keep & rebook:   Win-Back (retention) + Rebooking & Scheduling
//   SERVE   — look after them:  Client Support + Reminders & Notifications
//
// The old functional agents (marketing, scheduling, retention, support) and
// Trinity content are now MODULES under these three agents.

import type { PrimaryAgent, PrimaryAgentId, AgentModule } from './types';
import { contentModuleManifest } from '@/lib/agents/modules/content';

// Content Studio module reuses the manifest exported by the content module,
// adapted to the mutable AgentModule shape.
const contentModule: AgentModule = {
  id: contentModuleManifest.id,
  name: contentModuleManifest.name,
  description: contentModuleManifest.description,
  icon: contentModuleManifest.icon,
  adminPath: contentModuleManifest.adminPath,
  tools: contentModuleManifest.tools.map((t) => ({ ...t })),
};

export const PRIMARY_AGENTS: PrimaryAgent[] = [
  {
    id: 'attract',
    name: 'Attract',
    tagline: 'Fills the top of your funnel.',
    description: 'Creates your content and runs the campaigns that bring new and returning customers in.',
    icon: 'megaphone',
    color: '#7c3aed',
    modules: [
      contentModule,
      {
        id: 'campaigns',
        name: 'Campaigns',
        description: 'Plan, generate, schedule, and measure email / SMS / social campaigns.',
        icon: 'send',
        adminPath: '/admin/trinity/marketing',
        tools: [
          { id: 'campaigns.generate', name: 'Generate campaign', endpoint: '/api/agents/marketing/generate', method: 'POST', action: 'generate-campaign' },
          { id: 'campaigns.create', name: 'Create campaign', endpoint: '/api/agents/marketing/campaigns', method: 'POST' },
          { id: 'campaigns.calendar', name: 'Marketing calendar', endpoint: '/api/agents/marketing/calendar', method: 'GET' },
          { id: 'campaigns.schedule', name: 'Schedule posts', endpoint: '/api/agents/marketing/schedule', method: 'POST' },
          { id: 'campaigns.analytics', name: 'Campaign analytics', endpoint: '/api/agents/marketing/analytics', method: 'GET' },
        ],
      },
    ],
  },
  {
    id: 'retain',
    name: 'Retain',
    tagline: 'Brings customers back.',
    description: 'Wins back customers who drifted away and keeps your calendar full with rebookings.',
    icon: 'repeat',
    color: '#0d9488',
    modules: [
      {
        id: 'winback',
        name: 'Win-Back',
        description: 'Detect quiet / ghost clients and run personalized reactivation sequences.',
        icon: 'user-round-check',
        adminPath: '/admin/clients',
        tools: [
          { id: 'winback.analyze', name: 'Analyze ghost clients', endpoint: '/api/reactivation/analyze', method: 'POST' },
          { id: 'winback.ghostClients', name: 'List ghost clients', endpoint: '/api/reactivation/ghost-clients', method: 'GET', action: 'ghost-clients' },
          { id: 'winback.launch', name: 'Launch win-back', endpoint: '/api/reactivation/launch', method: 'POST' },
        ],
      },
      {
        id: 'scheduling',
        name: 'Rebooking & Scheduling',
        description: 'Find and fill open slots, predict demand, and reduce no-shows.',
        icon: 'calendar-clock',
        adminPath: '/admin/appointments',
        tools: [
          { id: 'scheduling.gaps', name: 'Find calendar gaps', endpoint: '/api/agents/scheduling/gaps', method: 'GET', action: 'find-gaps' },
          { id: 'scheduling.predictions', name: 'Demand predictions', endpoint: '/api/agents/scheduling/predictions', method: 'GET' },
        ],
      },
    ],
  },
  {
    id: 'serve',
    name: 'Serve',
    tagline: 'Looks after your customers.',
    description: 'Answers questions around the clock and keeps everyone informed with timely reminders.',
    icon: 'heart-handshake',
    color: '#2563eb',
    modules: [
      {
        id: 'support',
        name: 'Client Support',
        description: 'Answer client questions and handle requests from your knowledge base.',
        icon: 'message-circle',
        tools: [
          { id: 'support.chat', name: 'Support chat', endpoint: '/api/agents/support/chat', method: 'POST', action: 'support-chat' },
          { id: 'support.tickets', name: 'Support tickets', endpoint: '/api/agents/support/tickets', method: 'GET', action: 'view-tickets' },
          { id: 'support.knowledge', name: 'Knowledge base', endpoint: '/api/agents/support/knowledge', method: 'GET', action: 'knowledge-search' },
        ],
      },
      {
        id: 'reminders',
        name: 'Reminders & Notifications',
        description: 'Appointment reminders and customer notifications across email and SMS.',
        icon: 'bell',
        adminPath: '/admin/notifications',
        tools: [
          { id: 'reminders.run', name: 'Send reminders', endpoint: '/api/cron/reminders', method: 'POST' },
          { id: 'reminders.preferences', name: 'Notification preferences', endpoint: '/api/notifications/preferences', method: 'GET' },
        ],
      },
    ],
  },
];

// ============================================================
// ACCESSORS
// ============================================================

export function listPrimaryAgents(): PrimaryAgent[] {
  return PRIMARY_AGENTS;
}

export function getPrimaryAgent(id: PrimaryAgentId): PrimaryAgent | undefined {
  return PRIMARY_AGENTS.find((a) => a.id === id);
}

export function getModule(moduleId: string): { agent: PrimaryAgent; module: AgentModule } | undefined {
  for (const agent of PRIMARY_AGENTS) {
    const module = agent.modules.find((m) => m.id === moduleId);
    if (module) return { agent, module };
  }
  return undefined;
}

/** Find which primary agent + module a tool id belongs to. */
export function resolveTool(toolId: string) {
  for (const agent of PRIMARY_AGENTS) {
    for (const module of agent.modules) {
      const tool = module.tools.find((t) => t.id === toolId);
      if (tool) return { agent, module, tool };
    }
  }
  return undefined;
}

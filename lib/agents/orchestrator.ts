// Agent Orchestrator - Manages the Board of Directors
// Coordinates all agents: CEO (Atlas), CTO (Nova), CMO (Pulse), CFO (Apex)

import { AgentService, getAgentService } from './service';
import type {
  Agent,
  AgentRole,
  AgentStatus,
  AgentTask,
  AgentDecision,
  OrchestratorStatus,
  TaskPriority,
} from './types';

export interface OrchestratorConfig {
  autoStart?: boolean;
  enableLogging?: boolean;
}

class AgentOrchestrator {
  private agentService: AgentService;
  private config: OrchestratorConfig;
  private isRunning: boolean = false;
  private startedAt: Date | null = null;
  private agents: Map<AgentRole, Agent> = new Map();

  constructor(config: OrchestratorConfig = {}) {
    this.agentService = getAgentService();
    this.config = {
      autoStart: false,
      enableLogging: true,
      ...config,
    };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    this.log('Initializing Board of Directors...');

    try {
      // Load all agents from database
      const agents = await this.agentService.getAllAgents();

      for (const agent of agents) {
        if (['ceo', 'cto', 'cmo', 'cfo'].includes(agent.role)) {
          this.agents.set(agent.role as AgentRole, agent);
          this.log(`  ${this.getAgentEmoji(agent.role as AgentRole)} ${agent.name} loaded`);
        }
      }

      this.log('Board of Directors initialized successfully');

      if (this.config.autoStart) {
        await this.startAll();
      }
    } catch (error) {
      this.log(`Initialization failed: ${error}`, 'error');
      throw error;
    }
  }

  // ============================================
  // LIFECYCLE MANAGEMENT
  // ============================================

  async startAll(): Promise<void> {
    if (this.isRunning) {
      this.log('Orchestrator already running');
      return;
    }

    this.log('Starting all agents...');
    this.isRunning = true;
    this.startedAt = new Date();

    const startOrder: AgentRole[] = ['ceo', 'cto', 'cmo', 'cfo'];

    for (const role of startOrder) {
      const agent = this.agents.get(role);
      if (agent) {
        await this.agentService.startAgent(agent.id);
        this.log(`  ${this.getAgentEmoji(role)} ${agent.name} started`);
      }
    }

    this.log('All agents started');
  }

  async stopAll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.log('Stopping all agents...');

    const stopOrder: AgentRole[] = ['cfo', 'cmo', 'cto', 'ceo'];

    for (const role of stopOrder) {
      const agent = this.agents.get(role);
      if (agent) {
        await this.agentService.stopAgent(agent.id);
        this.log(`  ${this.getAgentEmoji(role)} ${agent.name} stopped`);
      }
    }

    this.isRunning = false;
    this.startedAt = null;
    this.log('All agents stopped');
  }

  async startAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await this.agentService.startAgent(agent.id);
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} started`);
  }

  async stopAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await this.agentService.stopAgent(agent.id);
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} stopped`);
  }

  // ============================================
  // STATUS & MONITORING
  // ============================================

  async getStatus(): Promise<OrchestratorStatus> {
    const agents = await this.agentService.getAllAgents();
    const boardMembers = agents.filter(a => ['ceo', 'cto', 'cmo', 'cfo'].includes(a.role));

    let activeCount = 0;
    let idleCount = 0;
    let errorCount = 0;
    let totalTasksCompleted = 0;

    const agentInfos = boardMembers.map(agent => {
      if (agent.status === 'active') activeCount++;
      else if (agent.status === 'idle') idleCount++;
      else if (agent.status === 'error') errorCount++;

      totalTasksCompleted += agent.metrics.tasksCompleted;

      return {
        role: agent.role as AgentRole,
        name: agent.name,
        status: agent.status,
        metrics: agent.metrics,
        lastActiveAt: agent.lastActiveAt || null,
      };
    });

    const pendingTasks = await this.agentService.getPendingTasksCount();

    return {
      isRunning: this.isRunning,
      startedAt: this.startedAt,
      agents: agentInfos,
      summary: {
        totalAgents: boardMembers.length,
        activeAgents: activeCount,
        idleAgents: idleCount,
        errorAgents: errorCount,
        totalTasksCompleted,
        totalTasksPending: pendingTasks,
      },
    };
  }

  // ============================================
  // TASK DELEGATION
  // ============================================

  async sendTaskToAgent(
    fromRole: AgentRole | null,
    toRole: AgentRole,
    taskType: string,
    title: string,
    payload: Record<string, any>,
    options?: {
      description?: string;
      priority?: TaskPriority;
    }
  ): Promise<AgentTask> {
    const toAgent = this.agents.get(toRole);
    const fromAgent = fromRole ? this.agents.get(fromRole) : null;

    if (!toAgent) {
      throw new Error(`Target agent '${toRole}' not found`);
    }

    const task = await this.agentService.createTask({
      fromAgentId: fromAgent?.id || null,
      toAgentId: toAgent.id,
      taskType,
      title,
      description: options?.description,
      payload,
      priority: options?.priority || 'medium',
      status: 'pending',
    });

    this.log(`Task created: ${title} -> ${toRole.toUpperCase()}`);
    return task;
  }

  async broadcastTask(
    taskType: string,
    title: string,
    payload: Record<string, any>
  ): Promise<void> {
    const roles: AgentRole[] = ['ceo', 'cto', 'cmo', 'cfo'];

    for (const role of roles) {
      await this.sendTaskToAgent(null, role, taskType, title, payload);
    }
  }

  // ============================================
  // COMMAND CENTER
  // ============================================

  async getCommandCenterSummary(): Promise<{
    orchestrator: OrchestratorStatus;
    recentDecisions: AgentDecision[];
    activeAlerts: any[];
    pendingApprovals: AgentDecision[];
  }> {
    const [status, recentDecisions, activeAlerts, pendingApprovals] = await Promise.all([
      this.getStatus(),
      this.agentService.getRecentDecisions(10),
      this.agentService.getActiveAlerts(),
      this.agentService.getPendingDecisions(),
    ]);

    return {
      orchestrator: status,
      recentDecisions,
      activeAlerts,
      pendingApprovals,
    };
  }

  async approveDecision(decisionId: string, approvedBy: string): Promise<void> {
    await this.agentService.approveDecision(decisionId, approvedBy);
    this.log(`Decision ${decisionId} approved by ${approvedBy}`);
  }

  async rejectDecision(decisionId: string, rejectedBy: string, reason: string): Promise<void> {
    await this.agentService.rejectDecision(decisionId, rejectedBy, reason);
    this.log(`Decision ${decisionId} rejected by ${rejectedBy}`);
  }

  // ============================================
  // STRATEGIC ACTIONS
  // ============================================

  async analyzeGrowthOpportunity(data: {
    keyword?: string;
    segment?: string;
    source?: string;
  }): Promise<void> {
    // CEO analyzes and delegates
    await this.sendTaskToAgent(
      null,
      'ceo',
      'analyze_opportunity',
      `Analyze growth opportunity: ${data.keyword || data.segment}`,
      data,
      { priority: 'high' }
    );
  }

  async initiateAgencyOnboarding(agencyData: {
    name: string;
    email: string;
    plan: string;
  }): Promise<void> {
    // Coordinate onboarding across agents
    await this.sendTaskToAgent(
      'ceo',
      'cto',
      'provision_tenant',
      `Provision tenant: ${agencyData.name}`,
      agencyData,
      { priority: 'high' }
    );

    await this.sendTaskToAgent(
      'ceo',
      'cmo',
      'welcome_sequence',
      `Start welcome sequence: ${agencyData.name}`,
      agencyData,
      { priority: 'medium' }
    );

    await this.sendTaskToAgent(
      'ceo',
      'cfo',
      'setup_billing',
      `Setup billing: ${agencyData.name}`,
      agencyData,
      { priority: 'high' }
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = '[Orchestrator]';

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`);
        break;
      default:
        console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  private getAgentEmoji(role: AgentRole): string {
    const emojis: Record<AgentRole, string> = {
      ceo: '🎯',
      cto: '🔧',
      cmo: '📈',
      cfo: '💰',
    };
    return emojis[role] || '🤖';
  }

  getAgent(role: AgentRole): Agent | undefined {
    return this.agents.get(role);
  }
}

// Singleton
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(config?: OrchestratorConfig): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator(config);
  }
  return orchestratorInstance;
}

export default AgentOrchestrator;

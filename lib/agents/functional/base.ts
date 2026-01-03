// Base Functional Agent Class
// All functional agents (Marketing, Scheduling, Retention, Support) extend this

import { createAdminClient } from '@/lib/supabase/client';
import Anthropic from '@anthropic-ai/sdk';
import type {
  FunctionalAgentType,
  FunctionalAgentTask,
  AgentExecutionResult,
} from './types';

export interface AgentContext {
  businessId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseFunctionalAgent {
  protected supabase: ReturnType<typeof createAdminClient>;
  protected anthropic: Anthropic | null = null;
  protected businessId: string;
  protected agentType: FunctionalAgentType;

  constructor(businessId: string, agentType: FunctionalAgentType) {
    this.businessId = businessId;
    this.agentType = agentType;
    this.supabase = createAdminClient();

    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  // ============================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // ============================================

  /**
   * Execute the main agent task
   */
  abstract execute(task: FunctionalAgentTask): Promise<AgentExecutionResult>;

  /**
   * Get the system prompt for this agent
   */
  abstract getSystemPrompt(): string;

  /**
   * Get available tools/actions for this agent
   */
  abstract getAvailableActions(): string[];

  // ============================================
  // SHARED METHODS
  // ============================================

  /**
   * Create a new agent task
   */
  async createTask(
    taskType: string,
    input: Record<string, any>
  ): Promise<FunctionalAgentTask> {
    const { data, error } = await this.supabase
      .from('functional_agent_tasks')
      .insert({
        agent_type: this.agentType,
        business_id: this.businessId,
        task_type: taskType,
        input,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskRow(data);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: FunctionalAgentTask['status'],
    output?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const updates: Record<string, any> = { status };

    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    if (output) {
      updates.output = output;
    }

    if (error) {
      updates.error = error;
    }

    const { error: updateError } = await this.supabase
      .from('functional_agent_tasks')
      .update(updates)
      .eq('id', taskId);

    if (updateError) throw updateError;
  }

  /**
   * Log agent activity for monitoring
   */
  async logActivity(
    action: string,
    details: Record<string, any>,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    await this.supabase.from('agent_activity_log').insert({
      agent_type: this.agentType,
      business_id: this.businessId,
      action,
      details,
      severity,
    });
  }

  /**
   * Create an alert for the Board of Directors
   */
  async createAlert(
    alertType: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    data?: Record<string, any>
  ): Promise<void> {
    await this.supabase.from('agent_alerts').insert({
      agent_id: null, // Functional agents don't have board-level IDs
      alert_type: `${this.agentType}_${alertType}`,
      severity,
      title,
      message,
      data: {
        ...data,
        businessId: this.businessId,
        agentType: this.agentType,
      },
    });
  }

  /**
   * Report to the Board of Directors (create a decision for review)
   */
  async reportToBoard(
    decisionType: string,
    title: string,
    description: string,
    reasoning: string,
    impact: 'low' | 'medium' | 'high' | 'critical',
    data: Record<string, any>,
    confidence: number = 0.8
  ): Promise<void> {
    await this.supabase.from('agent_decisions').insert({
      agent_id: null, // Will be assigned to CMO for marketing, etc.
      agent_role: this.getBoardRole(),
      decision_type: decisionType,
      title,
      description,
      reasoning,
      data: {
        ...data,
        businessId: this.businessId,
        agentType: this.agentType,
      },
      confidence,
      impact,
      approved: false,
    });
  }

  /**
   * Call AI for intelligent processing
   */
  protected async callAI(
    prompt: string,
    context?: string
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const systemPrompt = this.getSystemPrompt();
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || '';
  }

  /**
   * Get business context for AI calls
   */
  protected async getBusinessContext(): Promise<string> {
    const { data: business } = await this.supabase
      .from('businesses')
      .select('name, settings, industry, plan')
      .eq('id', this.businessId)
      .single();

    if (!business) {
      return 'Business context not available.';
    }

    return `Business: ${business.name}
Industry: ${business.industry || 'Beauty & Wellness'}
Plan: ${business.plan || 'professional'}`;
  }

  /**
   * Get the board role this agent reports to
   */
  private getBoardRole(): string {
    const roleMap: Record<FunctionalAgentType, string> = {
      marketing: 'cmo',
      scheduling: 'cto',
      retention: 'cmo',
      support: 'cto',
    };
    return roleMap[this.agentType];
  }

  /**
   * Map database row to task type
   */
  private mapTaskRow(row: any): FunctionalAgentTask {
    return {
      id: row.id,
      agentType: row.agent_type,
      businessId: row.business_id,
      taskType: row.task_type,
      input: row.input || {},
      output: row.output,
      status: row.status,
      error: row.error,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
}

/**
 * Factory function to create agent instances
 */
export function createFunctionalAgent(
  businessId: string,
  agentType: FunctionalAgentType
): BaseFunctionalAgent {
  // Import dynamically to avoid circular dependencies
  switch (agentType) {
    case 'marketing':
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MarketingAgent } = require('./marketing/service');
      return new MarketingAgent(businessId);
    case 'scheduling':
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SchedulingAgent } = require('./scheduling/service');
      return new SchedulingAgent(businessId);
    case 'retention':
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { RetentionAgent } = require('./retention/service');
      return new RetentionAgent(businessId);
    case 'support':
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SupportAgent } = require('./support/service');
      return new SupportAgent(businessId);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

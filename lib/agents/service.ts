// Agent Service - Core orchestration for Board of Directors
// Manages agent lifecycle, task routing, and inter-agent communication

import { createAdminClient } from '@/lib/supabase/client';
import type {
  Agent,
  AgentRole,
  AgentStatus,
  AgentTask,
  AgentDecision,
  AgentAlert,
  TaskStatus,
  TaskPriority,
  DecisionType,
  CommandCenterSummary,
  AgentMetrics,
} from './types';

export class AgentService {
  private supabase: ReturnType<typeof createAdminClient>;

  constructor() {
    this.supabase = createAdminClient();
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  async getAllAgents(): Promise<Agent[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .order('role');

    if (error) throw error;
    return (data || []).map(this.mapAgentRow);
  }

  async getAgentByRole(role: AgentRole): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('role', role)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapAgentRow(data) : null;
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapAgentRow(data) : null;
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    const { error } = await this.supabase
      .from('agents')
      .update({
        status,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (error) throw error;
  }

  async startAgent(agentId: string): Promise<void> {
    await this.updateAgentStatus(agentId, 'active');

    // Create a new session
    const { error } = await this.supabase
      .from('agent_sessions')
      .insert({ agent_id: agentId });

    if (error) throw error;
  }

  async stopAgent(agentId: string): Promise<void> {
    await this.updateAgentStatus(agentId, 'idle');

    // End current session
    const { error } = await this.supabase
      .from('agent_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('agent_id', agentId)
      .is('ended_at', null);

    if (error) throw error;
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  async createTask(task: Omit<AgentTask, 'id' | 'createdAt'>): Promise<AgentTask> {
    const { data, error } = await this.supabase
      .from('agent_tasks')
      .insert({
        from_agent_id: task.fromAgentId,
        to_agent_id: task.toAgentId,
        task_type: task.taskType,
        title: task.title,
        description: task.description,
        payload: task.payload,
        priority: task.priority,
        status: task.status || 'pending',
        deadline: task.deadline?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskRow(data);
  }

  async getTasksForAgent(agentId: string, status?: TaskStatus): Promise<AgentTask[]> {
    let query = this.supabase
      .from('agent_tasks')
      .select('*')
      .eq('to_agent_id', agentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapTaskRow);
  }

  async getPendingTasks(): Promise<AgentTask[]> {
    const { data, error } = await this.supabase
      .from('agent_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapTaskRow);
  }

  async getPendingTasksCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('agent_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    result?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const updates: Record<string, any> = { status };

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    if (result) {
      updates.result = result;
    }

    if (error) {
      updates.error = error;
    }

    const { error: updateError } = await this.supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', taskId);

    if (updateError) throw updateError;
  }

  // ============================================
  // DECISION MANAGEMENT
  // ============================================

  async createDecision(decision: Omit<AgentDecision, 'id' | 'createdAt'>): Promise<AgentDecision> {
    const { data, error } = await this.supabase
      .from('agent_decisions')
      .insert({
        agent_id: decision.agentId,
        agent_role: decision.agentRole,
        decision_type: decision.decisionType,
        title: decision.title,
        description: decision.description,
        reasoning: decision.reasoning,
        data: decision.data,
        confidence: decision.confidence,
        impact: decision.impact,
        approved: decision.approved,
        approved_by: decision.approvedBy,
        executed_at: decision.executedAt?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDecisionRow(data);
  }

  async getRecentDecisions(limit: number = 20): Promise<AgentDecision[]> {
    const { data, error } = await this.supabase
      .from('agent_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapDecisionRow);
  }

  async getPendingDecisions(): Promise<AgentDecision[]> {
    const { data, error } = await this.supabase
      .from('agent_decisions')
      .select('*')
      .eq('approved', false)
      .order('impact', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapDecisionRow);
  }

  async approveDecision(decisionId: string, approvedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from('agent_decisions')
      .update({
        approved: true,
        approved_by: approvedBy,
        executed_at: new Date().toISOString(),
      })
      .eq('id', decisionId);

    if (error) throw error;
  }

  async rejectDecision(decisionId: string, rejectedBy: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('agent_decisions')
      .update({
        approved: false,
        approved_by: rejectedBy,
        rejected_reason: reason,
      })
      .eq('id', decisionId);

    if (error) throw error;
  }

  // ============================================
  // ALERTS
  // ============================================

  async createAlert(alert: Omit<AgentAlert, 'id' | 'createdAt'>): Promise<AgentAlert> {
    const { data, error } = await this.supabase
      .from('agent_alerts')
      .insert({
        agent_id: alert.agentId,
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        data: alert.data,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapAlertRow(data);
  }

  async getActiveAlerts(): Promise<AgentAlert[]> {
    const { data, error } = await this.supabase
      .from('agent_alerts')
      .select('*')
      .eq('resolved', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(this.mapAlertRow);
  }

  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
    const { error } = await this.supabase
      .from('agent_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: notes,
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  // ============================================
  // COMMAND CENTER SUMMARY
  // ============================================

  async getCommandCenterSummary(): Promise<CommandCenterSummary> {
    // Get counts in parallel
    const [
      agents,
      pendingTasks,
      pendingDecisions,
      activeAlerts,
      decisionsToday,
      businesses,
    ] = await Promise.all([
      this.supabase.from('agents').select('status'),
      this.supabase.from('agent_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      this.supabase.from('agent_decisions').select('*', { count: 'exact', head: true }).eq('approved', false),
      this.supabase.from('agent_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
      this.supabase.from('agent_decisions').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      this.supabase.from('businesses').select('plan, is_active, created_at'),
    ]);

    const activeAgents = (agents.data || []).filter(a => a.status === 'active').length;
    const allBusinesses = businesses.data || [];
    const activeBusinesses = allBusinesses.filter(b => b.is_active);
    const today = new Date().toISOString().split('T')[0];
    const newToday = allBusinesses.filter(b => b.created_at?.startsWith(today)).length;

    // Calculate MRR
    const mrr = activeBusinesses.reduce((sum, b) => {
      switch (b.plan) {
        case 'starter': return sum + 97;
        case 'professional': return sum + 297;
        case 'enterprise': return sum + 997;
        default: return sum;
      }
    }, 0);

    return {
      activeAgents,
      pendingTasks: pendingTasks.count || 0,
      pendingDecisions: pendingDecisions.count || 0,
      activeAlerts: activeAlerts.count || 0,
      decisionsToday: decisionsToday.count || 0,
      totalBusinesses: activeBusinesses.length,
      newBusinessesToday: newToday,
      monthlyMrr: mrr,
    };
  }

  // ============================================
  // BOARD MEMBERS
  // ============================================

  async getBoardMembers(): Promise<any[]> {
    const agents = await this.getAllAgents();

    return agents
      .filter(a => ['ceo', 'cto', 'cmo', 'cfo'].includes(a.role))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        title: this.getRoleTitle(agent.role),
        status: agent.status,
        avatar: agent.avatar,
        currentTask: null,
        metrics: agent.metrics,
      }));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getRoleTitle(role: AgentRole): string {
    const titles: Record<AgentRole, string> = {
      ceo: 'Chief Executive Officer',
      cto: 'Chief Technology Officer',
      cmo: 'Chief Marketing Officer',
      cfo: 'Chief Financial Officer',
    };
    return titles[role] || role;
  }

  private mapAgentRow(row: any): Agent {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      description: row.description,
      avatar: row.avatar,
      status: row.status,
      capabilities: row.capabilities || [],
      permissions: row.permissions || {},
      manifest: row.manifest || {},
      metrics: {
        tasksCompleted: parseInt(row.tasks_completed) || 0,
        tasksInProgress: parseInt(row.tasks_in_progress) || 0,
        tasksFailed: parseInt(row.tasks_failed) || 0,
        avgResponseTime: parseFloat(row.avg_response_time) || 0,
        successRate: parseFloat(row.success_rate) || 0,
      },
      lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTaskRow(row: any): AgentTask {
    return {
      id: row.id,
      fromAgentId: row.from_agent_id,
      toAgentId: row.to_agent_id,
      taskType: row.task_type,
      title: row.title,
      description: row.description,
      payload: row.payload || {},
      priority: row.priority,
      status: row.status,
      result: row.result,
      error: row.error,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }

  private mapDecisionRow(row: any): AgentDecision {
    return {
      id: row.id,
      agentId: row.agent_id,
      agentRole: row.agent_role,
      decisionType: row.decision_type,
      title: row.title,
      description: row.description,
      reasoning: row.reasoning,
      data: row.data || {},
      confidence: parseFloat(row.confidence) || 0,
      impact: row.impact,
      approved: row.approved,
      approvedBy: row.approved_by,
      executedAt: row.executed_at ? new Date(row.executed_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private mapAlertRow(row: any): AgentAlert {
    return {
      id: row.id,
      agentId: row.agent_id,
      alertType: row.alert_type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      data: row.data || {},
      resolved: row.resolved,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by,
      resolutionNotes: row.resolution_notes,
      createdAt: new Date(row.created_at),
    };
  }
}

// Singleton instance
let serviceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!serviceInstance) {
    serviceInstance = new AgentService();
  }
  return serviceInstance;
}

export default AgentService;

// Board of Directors - Type Definitions for x3o.ai Agent System

export type AgentRole = 'ceo' | 'cto' | 'cmo' | 'cfo';
export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DecisionType =
  | 'deploy_template'
  | 'adjust_budget'
  | 'create_campaign'
  | 'onboard_agency'
  | 'recommend_action'
  | 'escalate_to_human'
  | 'optimize_pricing'
  | 'feature_rollout';

export interface AgentPermissions {
  canDeploy: boolean;
  canModifyBudget: boolean;
  canAccessStripe: boolean;
  canAccessAnalytics: boolean;
  canCreateTasks: boolean;
  canApproveDecisions: boolean;
  maxBudgetLimit: number;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  avgResponseTime: number;
  successRate: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatar: string;
  status: AgentStatus;
  capabilities: string[];
  permissions: AgentPermissions;
  manifest: Record<string, any>;
  metrics: AgentMetrics;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
  fromAgentId: string | null;
  toAgentId: string;
  taskType: string;
  title: string;
  description?: string;
  payload: Record<string, any>;
  priority: TaskPriority;
  status: TaskStatus;
  result?: Record<string, any>;
  error?: string;
  deadline?: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentDecision {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  decisionType: DecisionType;
  title: string;
  description: string;
  reasoning: string;
  data: Record<string, any>;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  approved: boolean;
  approvedBy?: string;
  executedAt?: Date;
  createdAt: Date;
}

export interface AgentAlert {
  id: string;
  agentId: string | null;
  alertType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  data: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
}

export interface CommandCenterSummary {
  activeAgents: number;
  pendingTasks: number;
  pendingDecisions: number;
  activeAlerts: number;
  decisionsToday: number;
  totalBusinesses: number;
  newBusinessesToday: number;
  monthlyMrr: number;
}

export interface StrategicInitiative {
  id: string;
  title: string;
  description: string;
  objective: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'paused';
  priority: TaskPriority;
  leadAgentId: string;
  participatingAgents: string[];
  milestones: any[];
  progressPercent: number;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  startedAt: Date | null;
  agents: Array<{
    role: AgentRole;
    name: string;
    status: AgentStatus;
    metrics: AgentMetrics;
    lastActiveAt: Date | null;
  }>;
  summary: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasksCompleted: number;
    totalTasksPending: number;
  };
}

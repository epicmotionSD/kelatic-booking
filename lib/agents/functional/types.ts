// Functional Agents - Type Definitions
// These agents operate at the business/tenant level to solve real pain points

export type FunctionalAgentType = 'marketing' | 'scheduling' | 'retention' | 'support';

// ============================================
// MARKETING AGENT TYPES
// ============================================

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'email' | 'social' | 'multi_channel';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type PostPlatform = 'instagram' | 'facebook' | 'twitter' | 'email' | 'sms';

export interface MarketingCampaign {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  targetAudience?: Record<string, any>;
  goals?: Record<string, any>;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPost {
  id: string;
  businessId: string;
  campaignId?: string;
  platform: PostPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledFor: Date;
  status: PostStatus;
  publishedAt?: Date;
  engagementMetrics?: Record<string, any>;
  error?: string;
  createdAt: Date;
}

export interface ContentCalendarItem {
  id: string;
  businessId: string;
  campaignId?: string;
  title: string;
  contentType: string;
  description?: string;
  scheduledDate: Date;
  platforms: PostPlatform[];
  status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  tags?: string[];
  assignedTo?: string;
  createdAt: Date;
}

export interface CampaignAnalytics {
  id: string;
  businessId: string;
  campaignId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi?: number;
  metadata?: Record<string, any>;
}

// ============================================
// SCHEDULING AGENT TYPES
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CancellationPrediction {
  id: string;
  businessId: string;
  appointmentId: string;
  clientId: string;
  riskScore: number; // 0-1
  riskLevel: RiskLevel;
  riskFactors: string[];
  predictedAt: Date;
  actionTaken?: string;
  actionTakenAt?: Date;
  actualOutcome?: 'kept' | 'cancelled' | 'no_show' | 'rescheduled';
  createdAt: Date;
}

export interface ScheduleGap {
  id: string;
  businessId: string;
  stylistId: string;
  gapStart: Date;
  gapEnd: Date;
  durationMinutes: number;
  potentialRevenue: number;
  status: 'open' | 'offered' | 'filled' | 'expired';
  filledBy?: string;
  filledAt?: Date;
  createdAt: Date;
}

export interface ClientBookingPattern {
  id: string;
  businessId: string;
  clientId: string;
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredTimeSlots: string[]; // e.g., ['morning', 'afternoon']
  avgBookingFrequencyDays: number;
  avgLeadTimeDays: number;
  cancellationRate: number;
  noShowRate: number;
  preferredStylistId?: string;
  preferredServices: string[];
  lastUpdated: Date;
}

// ============================================
// RETENTION AGENT TYPES
// ============================================

export type HealthStatus = 'healthy' | 'at_risk' | 'churning' | 'churned' | 'new';
export type VipTier = 'standard' | 'silver' | 'gold' | 'platinum';
export type TriggerType = 'days_inactive' | 'missed_appointment' | 'birthday' | 'anniversary' | 'spend_milestone';

export interface ClientHealthScore {
  id: string;
  businessId: string;
  clientId: string;
  healthScore: number; // 0-100
  healthStatus: HealthStatus;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  churnProbability: number;
  lastVisitDaysAgo: number;
  lifetimeValue: number;
  riskFactors: string[];
  opportunities: string[];
  calculatedAt: Date;
}

export interface VipTierDefinition {
  id: string;
  businessId: string;
  tierName: VipTier;
  minSpend: number;
  minVisits: number;
  benefits: string[];
  discountPercent: number;
  priorityBooking: boolean;
  isActive: boolean;
}

export interface ClientVipStatus {
  id: string;
  businessId: string;
  clientId: string;
  currentTier: VipTier;
  tierStartDate: Date;
  tierEndDate?: Date;
  totalSpend: number;
  totalVisits: number;
  pointsBalance: number;
  nextTierProgress: number;
  promotedAt?: Date;
  demotedAt?: Date;
}

export interface RetentionCampaign {
  id: string;
  businessId: string;
  name: string;
  targetSegment: HealthStatus;
  triggerType: TriggerType;
  triggerDays?: number;
  messageTemplate: string;
  offerType?: string;
  offerValue?: number;
  isActive: boolean;
  sentCount: number;
  convertedCount: number;
  createdAt: Date;
}

export interface ReengagementTrigger {
  id: string;
  businessId: string;
  clientId: string;
  triggerType: TriggerType;
  triggeredAt: Date;
  campaignId?: string;
  messagesSent: number;
  lastMessageAt?: Date;
  responseReceived: boolean;
  convertedToBooking: boolean;
  bookingId?: string;
  status: 'pending' | 'in_progress' | 'converted' | 'failed' | 'expired';
}

// ============================================
// SUPPORT AGENT TYPES
// ============================================

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface SupportKnowledgeBase {
  id: string;
  businessId?: string; // null = platform-wide
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportConversation {
  id: string;
  businessId: string;
  userId?: string;
  sessionId: string;
  channel: 'web' | 'email' | 'sms';
  status: 'active' | 'resolved' | 'escalated';
  satisfactionRating?: number;
  resolvedByAi: boolean;
  escalatedAt?: Date;
  createdAt: Date;
  closedAt?: Date;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  businessId: string;
  conversationId?: string;
  userId?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  category?: string;
  tags?: string[];
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureDiscovery {
  id: string;
  businessId: string;
  userId?: string;
  featureName: string;
  discoveredAt: Date;
  usedAt?: Date;
  usageCount: number;
  source: 'support_chat' | 'onboarding' | 'tooltip' | 'search';
}

// ============================================
// AGENT EXECUTION TYPES
// ============================================

export interface FunctionalAgentTask {
  id: string;
  agentType: FunctionalAgentType;
  businessId: string;
  taskType: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface AgentExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

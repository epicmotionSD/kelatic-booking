// Retention Agent - Extended Types

import type {
  ClientHealthScore,
  ClientVipStatus,
  RetentionCampaign,
  ReengagementTrigger,
  HealthStatus,
  VipTier,
  TriggerType,
} from '../types';

export interface CalculateHealthInput {
  clientId: string;
}

export interface HealthScoreResult {
  clientId: string;
  healthScore: number;
  healthStatus: HealthStatus;
  rfmScores: {
    recency: number;
    frequency: number;
    monetary: number;
  };
  churnProbability: number;
  riskFactors: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface VipEvaluationResult {
  clientId: string;
  currentTier: VipTier;
  recommendedTier: VipTier;
  shouldPromote: boolean;
  shouldDemote: boolean;
  totalSpend: number;
  totalVisits: number;
  nextTierRequirements?: {
    spendNeeded: number;
    visitsNeeded: number;
  };
}

export interface RetentionRecommendation {
  type: 'outreach' | 'promotion' | 'vip_upgrade' | 'win_back';
  priority: 'low' | 'medium' | 'high' | 'critical';
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  suggestedAction: string;
  suggestedOffer?: string;
  estimatedValue: number;
}

export interface ChurnRiskSegment {
  status: HealthStatus;
  count: number;
  totalLifetimeValue: number;
  avgDaysSinceVisit: number;
  clients: Array<{
    clientId: string;
    clientName: string;
    healthScore: number;
    lastVisit?: Date;
    lifetimeValue: number;
  }>;
}

export interface ReengagementStats {
  triggerType: TriggerType;
  totalSent: number;
  totalConverted: number;
  conversionRate: number;
  revenue: number;
}

export interface RetentionDashboard {
  summary: {
    totalClients: number;
    healthyClients: number;
    atRiskClients: number;
    churningClients: number;
    churnedClients: number;
    avgHealthScore: number;
  };
  vipSummary: {
    platinum: number;
    gold: number;
    silver: number;
    standard: number;
    totalVipRevenue: number;
  };
  reengagementStats: ReengagementStats[];
  topAtRisk: Array<{
    clientId: string;
    clientName: string;
    healthScore: number;
    churnProbability: number;
    lifetimeValue: number;
  }>;
}

export interface CreateRetentionCampaignInput {
  name: string;
  targetSegment: HealthStatus;
  triggerType: TriggerType;
  triggerDays?: number;
  messageTemplate: string;
  offerType?: string;
  offerValue?: number;
}

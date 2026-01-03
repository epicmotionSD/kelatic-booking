// Client Retention Agent - Service
// Handles churn prediction, VIP management, and automated re-engagement

import { BaseFunctionalAgent } from '../base';
import type {
  FunctionalAgentTask,
  AgentExecutionResult,
  ClientHealthScore,
  ClientVipStatus,
  VipTierDefinition,
  RetentionCampaign,
  ReengagementTrigger,
  HealthStatus,
  VipTier,
  TriggerType,
} from '../types';
import type {
  HealthScoreResult,
  VipEvaluationResult,
  RetentionRecommendation,
  ChurnRiskSegment,
  RetentionDashboard,
  CreateRetentionCampaignInput,
} from './types';
import {
  RETENTION_SYSTEM_PROMPT,
  CHURN_ANALYSIS_PROMPT,
  WIN_BACK_PROMPT,
  VIP_EVALUATION_PROMPT,
} from './prompts';

export class RetentionAgent extends BaseFunctionalAgent {
  constructor(businessId: string) {
    super(businessId, 'retention');
  }

  getSystemPrompt(): string {
    return RETENTION_SYSTEM_PROMPT;
  }

  getAvailableActions(): string[] {
    return [
      'calculate_health',
      'calculate_all_health',
      'evaluate_vip',
      'check_triggers',
      'create_campaign',
      'get_at_risk',
      'get_recommendations',
      'get_dashboard',
    ];
  }

  async execute(task: FunctionalAgentTask): Promise<AgentExecutionResult> {
    await this.updateTaskStatus(task.id, 'running');

    try {
      let result: any;

      switch (task.taskType) {
        case 'calculate_health':
          result = await this.calculateHealthScore(task.input.clientId);
          break;
        case 'calculate_all_health':
          result = await this.calculateAllHealthScores();
          break;
        case 'evaluate_vip':
          result = await this.evaluateVipStatus(task.input.clientId);
          break;
        case 'check_triggers':
          result = await this.checkReengagementTriggers();
          break;
        case 'create_campaign':
          result = await this.createCampaign(task.input as CreateRetentionCampaignInput);
          break;
        case 'get_at_risk':
          result = await this.getAtRiskClients();
          break;
        case 'get_recommendations':
          result = await this.getRecommendations();
          break;
        case 'get_dashboard':
          result = await this.getDashboard();
          break;
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      await this.updateTaskStatus(task.id, 'completed', result);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateTaskStatus(task.id, 'failed', undefined, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // HEALTH SCORE CALCULATION (RFM)
  // ============================================

  async calculateHealthScore(clientId: string): Promise<HealthScoreResult> {
    // Get client data
    const { data: client } = await this.supabase
      .from('profiles')
      .select('id, first_name, last_name, email, created_at')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client not found');
    }

    // Get appointment history
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select(`
        id, start_time, status, total_price,
        service:services(name, price)
      `)
      .eq('client_id', clientId)
      .eq('business_id', this.businessId)
      .order('start_time', { ascending: false });

    const completedAppointments = (appointments || []).filter(
      a => a.status === 'completed'
    );

    // Calculate RFM scores
    const now = new Date();

    // Recency: Days since last visit (1-5, lower is better)
    let recencyScore = 1;
    let daysSinceLastVisit = 999;
    if (completedAppointments.length > 0) {
      const lastVisit = new Date(completedAppointments[0].start_time);
      daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastVisit <= 30) recencyScore = 5;
      else if (daysSinceLastVisit <= 60) recencyScore = 4;
      else if (daysSinceLastVisit <= 90) recencyScore = 3;
      else if (daysSinceLastVisit <= 180) recencyScore = 2;
      else recencyScore = 1;
    }

    // Frequency: Number of visits in last 12 months (1-5)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const recentVisits = completedAppointments.filter(
      a => new Date(a.start_time) >= oneYearAgo
    ).length;

    let frequencyScore = 1;
    if (recentVisits >= 12) frequencyScore = 5;
    else if (recentVisits >= 8) frequencyScore = 4;
    else if (recentVisits >= 4) frequencyScore = 3;
    else if (recentVisits >= 2) frequencyScore = 2;
    else frequencyScore = 1;

    // Monetary: Total spend (1-5)
    const totalSpend = completedAppointments.reduce(
      (sum, a) => sum + (parseFloat(a.total_price) || 0),
      0
    );

    let monetaryScore = 1;
    if (totalSpend >= 2000) monetaryScore = 5;
    else if (totalSpend >= 1000) monetaryScore = 4;
    else if (totalSpend >= 500) monetaryScore = 3;
    else if (totalSpend >= 200) monetaryScore = 2;
    else monetaryScore = 1;

    // Calculate overall health score (0-100)
    const healthScore = Math.round(
      ((recencyScore + frequencyScore + monetaryScore) / 15) * 100
    );

    // Determine health status
    let healthStatus: HealthStatus;
    if (completedAppointments.length === 0) {
      healthStatus = 'new';
    } else if (healthScore >= 70) {
      healthStatus = 'healthy';
    } else if (healthScore >= 50) {
      healthStatus = 'at_risk';
    } else if (healthScore >= 30) {
      healthStatus = 'churning';
    } else {
      healthStatus = 'churned';
    }

    // Calculate churn probability
    const churnProbability = Math.max(0, Math.min(1, (100 - healthScore) / 100));

    // Identify risk factors
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    if (daysSinceLastVisit > 90) {
      riskFactors.push(`No visit in ${daysSinceLastVisit} days`);
    }
    if (recentVisits < 4) {
      riskFactors.push('Low visit frequency');
    }
    if (totalSpend < 200) {
      riskFactors.push('Below average lifetime spend');
    }

    if (frequencyScore >= 4 && recencyScore <= 2) {
      opportunities.push('Was a frequent visitor - high win-back potential');
    }
    if (monetaryScore >= 4) {
      opportunities.push('High spender - worth extra retention effort');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (healthStatus === 'at_risk') {
      recommendations.push('Send personalized re-engagement email');
      recommendations.push('Offer a special discount on next visit');
    } else if (healthStatus === 'churning') {
      recommendations.push('Urgent: Schedule personal outreach call');
      recommendations.push('Create compelling win-back offer');
    } else if (healthStatus === 'churned') {
      recommendations.push('Launch win-back campaign with significant offer');
    } else if (healthStatus === 'healthy') {
      recommendations.push('Nurture relationship with loyalty rewards');
    }

    // Save health score
    await this.supabase.from('client_health_scores').upsert({
      business_id: this.businessId,
      client_id: clientId,
      health_score: healthScore,
      health_status: healthStatus,
      recency_score: recencyScore,
      frequency_score: frequencyScore,
      monetary_score: monetaryScore,
      churn_probability: churnProbability,
      last_visit_days_ago: daysSinceLastVisit,
      lifetime_value: totalSpend,
      risk_factors: riskFactors,
      opportunities: opportunities,
      calculated_at: new Date().toISOString(),
    }, {
      onConflict: 'business_id,client_id',
    });

    await this.logActivity('health_calculated', {
      clientId,
      healthScore,
      healthStatus,
    });

    return {
      clientId,
      healthScore,
      healthStatus,
      rfmScores: {
        recency: recencyScore,
        frequency: frequencyScore,
        monetary: monetaryScore,
      },
      churnProbability,
      riskFactors,
      opportunities,
      recommendations,
    };
  }

  async calculateAllHealthScores(): Promise<{ calculated: number; atRisk: number }> {
    // Get all clients with appointments
    const { data: clients } = await this.supabase
      .from('appointments')
      .select('client_id')
      .eq('business_id', this.businessId)
      .not('client_id', 'is', null);

    const uniqueClientIds = [...new Set((clients || []).map(c => c.client_id))];

    let calculated = 0;
    let atRisk = 0;

    for (const clientId of uniqueClientIds) {
      try {
        const result = await this.calculateHealthScore(clientId);
        calculated++;
        if (result.healthStatus === 'at_risk' || result.healthStatus === 'churning') {
          atRisk++;
        }
      } catch {
        // Skip failed calculations
      }
    }

    await this.logActivity('all_health_calculated', {
      calculated,
      atRisk,
    });

    return { calculated, atRisk };
  }

  async getAtRiskClients(): Promise<ClientHealthScore[]> {
    const { data, error } = await this.supabase
      .from('client_health_scores')
      .select('*')
      .eq('business_id', this.businessId)
      .in('health_status', ['at_risk', 'churning'])
      .order('health_score');

    if (error) throw error;
    return (data || []).map(this.mapHealthRow);
  }

  // ============================================
  // VIP TIER MANAGEMENT
  // ============================================

  async evaluateVipStatus(clientId: string): Promise<VipEvaluationResult> {
    // Get tier requirements
    const { data: tiers } = await this.supabase
      .from('vip_tiers')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('is_active', true)
      .order('min_spend', { ascending: false });

    // Get client's current VIP status
    const { data: currentStatus } = await this.supabase
      .from('client_vip_status')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('client_id', clientId)
      .single();

    // Get client's total spend and visits
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('total_price')
      .eq('client_id', clientId)
      .eq('business_id', this.businessId)
      .eq('status', 'completed');

    const totalSpend = (appointments || []).reduce(
      (sum, a) => sum + (parseFloat(a.total_price) || 0),
      0
    );
    const totalVisits = (appointments || []).length;

    const currentTier = (currentStatus?.current_tier as VipTier) || 'standard';

    // Determine recommended tier
    let recommendedTier: VipTier = 'standard';
    for (const tier of tiers || []) {
      if (totalSpend >= tier.min_spend && totalVisits >= tier.min_visits) {
        recommendedTier = tier.tier_name as VipTier;
        break;
      }
    }

    const tierOrder: Record<VipTier, number> = {
      standard: 0,
      silver: 1,
      gold: 2,
      platinum: 3,
    };

    const shouldPromote = tierOrder[recommendedTier] > tierOrder[currentTier as VipTier];
    const shouldDemote = tierOrder[recommendedTier] < tierOrder[currentTier as VipTier];

    // Calculate next tier requirements
    let nextTierRequirements: { spendNeeded: number; visitsNeeded: number } | undefined;
    const currentTierIndex = tierOrder[recommendedTier];
    const nextTierDef = (tiers || []).find(
      t => tierOrder[t.tier_name as VipTier] === currentTierIndex + 1
    );

    if (nextTierDef) {
      nextTierRequirements = {
        spendNeeded: Math.max(0, nextTierDef.min_spend - totalSpend),
        visitsNeeded: Math.max(0, nextTierDef.min_visits - totalVisits),
      };
    }

    // Update VIP status if needed
    if (shouldPromote || shouldDemote || !currentStatus) {
      await this.supabase.from('client_vip_status').upsert({
        business_id: this.businessId,
        client_id: clientId,
        current_tier: recommendedTier,
        tier_start_date: new Date().toISOString(),
        total_spend: totalSpend,
        total_visits: totalVisits,
        next_tier_progress: nextTierRequirements
          ? (totalSpend / (totalSpend + nextTierRequirements.spendNeeded)) * 100
          : 100,
        promoted_at: shouldPromote ? new Date().toISOString() : currentStatus?.promoted_at,
        demoted_at: shouldDemote ? new Date().toISOString() : currentStatus?.demoted_at,
      }, {
        onConflict: 'business_id,client_id',
      });

      if (shouldPromote) {
        await this.logActivity('vip_promotion', {
          clientId,
          fromTier: currentTier,
          toTier: recommendedTier,
        });
      }
    }

    return {
      clientId,
      currentTier,
      recommendedTier,
      shouldPromote,
      shouldDemote,
      totalSpend,
      totalVisits,
      nextTierRequirements,
    };
  }

  async getVipClients(): Promise<ClientVipStatus[]> {
    const { data, error } = await this.supabase
      .from('client_vip_status')
      .select('*')
      .eq('business_id', this.businessId)
      .neq('current_tier', 'standard')
      .order('total_spend', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapVipRow);
  }

  // ============================================
  // RE-ENGAGEMENT TRIGGERS
  // ============================================

  async checkReengagementTriggers(): Promise<{ triggered: number; sent: number }> {
    const now = new Date();
    let triggered = 0;
    let sent = 0;

    // Get active retention campaigns
    const { data: campaigns } = await this.supabase
      .from('retention_campaigns')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('is_active', true);

    for (const campaign of campaigns || []) {
      // Find clients matching trigger criteria
      const triggerDate = new Date(now.getTime() - (campaign.trigger_days || 30) * 24 * 60 * 60 * 1000);

      const { data: healthScores } = await this.supabase
        .from('client_health_scores')
        .select('client_id')
        .eq('business_id', this.businessId)
        .eq('health_status', campaign.target_segment);

      for (const score of healthScores || []) {
        // Check if already triggered
        const { data: existingTrigger } = await this.supabase
          .from('reengagement_triggers')
          .select('id')
          .eq('business_id', this.businessId)
          .eq('client_id', score.client_id)
          .eq('campaign_id', campaign.id)
          .eq('status', 'in_progress')
          .single();

        if (existingTrigger) continue;

        // Create trigger
        await this.supabase.from('reengagement_triggers').insert({
          business_id: this.businessId,
          client_id: score.client_id,
          trigger_type: campaign.trigger_type,
          triggered_at: new Date().toISOString(),
          campaign_id: campaign.id,
          messages_sent: 1,
          last_message_at: new Date().toISOString(),
          status: 'in_progress',
        });

        triggered++;

        // In production, send actual message here
        // await sendReengagementMessage(score.client_id, campaign);

        sent++;

        // Update campaign stats
        await this.supabase
          .from('retention_campaigns')
          .update({ sent_count: (campaign.sent_count || 0) + 1 })
          .eq('id', campaign.id);
      }
    }

    await this.logActivity('triggers_checked', { triggered, sent });

    return { triggered, sent };
  }

  // ============================================
  // CAMPAIGNS
  // ============================================

  async createCampaign(input: CreateRetentionCampaignInput): Promise<RetentionCampaign> {
    const { data, error } = await this.supabase
      .from('retention_campaigns')
      .insert({
        business_id: this.businessId,
        name: input.name,
        target_segment: input.targetSegment,
        trigger_type: input.triggerType,
        trigger_days: input.triggerDays,
        message_template: input.messageTemplate,
        offer_type: input.offerType,
        offer_value: input.offerValue,
        is_active: true,
        sent_count: 0,
        converted_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('campaign_created', {
      campaignId: data.id,
      name: input.name,
      targetSegment: input.targetSegment,
    });

    return this.mapCampaignRow(data);
  }

  async getCampaigns(): Promise<RetentionCampaign[]> {
    const { data, error } = await this.supabase
      .from('retention_campaigns')
      .select('*')
      .eq('business_id', this.businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapCampaignRow);
  }

  // ============================================
  // RECOMMENDATIONS & DASHBOARD
  // ============================================

  async getRecommendations(): Promise<RetentionRecommendation[]> {
    const recommendations: RetentionRecommendation[] = [];

    // Get at-risk clients
    const atRisk = await this.getAtRiskClients();

    for (const client of atRisk.slice(0, 10)) {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', client.clientId)
        .single();

      const clientName = profile
        ? `${profile.first_name} ${profile.last_name}`
        : 'Unknown';

      if (client.healthStatus === 'churning') {
        recommendations.push({
          type: 'win_back',
          priority: 'critical',
          clientId: client.clientId,
          clientName,
          title: `Win back ${clientName}`,
          description: `Health score: ${client.healthScore}. ${client.lastVisitDaysAgo} days since last visit.`,
          suggestedAction: 'Send urgent win-back offer',
          suggestedOffer: '25% off next service',
          estimatedValue: client.lifetimeValue,
        });
      } else if (client.healthStatus === 'at_risk') {
        recommendations.push({
          type: 'outreach',
          priority: 'high',
          clientId: client.clientId,
          clientName,
          title: `Re-engage ${clientName}`,
          description: `Health score: ${client.healthScore}. Risk factors: ${client.riskFactors.join(', ')}`,
          suggestedAction: 'Send personalized check-in message',
          suggestedOffer: '15% off next visit',
          estimatedValue: client.lifetimeValue * 0.5,
        });
      }
    }

    // Sort by priority and value
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedValue - a.estimatedValue;
    });

    return recommendations;
  }

  async getDashboard(): Promise<RetentionDashboard> {
    // Get health score summary
    const { data: healthScores } = await this.supabase
      .from('client_health_scores')
      .select('health_score, health_status, lifetime_value, last_visit_days_ago, client_id')
      .eq('business_id', this.businessId);

    const scores = healthScores || [];

    const summary = {
      totalClients: scores.length,
      healthyClients: scores.filter(s => s.health_status === 'healthy').length,
      atRiskClients: scores.filter(s => s.health_status === 'at_risk').length,
      churningClients: scores.filter(s => s.health_status === 'churning').length,
      churnedClients: scores.filter(s => s.health_status === 'churned').length,
      avgHealthScore: scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.health_score, 0) / scores.length)
        : 0,
    };

    // Get VIP summary
    const { data: vipStatuses } = await this.supabase
      .from('client_vip_status')
      .select('current_tier, total_spend')
      .eq('business_id', this.businessId);

    const vips = vipStatuses || [];
    const vipSummary = {
      platinum: vips.filter(v => v.current_tier === 'platinum').length,
      gold: vips.filter(v => v.current_tier === 'gold').length,
      silver: vips.filter(v => v.current_tier === 'silver').length,
      standard: vips.filter(v => v.current_tier === 'standard').length,
      totalVipRevenue: vips
        .filter(v => v.current_tier !== 'standard')
        .reduce((sum, v) => sum + (v.total_spend || 0), 0),
    };

    // Get re-engagement stats
    const { data: triggers } = await this.supabase
      .from('reengagement_triggers')
      .select('trigger_type, converted_to_booking')
      .eq('business_id', this.businessId);

    const triggerTypes: TriggerType[] = ['days_inactive', 'missed_appointment', 'birthday', 'anniversary'];
    const reengagementStats = triggerTypes.map(type => {
      const typeTriggers = (triggers || []).filter(t => t.trigger_type === type);
      return {
        triggerType: type,
        totalSent: typeTriggers.length,
        totalConverted: typeTriggers.filter(t => t.converted_to_booking).length,
        conversionRate: typeTriggers.length > 0
          ? typeTriggers.filter(t => t.converted_to_booking).length / typeTriggers.length
          : 0,
        revenue: 0, // Would need to calculate from bookings
      };
    });

    // Get top at-risk clients
    const topAtRisk = scores
      .filter(s => s.health_status === 'at_risk' || s.health_status === 'churning')
      .sort((a, b) => b.lifetime_value - a.lifetime_value)
      .slice(0, 5)
      .map(s => ({
        clientId: s.client_id,
        clientName: 'Client', // Would need to join with profiles
        healthScore: s.health_score,
        churnProbability: (100 - s.health_score) / 100,
        lifetimeValue: s.lifetime_value,
      }));

    return {
      summary,
      vipSummary,
      reengagementStats,
      topAtRisk,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapHealthRow(row: any): ClientHealthScore {
    return {
      id: row.id,
      businessId: row.business_id,
      clientId: row.client_id,
      healthScore: row.health_score,
      healthStatus: row.health_status,
      recencyScore: row.recency_score,
      frequencyScore: row.frequency_score,
      monetaryScore: row.monetary_score,
      churnProbability: parseFloat(row.churn_probability) || 0,
      lastVisitDaysAgo: row.last_visit_days_ago,
      lifetimeValue: parseFloat(row.lifetime_value) || 0,
      riskFactors: row.risk_factors || [],
      opportunities: row.opportunities || [],
      calculatedAt: new Date(row.calculated_at),
    };
  }

  private mapVipRow(row: any): ClientVipStatus {
    return {
      id: row.id,
      businessId: row.business_id,
      clientId: row.client_id,
      currentTier: row.current_tier,
      tierStartDate: new Date(row.tier_start_date),
      tierEndDate: row.tier_end_date ? new Date(row.tier_end_date) : undefined,
      totalSpend: parseFloat(row.total_spend) || 0,
      totalVisits: row.total_visits || 0,
      pointsBalance: row.points_balance || 0,
      nextTierProgress: parseFloat(row.next_tier_progress) || 0,
      promotedAt: row.promoted_at ? new Date(row.promoted_at) : undefined,
      demotedAt: row.demoted_at ? new Date(row.demoted_at) : undefined,
    };
  }

  private mapCampaignRow(row: any): RetentionCampaign {
    return {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      targetSegment: row.target_segment,
      triggerType: row.trigger_type,
      triggerDays: row.trigger_days,
      messageTemplate: row.message_template,
      offerType: row.offer_type,
      offerValue: row.offer_value ? parseFloat(row.offer_value) : undefined,
      isActive: row.is_active,
      sentCount: row.sent_count || 0,
      convertedCount: row.converted_count || 0,
      createdAt: new Date(row.created_at),
    };
  }
}

// Factory function
export function createRetentionAgent(businessId: string): RetentionAgent {
  return new RetentionAgent(businessId);
}

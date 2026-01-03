// Marketing Campaign Agent - Service
// Handles campaign management, content generation, and scheduling

import { BaseFunctionalAgent } from '../base';
import type {
  FunctionalAgentTask,
  AgentExecutionResult,
  MarketingCampaign,
  ScheduledPost,
  ContentCalendarItem,
  CampaignAnalytics,
  PostPlatform,
  CampaignStatus,
} from '../types';
import type {
  CreateMarketingCampaignInput,
  GenerateCalendarInput,
  GeneratedCalendarItem,
  SchedulePostInput,
  CampaignPerformance,
  ContentSuggestion,
  MarketingInsight,
} from './types';
import {
  MARKETING_SYSTEM_PROMPT,
  CONTENT_CALENDAR_PROMPT,
  SOCIAL_POST_PROMPT,
  EMAIL_CAMPAIGN_PROMPT,
  CAMPAIGN_ANALYSIS_PROMPT,
  MARKETING_INSIGHTS_PROMPT,
} from './prompts';

export class MarketingAgent extends BaseFunctionalAgent {
  constructor(businessId: string) {
    super(businessId, 'marketing');
  }

  getSystemPrompt(): string {
    return MARKETING_SYSTEM_PROMPT;
  }

  getAvailableActions(): string[] {
    return [
      'create_campaign',
      'update_campaign',
      'generate_calendar',
      'schedule_post',
      'publish_post',
      'analyze_campaign',
      'get_insights',
      'generate_content',
    ];
  }

  async execute(task: FunctionalAgentTask): Promise<AgentExecutionResult> {
    await this.updateTaskStatus(task.id, 'running');

    try {
      let result: any;

      switch (task.taskType) {
        case 'create_campaign':
          result = await this.createCampaign(task.input as CreateMarketingCampaignInput);
          break;
        case 'generate_calendar':
          result = await this.generateContentCalendar(task.input as GenerateCalendarInput);
          break;
        case 'schedule_post':
          result = await this.schedulePost(task.input as SchedulePostInput);
          break;
        case 'analyze_campaign':
          result = await this.analyzeCampaign(task.input.campaignId);
          break;
        case 'get_insights':
          result = await this.getMarketingInsights();
          break;
        case 'generate_content':
          result = await this.generateContent(task.input as {
            type: 'social' | 'email' | 'promotion';
            platform?: PostPlatform;
            topic: string;
            tone?: string;
          });
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
  // CAMPAIGN MANAGEMENT
  // ============================================

  async createCampaign(input: CreateMarketingCampaignInput): Promise<MarketingCampaign> {
    const { data, error } = await this.supabase
      .from('marketing_campaigns')
      .insert({
        business_id: this.businessId,
        name: input.name,
        description: input.description,
        campaign_type: input.campaignType,
        status: 'draft',
        target_audience: input.targetAudience,
        goals: input.goals,
        budget: input.budget,
        start_date: input.startDate?.toISOString(),
        end_date: input.endDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('campaign_created', {
      campaignId: data.id,
      name: input.name,
      type: input.campaignType,
    });

    return this.mapCampaignRow(data);
  }

  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus
  ): Promise<void> {
    const { error } = await this.supabase
      .from('marketing_campaigns')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('business_id', this.businessId);

    if (error) throw error;

    await this.logActivity('campaign_status_updated', {
      campaignId,
      status,
    });
  }

  async getCampaigns(status?: CampaignStatus): Promise<MarketingCampaign[]> {
    let query = this.supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('business_id', this.businessId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapCampaignRow);
  }

  async getCampaignById(campaignId: string): Promise<MarketingCampaign | null> {
    const { data, error } = await this.supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('business_id', this.businessId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapCampaignRow(data) : null;
  }

  // ============================================
  // CONTENT CALENDAR
  // ============================================

  async generateContentCalendar(
    input: GenerateCalendarInput
  ): Promise<GeneratedCalendarItem[]> {
    const businessContext = await this.getBusinessContext();
    const { data: business } = await this.supabase
      .from('businesses')
      .select('name')
      .eq('id', this.businessId)
      .single();

    const monthName = new Date(input.year, input.month - 1).toLocaleString('default', {
      month: 'long',
    });

    const prompt = CONTENT_CALENDAR_PROMPT(
      business?.name || 'Your Business',
      monthName,
      input.year,
      input.themes || ['general beauty', 'self-care', 'seasonal'],
      input.platforms,
      input.postsPerWeek || 3
    );

    const response = await this.callAI(prompt, businessContext);

    // Parse AI response
    let calendarData: GeneratedCalendarItem[] = [];
    try {
      const parsed = JSON.parse(response);
      calendarData = parsed.calendar || [];
    } catch {
      // If parsing fails, return empty array
      await this.logActivity('calendar_generation_failed', {
        month: input.month,
        year: input.year,
        error: 'Failed to parse AI response',
      }, 'warning');
      return [];
    }

    // Save to database
    const calendarItems = calendarData.map((item: any) => ({
      business_id: this.businessId,
      campaign_id: input.campaignId,
      title: item.title,
      content_type: item.contentType,
      description: item.description,
      scheduled_date: item.date,
      platforms: item.platforms,
      status: 'idea',
      tags: item.hashtags,
    }));

    if (calendarItems.length > 0) {
      await this.supabase.from('content_calendar_items').insert(calendarItems);
    }

    await this.logActivity('calendar_generated', {
      month: input.month,
      year: input.year,
      itemsCount: calendarItems.length,
    });

    return calendarData;
  }

  async getContentCalendar(
    startDate: Date,
    endDate: Date
  ): Promise<ContentCalendarItem[]> {
    const { data, error } = await this.supabase
      .from('content_calendar_items')
      .select('*')
      .eq('business_id', this.businessId)
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString())
      .order('scheduled_date');

    if (error) throw error;
    return (data || []).map(this.mapCalendarItemRow);
  }

  async updateCalendarItem(
    itemId: string,
    updates: Partial<ContentCalendarItem>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('content_calendar_items')
      .update({
        title: updates.title,
        description: updates.description,
        scheduled_date: updates.scheduledDate?.toISOString(),
        platforms: updates.platforms,
        status: updates.status,
        tags: updates.tags,
        assigned_to: updates.assignedTo,
      })
      .eq('id', itemId)
      .eq('business_id', this.businessId);

    if (error) throw error;
  }

  // ============================================
  // POST SCHEDULING
  // ============================================

  async schedulePost(input: SchedulePostInput): Promise<ScheduledPost> {
    const { data, error } = await this.supabase
      .from('scheduled_posts')
      .insert({
        business_id: this.businessId,
        campaign_id: input.campaignId,
        platform: input.platform,
        content: input.content,
        media_urls: input.mediaUrls,
        scheduled_for: input.scheduledFor.toISOString(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('post_scheduled', {
      postId: data.id,
      platform: input.platform,
      scheduledFor: input.scheduledFor,
    });

    return this.mapPostRow(data);
  }

  async getScheduledPosts(
    status?: 'scheduled' | 'published' | 'failed'
  ): Promise<ScheduledPost[]> {
    let query = this.supabase
      .from('scheduled_posts')
      .select('*')
      .eq('business_id', this.businessId)
      .order('scheduled_for');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapPostRow);
  }

  async getPostsDueForPublishing(): Promise<ScheduledPost[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('scheduled_posts')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for');

    if (error) throw error;
    return (data || []).map(this.mapPostRow);
  }

  async markPostPublished(
    postId: string,
    engagementMetrics?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        engagement_metrics: engagementMetrics,
      })
      .eq('id', postId)
      .eq('business_id', this.businessId);

    if (error) throw error;

    await this.logActivity('post_published', { postId });
  }

  async markPostFailed(postId: string, error: string): Promise<void> {
    const { error: updateError } = await this.supabase
      .from('scheduled_posts')
      .update({
        status: 'failed',
        error,
      })
      .eq('id', postId)
      .eq('business_id', this.businessId);

    if (updateError) throw updateError;

    await this.logActivity('post_failed', { postId, error }, 'error');
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async recordAnalytics(
    campaignId: string,
    metrics: Omit<CampaignAnalytics, 'id' | 'businessId' | 'campaignId'>
  ): Promise<void> {
    const roi = metrics.cost > 0
      ? ((metrics.revenue - metrics.cost) / metrics.cost) * 100
      : 0;

    const { error } = await this.supabase.from('campaign_analytics').insert({
      business_id: this.businessId,
      campaign_id: campaignId,
      date: metrics.date.toISOString().split('T')[0],
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      conversions: metrics.conversions,
      revenue: metrics.revenue,
      cost: metrics.cost,
      roi,
      metadata: metrics.metadata,
    });

    if (error) throw error;
  }

  async getCampaignAnalytics(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignAnalytics[]> {
    let query = this.supabase
      .from('campaign_analytics')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('campaign_id', campaignId)
      .order('date');

    if (startDate) {
      query = query.gte('date', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapAnalyticsRow);
  }

  async analyzeCampaign(campaignId: string): Promise<CampaignPerformance> {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const analytics = await this.getCampaignAnalytics(campaignId);

    // Aggregate metrics
    const totals = analytics.reduce(
      (acc, day) => ({
        impressions: acc.impressions + day.impressions,
        clicks: acc.clicks + day.clicks,
        conversions: acc.conversions + day.conversions,
        revenue: acc.revenue + day.revenue,
        cost: acc.cost + day.cost,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 }
    );

    // Get post counts
    const { count: publishedCount } = await this.supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'published');

    const { count: scheduledCount } = await this.supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'scheduled');

    const roi = totals.cost > 0
      ? ((totals.revenue - totals.cost) / totals.cost) * 100
      : 0;

    return {
      campaign,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalRevenue: totals.revenue,
      totalCost: totals.cost,
      roi,
      postsPublished: publishedCount || 0,
      postsScheduled: scheduledCount || 0,
    };
  }

  // ============================================
  // AI-POWERED CONTENT GENERATION
  // ============================================

  async generateContent(input: {
    type: 'social' | 'email' | 'promotion';
    platform?: PostPlatform;
    topic: string;
    tone?: string;
  }): Promise<ContentSuggestion> {
    const businessContext = await this.getBusinessContext();
    const { data: business } = await this.supabase
      .from('businesses')
      .select('name, settings')
      .eq('id', this.businessId)
      .single();

    const bookingUrl = business?.settings?.bookingUrl || 'https://kelatic.com/book';

    let prompt: string;

    if (input.type === 'social') {
      prompt = SOCIAL_POST_PROMPT(
        business?.name || 'Your Business',
        input.platform || 'instagram',
        input.tone || 'engaging',
        input.topic,
        bookingUrl
      );
    } else if (input.type === 'email') {
      prompt = EMAIL_CAMPAIGN_PROMPT(
        business?.name || 'Your Business',
        'promotional',
        'all_clients',
        input.topic
      );
    } else {
      prompt = `Generate a ${input.type} about ${input.topic} for ${business?.name}. Return JSON with content, callToAction, and reasoning.`;
    }

    const response = await this.callAI(prompt, businessContext);

    try {
      const parsed = JSON.parse(response);
      return {
        type: input.type === 'social' ? 'post' : input.type === 'email' ? 'email' : 'promotion',
        title: input.topic,
        content: parsed.content || parsed.body || response,
        platform: input.platform || 'instagram',
        bestTime: parsed.bestPostTime || '10:00 AM',
        reasoning: parsed.reasoning || 'AI-generated content optimized for engagement',
      };
    } catch {
      return {
        type: 'post',
        title: input.topic,
        content: response,
        platform: input.platform || 'instagram',
        bestTime: '10:00 AM',
        reasoning: 'AI-generated content',
      };
    }
  }

  async getMarketingInsights(): Promise<MarketingInsight[]> {
    // Gather business data for analysis
    const [campaigns, posts, { data: appointments }] = await Promise.all([
      this.getCampaigns(),
      this.getScheduledPosts(),
      this.supabase
        .from('appointments')
        .select('start_time, status, service_id')
        .eq('business_id', this.businessId)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const businessData = JSON.stringify({
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalCampaigns: campaigns.length,
      scheduledPosts: posts.filter((p) => p.status === 'scheduled').length,
      recentAppointments: appointments?.length || 0,
      // Add more metrics as needed
    });

    const prompt = MARKETING_INSIGHTS_PROMPT(businessData);
    const response = await this.callAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return parsed.insights || [];
    } catch {
      return [];
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapCampaignRow(row: any): MarketingCampaign {
    return {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      campaignType: row.campaign_type,
      status: row.status,
      targetAudience: row.target_audience,
      goals: row.goals,
      budget: row.budget ? parseFloat(row.budget) : undefined,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapPostRow(row: any): ScheduledPost {
    return {
      id: row.id,
      businessId: row.business_id,
      campaignId: row.campaign_id,
      platform: row.platform,
      content: row.content,
      mediaUrls: row.media_urls,
      scheduledFor: new Date(row.scheduled_for),
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      engagementMetrics: row.engagement_metrics,
      error: row.error,
      createdAt: new Date(row.created_at),
    };
  }

  private mapCalendarItemRow(row: any): ContentCalendarItem {
    return {
      id: row.id,
      businessId: row.business_id,
      campaignId: row.campaign_id,
      title: row.title,
      contentType: row.content_type,
      description: row.description,
      scheduledDate: new Date(row.scheduled_date),
      platforms: row.platforms || [],
      status: row.status,
      tags: row.tags,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
    };
  }

  private mapAnalyticsRow(row: any): CampaignAnalytics {
    return {
      id: row.id,
      businessId: row.business_id,
      campaignId: row.campaign_id,
      date: new Date(row.date),
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      revenue: parseFloat(row.revenue) || 0,
      cost: parseFloat(row.cost) || 0,
      roi: row.roi ? parseFloat(row.roi) : undefined,
      metadata: row.metadata,
    };
  }
}

// Factory function
export function createMarketingAgent(businessId: string): MarketingAgent {
  return new MarketingAgent(businessId);
}

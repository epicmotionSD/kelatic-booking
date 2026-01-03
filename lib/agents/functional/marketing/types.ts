// Marketing Agent - Extended Types

import type {
  MarketingCampaign,
  ScheduledPost,
  ContentCalendarItem,
  CampaignAnalytics,
  PostPlatform,
  CampaignType,
  CampaignStatus,
} from '../types';

export interface CreateMarketingCampaignInput {
  name: string;
  description?: string;
  campaignType: CampaignType;
  targetAudience?: {
    segments?: string[];
    tags?: string[];
    minVisits?: number;
    maxDaysSinceVisit?: number;
  };
  goals?: {
    bookings?: number;
    revenue?: number;
    engagement?: number;
  };
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface GenerateCalendarInput {
  month: number; // 1-12
  year: number;
  themes?: string[];
  platforms: PostPlatform[];
  postsPerWeek?: number;
  campaignId?: string;
}

export interface GeneratedCalendarItem {
  date: Date;
  title: string;
  contentType: string;
  description: string;
  platforms: PostPlatform[];
  suggestedTime: string;
  hashtags?: string[];
  callToAction?: string;
}

export interface SchedulePostInput {
  campaignId?: string;
  platform: PostPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledFor: Date;
}

export interface CampaignPerformance {
  campaign: MarketingCampaign;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCost: number;
  roi: number;
  bestPerformingPlatform?: PostPlatform;
  postsPublished: number;
  postsScheduled: number;
}

export interface ContentSuggestion {
  type: 'post' | 'story' | 'email' | 'promotion';
  title: string;
  content: string;
  platform: PostPlatform;
  bestTime: string;
  reasoning: string;
}

export interface MarketingInsight {
  type: 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

// Support Agent - Extended Types

import type {
  SupportKnowledgeBase,
  SupportConversation,
  SupportMessage,
  SupportTicket,
  FeatureDiscovery,
  TicketPriority,
  TicketStatus,
} from '../types';

export interface ChatInput {
  sessionId: string;
  message: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  suggestedActions?: string[];
  relatedArticles?: Array<{
    id: string;
    question: string;
    relevance: number;
  }>;
  shouldEscalate: boolean;
  escalationReason?: string;
  featureSuggestion?: {
    featureName: string;
    description: string;
  };
}

export interface KnowledgeSearchInput {
  query: string;
  category?: string;
  limit?: number;
}

export interface KnowledgeSearchResult {
  articles: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    relevance: number;
  }>;
  suggestedQueries?: string[];
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
  conversationId?: string;
  userId?: string;
}

export interface TroubleshootingStep {
  step: number;
  instruction: string;
  expectedOutcome?: string;
  ifFailed?: string;
}

export interface TroubleshootingGuide {
  issue: string;
  steps: TroubleshootingStep[];
  escalationCriteria: string[];
  estimatedTime: string;
}

export interface SupportMetrics {
  totalConversations: number;
  resolvedByAi: number;
  aiResolutionRate: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  openTickets: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface FeatureSuggestion {
  featureName: string;
  description: string;
  howToAccess: string;
  benefits: string[];
}

// Support Assistant Agent - Service
// Handles AI-powered support chat, knowledge base, and escalation

import { BaseFunctionalAgent } from '../base';
import type {
  FunctionalAgentTask,
  AgentExecutionResult,
  SupportKnowledgeBase,
  SupportConversation,
  SupportMessage,
  SupportTicket,
  FeatureDiscovery,
  TicketPriority,
} from '../types';
import type {
  ChatInput,
  ChatResponse,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
  CreateTicketInput,
  TroubleshootingGuide,
  SupportMetrics,
  FeatureSuggestion,
} from './types';
import {
  SUPPORT_SYSTEM_PROMPT,
  CHAT_RESPONSE_PROMPT,
  KNOWLEDGE_SEARCH_PROMPT,
  TROUBLESHOOTING_PROMPT,
  ESCALATION_PROMPT,
} from './prompts';

export class SupportAgent extends BaseFunctionalAgent {
  constructor(businessId: string) {
    super(businessId, 'support');
  }

  getSystemPrompt(): string {
    return SUPPORT_SYSTEM_PROMPT;
  }

  getAvailableActions(): string[] {
    return [
      'chat',
      'search_knowledge',
      'create_ticket',
      'troubleshoot',
      'get_metrics',
      'add_knowledge',
      'track_feature',
    ];
  }

  async execute(task: FunctionalAgentTask): Promise<AgentExecutionResult> {
    await this.updateTaskStatus(task.id, 'running');

    try {
      let result: any;

      switch (task.taskType) {
        case 'chat':
          result = await this.handleChat(task.input as ChatInput);
          break;
        case 'search_knowledge':
          result = await this.searchKnowledge(task.input as KnowledgeSearchInput);
          break;
        case 'create_ticket':
          result = await this.createTicket(task.input as CreateTicketInput);
          break;
        case 'troubleshoot':
          result = await this.createTroubleshootingGuide(task.input.issue, task.input.context);
          break;
        case 'get_metrics':
          result = await this.getMetrics();
          break;
        case 'add_knowledge':
          result = await this.addKnowledgeArticle(task.input as {
            category: string;
            question: string;
            answer: string;
            keywords?: string[];
          });
          break;
        case 'track_feature':
          result = await this.trackFeatureDiscovery(task.input as {
            featureName: string;
            userId?: string;
            source: 'support_chat' | 'onboarding' | 'tooltip' | 'search';
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
  // CHAT HANDLING
  // ============================================

  async handleChat(input: ChatInput): Promise<ChatResponse> {
    // Get or create conversation
    let conversation = await this.getOrCreateConversation(input.sessionId, input.userId);

    // Get conversation history
    const history = await this.getConversationHistory(conversation.id);

    // Save user message
    await this.saveMessage(conversation.id, 'user', input.message);

    // Search knowledge base for relevant articles
    const knowledgeResults = await this.searchKnowledge({
      query: input.message,
      limit: 3,
    });

    // Build context
    const conversationHistory = history
      .slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const knowledgeContext = knowledgeResults.articles
      .map(a => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    const businessContext = await this.getBusinessContext();

    // Generate AI response
    let aiResponse: any;
    try {
      const prompt = CHAT_RESPONSE_PROMPT(
        input.message,
        conversationHistory,
        knowledgeContext || 'No relevant knowledge base articles found.',
        businessContext
      );

      const rawResponse = await this.callAI(prompt);
      aiResponse = JSON.parse(rawResponse);
    } catch {
      // Fallback response if AI fails
      aiResponse = {
        response: "I apologize, but I'm having trouble processing your request. Let me connect you with our support team who can help you better.",
        shouldEscalate: true,
        escalationReason: 'AI processing error',
      };
    }

    // Save assistant message
    await this.saveMessage(conversation.id, 'assistant', aiResponse.response);

    // Handle escalation if needed
    if (aiResponse.shouldEscalate) {
      await this.supabase
        .from('support_conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // Create support ticket
      await this.createTicket({
        subject: `Escalated: ${input.message.slice(0, 50)}...`,
        description: `User message: ${input.message}\n\nEscalation reason: ${aiResponse.escalationReason}`,
        priority: 'high',
        conversationId: conversation.id,
        userId: input.userId,
      });
    }

    // Track feature discovery if suggested
    if (aiResponse.suggestedFeature?.name) {
      await this.trackFeatureDiscovery({
        featureName: aiResponse.suggestedFeature.name,
        userId: input.userId,
        source: 'support_chat',
      });
    }

    await this.logActivity('chat_handled', {
      conversationId: conversation.id,
      escalated: aiResponse.shouldEscalate,
      hasFeatureSuggestion: !!aiResponse.suggestedFeature,
    });

    return {
      message: aiResponse.response,
      conversationId: conversation.id,
      suggestedActions: aiResponse.followUpQuestions,
      relatedArticles: knowledgeResults.articles.map(a => ({
        id: a.id,
        question: a.question,
        relevance: a.relevance,
      })),
      shouldEscalate: aiResponse.shouldEscalate,
      escalationReason: aiResponse.escalationReason,
      featureSuggestion: aiResponse.suggestedFeature,
    };
  }

  private async getOrCreateConversation(
    sessionId: string,
    userId?: string
  ): Promise<SupportConversation> {
    // Check for existing active conversation
    const { data: existing } = await this.supabase
      .from('support_conversations')
      .select('*')
      .eq('business_id', this.businessId)
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .single();

    if (existing) {
      return this.mapConversationRow(existing);
    }

    // Create new conversation
    const { data: created, error } = await this.supabase
      .from('support_conversations')
      .insert({
        business_id: this.businessId,
        user_id: userId,
        session_id: sessionId,
        channel: 'web',
        status: 'active',
        resolved_by_ai: false,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapConversationRow(created);
  }

  private async getConversationHistory(conversationId: string): Promise<SupportMessage[]> {
    const { data, error } = await this.supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');

    if (error) throw error;
    return (data || []).map(this.mapMessageRow);
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase.from('support_messages').insert({
      conversation_id: conversationId,
      role,
      content,
      metadata,
    });

    if (error) throw error;
  }

  async closeConversation(
    conversationId: string,
    resolvedByAi: boolean,
    satisfactionRating?: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('support_conversations')
      .update({
        status: 'resolved',
        resolved_by_ai: resolvedByAi,
        satisfaction_rating: satisfactionRating,
        closed_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) throw error;

    await this.logActivity('conversation_closed', {
      conversationId,
      resolvedByAi,
      satisfactionRating,
    });
  }

  // ============================================
  // KNOWLEDGE BASE
  // ============================================

  async searchKnowledge(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
    // Get all active articles
    let query = this.supabase
      .from('support_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .or(`business_id.eq.${this.businessId},business_id.is.null`);

    if (input.category) {
      query = query.eq('category', input.category);
    }

    const { data: articles, error } = await query;

    if (error) throw error;

    // Simple keyword matching (in production, use embeddings/vector search)
    const queryWords = input.query.toLowerCase().split(/\s+/);
    const scored = (articles || []).map(article => {
      const textToSearch = `${article.question} ${article.answer} ${(article.keywords || []).join(' ')}`.toLowerCase();

      let score = 0;
      for (const word of queryWords) {
        if (textToSearch.includes(word)) {
          score += 1;
        }
      }

      // Boost for keyword matches
      for (const keyword of article.keywords || []) {
        if (queryWords.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }

      const relevance = Math.min(score / queryWords.length, 1);

      return {
        id: article.id,
        question: article.question,
        answer: article.answer,
        category: article.category,
        relevance,
      };
    });

    // Sort by relevance and take top results
    const results = scored
      .filter(a => a.relevance > 0.1)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, input.limit || 5);

    return {
      articles: results,
      suggestedQueries: results.length === 0
        ? ['How do I book an appointment?', 'How do I cancel?', 'Payment issues']
        : undefined,
    };
  }

  async addKnowledgeArticle(input: {
    category: string;
    question: string;
    answer: string;
    keywords?: string[];
  }): Promise<SupportKnowledgeBase> {
    const { data, error } = await this.supabase
      .from('support_knowledge_base')
      .insert({
        business_id: this.businessId,
        category: input.category,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('knowledge_added', {
      articleId: data.id,
      category: input.category,
    });

    return this.mapKnowledgeRow(data);
  }

  async updateArticleFeedback(
    articleId: string,
    helpful: boolean
  ): Promise<void> {
    const column = helpful ? 'helpful_count' : 'not_helpful_count';

    const { error } = await this.supabase.rpc('increment_knowledge_feedback', {
      article_id: articleId,
      column_name: column,
    });

    // If RPC doesn't exist, update directly
    if (error) {
      const { data: article } = await this.supabase
        .from('support_knowledge_base')
        .select(column)
        .eq('id', articleId)
        .single();

      if (article) {
        await this.supabase
          .from('support_knowledge_base')
          .update({ [column]: (article[column] || 0) + 1 })
          .eq('id', articleId);
      }
    }
  }

  // ============================================
  // TICKETS
  // ============================================

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .insert({
        business_id: this.businessId,
        conversation_id: input.conversationId,
        user_id: input.userId,
        subject: input.subject,
        description: input.description,
        priority: input.priority || 'medium',
        status: 'open',
        category: input.category,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('ticket_created', {
      ticketId: data.id,
      priority: data.priority,
    });

    // Create alert for high priority tickets
    if (input.priority === 'high' || input.priority === 'urgent') {
      await this.createAlert(
        'high_priority_ticket',
        `${input.priority.toUpperCase()} Priority Support Ticket`,
        input.subject,
        input.priority === 'urgent' ? 'critical' : 'warning',
        { ticketId: data.id }
      );
    }

    return this.mapTicketRow(data);
  }

  async getOpenTickets(): Promise<SupportTicket[]> {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('business_id', this.businessId)
      .in('status', ['open', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at');

    if (error) throw error;
    return (data || []).map(this.mapTicketRow);
  }

  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed',
    resolution?: string
  ): Promise<void> {
    const updates: Record<string, any> = { status };

    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString();
      if (resolution) {
        updates.resolution = resolution;
      }
    }

    const { error } = await this.supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) throw error;
  }

  // ============================================
  // TROUBLESHOOTING
  // ============================================

  async createTroubleshootingGuide(
    issue: string,
    context?: string
  ): Promise<TroubleshootingGuide> {
    const prompt = TROUBLESHOOTING_PROMPT(issue, context || 'No additional context');

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch {
      // Return generic troubleshooting guide
      return {
        issue,
        steps: [
          {
            step: 1,
            instruction: 'Refresh the page and try again',
            expectedOutcome: 'Issue may resolve after refresh',
            ifFailed: 'Continue to next step',
          },
          {
            step: 2,
            instruction: 'Clear browser cache and cookies',
            expectedOutcome: 'Fresh session may resolve the issue',
            ifFailed: 'Contact support',
          },
        ],
        escalationCriteria: [
          'Issue persists after trying all steps',
          'Error messages appear',
          'Data loss or corruption suspected',
        ],
        estimatedTime: '5-10 minutes',
      };
    }
  }

  // ============================================
  // FEATURE DISCOVERY
  // ============================================

  async trackFeatureDiscovery(input: {
    featureName: string;
    userId?: string;
    source: 'support_chat' | 'onboarding' | 'tooltip' | 'search';
  }): Promise<void> {
    const { data: existing } = await this.supabase
      .from('feature_discovery')
      .select('id, usage_count')
      .eq('business_id', this.businessId)
      .eq('feature_name', input.featureName)
      .eq('user_id', input.userId || '')
      .single();

    if (existing) {
      await this.supabase
        .from('feature_discovery')
        .update({
          usage_count: existing.usage_count + 1,
          used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await this.supabase.from('feature_discovery').insert({
        business_id: this.businessId,
        user_id: input.userId,
        feature_name: input.featureName,
        discovered_at: new Date().toISOString(),
        source: input.source,
        usage_count: 1,
      });
    }
  }

  // ============================================
  // METRICS
  // ============================================

  async getMetrics(): Promise<SupportMetrics> {
    // Get conversation stats
    const { data: conversations } = await this.supabase
      .from('support_conversations')
      .select('resolved_by_ai, satisfaction_rating, status')
      .eq('business_id', this.businessId);

    const allConversations = conversations || [];
    const resolved = allConversations.filter(c =>
      c.status === 'resolved' || c.status === 'escalated'
    );
    const resolvedByAi = resolved.filter(c => c.resolved_by_ai).length;

    const ratings = allConversations
      .filter(c => c.satisfaction_rating)
      .map(c => c.satisfaction_rating);
    const avgSatisfaction = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // Get ticket stats
    const { count: openTickets } = await this.supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', this.businessId)
      .in('status', ['open', 'in_progress']);

    // Get category breakdown
    const { data: tickets } = await this.supabase
      .from('support_tickets')
      .select('category')
      .eq('business_id', this.businessId);

    const categoryCount: Record<string, number> = {};
    for (const ticket of tickets || []) {
      const cat = ticket.category || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalConversations: allConversations.length,
      resolvedByAi,
      aiResolutionRate: resolved.length > 0 ? resolvedByAi / resolved.length : 0,
      avgResponseTime: 0, // Would need message timestamps to calculate
      avgSatisfaction,
      openTickets: openTickets || 0,
      topCategories,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapConversationRow(row: any): SupportConversation {
    return {
      id: row.id,
      businessId: row.business_id,
      userId: row.user_id,
      sessionId: row.session_id,
      channel: row.channel,
      status: row.status,
      satisfactionRating: row.satisfaction_rating,
      resolvedByAi: row.resolved_by_ai,
      escalatedAt: row.escalated_at ? new Date(row.escalated_at) : undefined,
      createdAt: new Date(row.created_at),
      closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
    };
  }

  private mapMessageRow(row: any): SupportMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }

  private mapKnowledgeRow(row: any): SupportKnowledgeBase {
    return {
      id: row.id,
      businessId: row.business_id,
      category: row.category,
      question: row.question,
      answer: row.answer,
      keywords: row.keywords || [],
      helpfulCount: row.helpful_count || 0,
      notHelpfulCount: row.not_helpful_count || 0,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTicketRow(row: any): SupportTicket {
    return {
      id: row.id,
      businessId: row.business_id,
      conversationId: row.conversation_id,
      userId: row.user_id,
      subject: row.subject,
      description: row.description,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      category: row.category,
      tags: row.tags,
      resolution: row.resolution,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Factory function
export function createSupportAgent(businessId: string): SupportAgent {
  return new SupportAgent(businessId);
}

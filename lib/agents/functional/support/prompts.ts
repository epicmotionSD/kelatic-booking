// Support Agent - AI Prompts

export const SUPPORT_SYSTEM_PROMPT = `You are the Support Assistant Agent for x3o.ai, helping users of the platform get help with their questions and issues.

Your responsibilities:
1. Answer questions about using the platform
2. Troubleshoot common issues
3. Guide users through features
4. Escalate complex issues to human support when needed

Guidelines:
- Be helpful, patient, and friendly
- Provide clear, step-by-step instructions when needed
- If you don't know something, admit it and offer to escalate
- Detect user frustration and offer human support proactively
- Keep responses concise but complete
- Reference specific features and menu locations when possible

IMPORTANT: You are helping with a booking/scheduling platform. Common topics include:
- Creating and managing appointments
- Setting up availability
- Managing services and pricing
- Client management
- Payment processing
- Notifications and reminders
- Account settings

If a question is outside your knowledge, suggest contacting support.`;

export const CHAT_RESPONSE_PROMPT = (
  userMessage: string,
  conversationHistory: string,
  knowledgeContext: string,
  businessContext: string
) => `Respond to this user support message:

User Message: ${userMessage}

Conversation History:
${conversationHistory}

Relevant Knowledge Base:
${knowledgeContext}

Business Context:
${businessContext}

Provide a helpful response. Consider:
- Is this question answered in the knowledge base?
- Does the user seem frustrated?
- Should this be escalated to human support?
- Is there a feature that could help them?

Return JSON:
{
  "response": "Your helpful response to the user",
  "shouldEscalate": false,
  "escalationReason": "Only if shouldEscalate is true",
  "frustrationDetected": false,
  "suggestedFeature": {
    "name": "Feature name or null",
    "description": "Why this feature helps"
  },
  "followUpQuestions": ["Question 1?", "Question 2?"]
}`;

export const KNOWLEDGE_SEARCH_PROMPT = (
  query: string,
  articles: string
) => `Find the most relevant knowledge base articles for this query:

Query: ${query}

Available Articles:
${articles}

Return JSON:
{
  "relevantArticles": [
    {
      "id": "article_id",
      "relevance": 0.0-1.0,
      "matchReason": "Why this article matches"
    }
  ],
  "suggestedQueries": ["Alternative query 1", "Alternative query 2"]
}`;

export const TROUBLESHOOTING_PROMPT = (
  issue: string,
  context: string
) => `Create a troubleshooting guide for this issue:

Issue: ${issue}
Context: ${context}

Create a step-by-step troubleshooting guide with:
- Clear numbered steps
- Expected outcomes for each step
- When to escalate

Return JSON:
{
  "issue": "Issue summary",
  "steps": [
    {
      "step": 1,
      "instruction": "What to do",
      "expectedOutcome": "What should happen",
      "ifFailed": "What to try if this doesn't work"
    }
  ],
  "escalationCriteria": ["When to escalate to human support"],
  "estimatedTime": "5-10 minutes"
}`;

export const FEATURE_DISCOVERY_PROMPT = (
  userBehavior: string,
  availableFeatures: string
) => `Based on user behavior, suggest a helpful feature:

User Behavior:
${userBehavior}

Available Features:
${availableFeatures}

Return JSON:
{
  "suggestedFeature": {
    "name": "Feature name",
    "description": "What it does",
    "howToAccess": "Navigation path",
    "benefits": ["Benefit 1", "Benefit 2"],
    "relevanceScore": 0.0-1.0
  }
}`;

export const ESCALATION_PROMPT = (
  conversation: string,
  issue: string
) => `Analyze this support conversation for escalation:

Conversation:
${conversation}

Current Issue: ${issue}

Determine:
- Is escalation needed?
- What's the priority?
- What context should human support have?

Return JSON:
{
  "shouldEscalate": boolean,
  "priority": "low|medium|high|urgent",
  "reason": "Why escalation is or isn't needed",
  "summaryForAgent": "Brief summary for human support agent",
  "suggestedCategory": "billing|technical|account|other"
}`;

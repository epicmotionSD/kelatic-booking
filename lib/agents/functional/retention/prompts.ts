// Retention Agent - AI Prompts

export const RETENTION_SYSTEM_PROMPT = `You are the Client Retention Agent for x3o.ai, helping beauty and wellness businesses retain their clients and grow their VIP programs.

Your responsibilities:
1. Predict client churn using RFM analysis and behavioral patterns
2. Manage VIP tier programs and promotions/demotions
3. Trigger automated re-engagement campaigns
4. Identify win-back opportunities for churned clients
5. Provide personalized retention recommendations

Guidelines:
- Focus on long-term client relationships, not just transactions
- Personalize outreach based on client history and preferences
- Balance promotional offers with relationship building
- Prioritize high-value clients at risk of churning
- Track attribution to measure campaign effectiveness

Output format: Always respond with structured JSON when analyzing data.`;

export const CHURN_ANALYSIS_PROMPT = (
  clientData: string,
  appointmentHistory: string
) => `Analyze this client's churn risk:

Client Data:
${clientData}

Appointment History:
${appointmentHistory}

Calculate RFM (Recency, Frequency, Monetary) scores and churn probability.

Consider:
- Days since last visit
- Visit frequency trend
- Average spend per visit
- Service mix changes
- Cancellation patterns
- Seasonal factors

Return JSON:
{
  "rfmScores": {
    "recency": 1-5,
    "frequency": 1-5,
    "monetary": 1-5
  },
  "healthScore": 0-100,
  "healthStatus": "healthy|at_risk|churning|churned|new",
  "churnProbability": 0.0-1.0,
  "riskFactors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendations": ["action1", "action2"]
}`;

export const WIN_BACK_PROMPT = (
  clientData: string,
  lastServices: string
) => `Create a win-back strategy for this churned client:

Client Data:
${clientData}

Last Services Used:
${lastServices}

Consider:
- Why they might have left
- What brought them value before
- Appropriate win-back offer
- Best outreach channel
- Optimal timing

Return JSON:
{
  "strategy": "Brief strategy description",
  "recommendedOffer": {
    "type": "discount|free_service|upgrade|bundle",
    "value": "20% off or specific offer",
    "validity": "30 days"
  },
  "messageTemplate": "Personalized win-back message",
  "bestChannel": "email|sms|both",
  "urgency": "high|medium|low",
  "expectedResponse": "percentage likelihood"
}`;

export const VIP_EVALUATION_PROMPT = (
  clientData: string,
  tierRequirements: string
) => `Evaluate this client's VIP tier status:

Client Data:
${clientData}

Tier Requirements:
${tierRequirements}

Determine:
- Current tier appropriateness
- Whether promotion/demotion is warranted
- Progress toward next tier
- Special considerations

Return JSON:
{
  "currentTier": "standard|silver|gold|platinum",
  "recommendedTier": "standard|silver|gold|platinum",
  "shouldPromote": boolean,
  "shouldDemote": boolean,
  "reasoning": "Explanation",
  "nextTierProgress": {
    "spendNeeded": number,
    "visitsNeeded": number,
    "timeframe": "months to achieve"
  }
}`;

export const RETENTION_INSIGHTS_PROMPT = (
  segmentData: string
) => `Analyze client retention patterns and provide insights:

Segment Data:
${segmentData}

Identify:
- Key retention trends
- High-risk periods
- Successful retention tactics
- Improvement opportunities
- Segment-specific strategies

Return JSON:
{
  "insights": [
    {
      "type": "trend|warning|opportunity",
      "title": "Insight title",
      "description": "Detailed description",
      "recommendation": "Action to take",
      "impact": "high|medium|low",
      "affectedClients": number
    }
  ],
  "recommendations": [
    {
      "priority": 1-5,
      "action": "Specific action",
      "expectedOutcome": "What to expect",
      "targetSegment": "Which clients"
    }
  ]
}`;

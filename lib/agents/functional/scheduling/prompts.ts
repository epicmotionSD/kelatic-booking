// Scheduling Agent - AI Prompts

export const SCHEDULING_SYSTEM_PROMPT = `You are the Scheduling Intelligence Agent for x3o.ai, helping beauty and wellness businesses optimize their appointment scheduling.

Your responsibilities:
1. Predict appointment cancellations based on client history and patterns
2. Identify schedule gaps and suggest ways to fill them
3. Analyze client booking patterns for optimization
4. Provide smart scheduling recommendations

Guidelines:
- Use data-driven insights to make predictions
- Consider client history, booking patterns, and external factors
- Prioritize actions that maximize revenue and minimize no-shows
- Be proactive in identifying scheduling opportunities
- Always provide actionable recommendations

Output format: Always respond with structured JSON when analyzing data.`;

export const CANCELLATION_PREDICTION_PROMPT = (
  appointmentData: string,
  clientHistory: string
) => `Analyze this appointment for cancellation risk:

Appointment Data:
${appointmentData}

Client History:
${clientHistory}

Consider these factors:
- Past cancellation/no-show rate
- Time since last visit
- Day of week patterns
- Lead time (how far in advance booked)
- Service type
- Weather or seasonal factors
- Any notes or special circumstances

Return JSON:
{
  "riskScore": 0.0-1.0,
  "riskLevel": "low|medium|high|critical",
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "reasoning": "Brief explanation of the prediction"
}`;

export const GAP_ANALYSIS_PROMPT = (
  scheduleData: string,
  businessMetrics: string
) => `Analyze these schedule gaps and suggest how to fill them:

Schedule Data:
${scheduleData}

Business Metrics:
${businessMetrics}

Consider:
- Which gaps are most impactful (duration, time of day)
- Potential revenue loss
- Target clients for gap-filling offers
- Optimal discount or incentive to offer

Return JSON:
{
  "analysis": {
    "totalGaps": number,
    "totalLostRevenue": number,
    "utilizationRate": 0.0-1.0
  },
  "prioritizedGaps": [
    {
      "gapId": "string",
      "priority": "high|medium|low",
      "suggestedAction": "string",
      "targetClients": ["segment1", "segment2"],
      "suggestedOffer": "string or null"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

export const BOOKING_PATTERN_PROMPT = (
  clientData: string
) => `Analyze this client's booking patterns:

Client Data:
${clientData}

Identify:
- Preferred booking days and times
- Average time between visits
- Service preferences
- Cancellation/no-show patterns
- Lifetime value trends
- Churn risk indicators

Return JSON:
{
  "preferredDays": ["Monday", "Tuesday"],
  "preferredTimeSlots": ["morning", "afternoon"],
  "avgBookingFrequencyDays": number,
  "avgLeadTimeDays": number,
  "cancellationRate": 0.0-1.0,
  "noShowRate": 0.0-1.0,
  "nextPredictedVisit": "YYYY-MM-DD or null",
  "churnRisk": "low|medium|high",
  "insights": ["insight1", "insight2"]
}`;

export const SCHEDULING_INSIGHTS_PROMPT = (
  scheduleData: string,
  historicalData: string
) => `Provide scheduling insights based on this data:

Current Schedule:
${scheduleData}

Historical Data:
${historicalData}

Identify:
- Scheduling trends
- Optimization opportunities
- Warning signs (high cancellation days, etc.)
- Revenue opportunities

Return JSON:
{
  "insights": [
    {
      "type": "warning|opportunity|trend",
      "title": "Insight title",
      "description": "Detailed description",
      "recommendation": "Action to take",
      "impact": "high|medium|low"
    }
  ]
}`;

// Marketing Agent - AI Prompts

export const MARKETING_SYSTEM_PROMPT = `You are the Marketing Campaign Agent for x3o.ai, a platform that helps beauty and wellness businesses automate their marketing.

Your responsibilities:
1. Generate engaging content calendars based on seasonality and business goals
2. Create compelling social media posts, email campaigns, and promotions
3. Analyze campaign performance and suggest optimizations
4. Identify marketing opportunities and trends

Guidelines:
- Always align content with the business's brand voice and target audience
- Consider seasonality (holidays, seasons, local events)
- Focus on driving bookings and client retention
- Use persuasive but authentic language
- Include clear calls-to-action
- Optimize for each platform's best practices

Output format: Always respond with structured JSON when generating content.`;

export const CONTENT_CALENDAR_PROMPT = (
  businessName: string,
  month: string,
  year: number,
  themes: string[],
  platforms: string[],
  postsPerWeek: number
) => `Generate a content calendar for ${businessName} for ${month} ${year}.

Themes to incorporate: ${themes.join(', ')}
Platforms: ${platforms.join(', ')}
Posts per week: ${postsPerWeek}

Consider:
- Any holidays or special events in ${month}
- Seasonal beauty/wellness trends
- Client engagement opportunities
- Mix of promotional, educational, and engagement content

Return a JSON array with this structure:
{
  "calendar": [
    {
      "date": "YYYY-MM-DD",
      "title": "Post title",
      "contentType": "promotional|educational|engagement|behind_the_scenes|testimonial",
      "description": "Full post content",
      "platforms": ["instagram", "facebook"],
      "suggestedTime": "10:00 AM",
      "hashtags": ["#tag1", "#tag2"],
      "callToAction": "Book now at..."
    }
  ]
}`;

export const SOCIAL_POST_PROMPT = (
  businessName: string,
  platform: string,
  postType: string,
  topic: string,
  bookingUrl: string
) => `Write a ${platform} post for ${businessName}.

Type: ${postType}
Topic: ${topic}
Booking URL: ${bookingUrl}

Platform-specific guidelines:
- Instagram: 2200 char max, use emojis, 3-5 hashtags at end
- Facebook: Conversational tone, can be longer, minimal hashtags
- Twitter: 280 chars max, punchy and engaging
- Email: Subject line + body, professional but warm

Return JSON:
{
  "content": "The full post content",
  "hashtags": ["#tag1"],
  "emojis": true,
  "estimatedEngagement": "high|medium|low",
  "bestPostTime": "HH:MM AM/PM"
}`;

export const EMAIL_CAMPAIGN_PROMPT = (
  businessName: string,
  campaignType: string,
  targetSegment: string,
  offer?: string
) => `Write an email campaign for ${businessName}.

Campaign type: ${campaignType}
Target segment: ${targetSegment}
${offer ? `Special offer: ${offer}` : ''}

Return JSON:
{
  "subject": "Email subject line",
  "preheader": "Preview text",
  "headline": "Main headline",
  "body": "Email body content (HTML-friendly)",
  "callToAction": "Button text",
  "urgency": "Create urgency if applicable",
  "personalizations": ["{{first_name}}", "{{last_service}}"]
}`;

export const CAMPAIGN_ANALYSIS_PROMPT = (
  campaignData: string
) => `Analyze this marketing campaign performance:

${campaignData}

Provide:
1. Performance summary
2. What's working well
3. What needs improvement
4. Specific recommendations
5. Next steps

Return JSON:
{
  "summary": "Brief performance summary",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": [
    {
      "action": "Specific action to take",
      "expectedImpact": "high|medium|low",
      "priority": 1
    }
  ],
  "nextSteps": ["step1", "step2"]
}`;

export const MARKETING_INSIGHTS_PROMPT = (
  businessData: string
) => `Based on this business data, identify marketing opportunities:

${businessData}

Look for:
- Seasonal opportunities
- Underserved client segments
- Upselling opportunities
- Re-engagement opportunities
- Trending services

Return JSON:
{
  "insights": [
    {
      "type": "opportunity|warning|trend",
      "title": "Insight title",
      "description": "Detailed description",
      "recommendation": "What to do",
      "impact": "high|medium|low",
      "urgency": "immediate|soon|ongoing"
    }
  ]
}`;

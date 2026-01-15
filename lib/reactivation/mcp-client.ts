// =============================================================================
// MCP CLIENT WRAPPER
// Currently mocked - replace with real MCP client connection
// =============================================================================

import type {
  Lead,
  SegmentedLead,
  Segment,
  ROICalculation,
  CampaignStrategy,
  Script,
  Campaign,
  TCPAValidation,
  SMSBatchResult,
  ScriptVariant,
  Channel,
  CampaignGoal,
} from '@/types/reactivation'

// =============================================================================
// MCP CLIENT CONFIGURATION
// TODO: Replace this mock with real MCP client
// =============================================================================

const USE_MOCK = true // Set to false when MCP client is wired in

// If using Claude Desktop MCP, you might connect like:
// import { Client } from '@modelcontextprotocol/sdk/client/index.js'
// const mcpClient = new Client({ name: 'x3o-reactivation' })

// If calling MCP server directly via HTTP (if you expose it):
// const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001'

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

function generateMockLeads(count: number, source: string): Lead[] {
  const firstNames = ['Sarah', 'Mike', 'Jessica', 'David', 'Emily', 'Chris', 'Ashley', 'James', 'Nicole', 'Brian']
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Anderson', 'Taylor']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `lead_${Date.now()}_${i}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    phone: `555${String(1000000 + i).slice(-7)}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}${i}@example.com`,
    source,
    firstContact: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastContact: Math.random() > 0.3 
      ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  }))
}

function segmentLead(lead: Lead, industry: string): SegmentedLead {
  const daysSinceContact = lead.lastContact 
    ? Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / (24 * 60 * 60 * 1000))
    : 365
  
  let segment: Segment
  let riskProfile: 'high' | 'medium' | 'low'
  let conversionRate: number
  
  if (daysSinceContact > 180) {
    segment = 'ghost'
    riskProfile = 'high'
    conversionRate = 0.01
  } else if (daysSinceContact > 30) {
    segment = 'near-miss'
    riskProfile = 'medium'
    conversionRate = 0.05
  } else {
    segment = 'vip'
    riskProfile = 'low'
    conversionRate = 0.15
  }
  
  // Industry AOV estimates
  const aovByIndustry: Record<string, number> = {
    'medical-spa': 450,
    'salon': 85,
    'barbershop': 35,
    'spa': 150,
    'nails': 55,
    'lashes': 120,
    'legal': 2500,
    'dental': 350,
    'default': 100,
  }
  
  const aov = aovByIndustry[industry] || aovByIndustry['default']
  const estimatedValue = aov * conversionRate
  
  const scriptMap: Record<Segment, ScriptVariant> = {
    'ghost': 'direct-inquiry',
    'near-miss': 'file-closure',
    'vip': 'gift',
  }
  
  return {
    ...lead,
    segment,
    riskProfile,
    estimatedValue,
    daysSinceContact,
    recommendedScript: scriptMap[segment],
  }
}

// =============================================================================
// MCP TOOL WRAPPERS
// Each function mirrors the MCP tool signature
// =============================================================================

export async function parseContactFile(params: {
  file_path: string
  source_platform?: string
  response_format?: 'markdown' | 'json'
}): Promise<Lead[]> {
  if (USE_MOCK) {
    // Mock: Generate 50-200 random leads
    const count = 50 + Math.floor(Math.random() * 150)
    return generateMockLeads(count, params.source_platform || 'unknown')
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:parse_contact_file', params)
  throw new Error('MCP client not configured')
}

export async function segmentLeads(params: {
  leads: string // JSON array or file path
  industry?: string
  response_format?: 'markdown' | 'json'
}): Promise<SegmentedLead[]> {
  if (USE_MOCK) {
    const leads: Lead[] = JSON.parse(params.leads)
    return leads.map(lead => segmentLead(lead, params.industry || 'default'))
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:segment_leads', params)
  throw new Error('MCP client not configured')
}

export async function validateTCPACompliance(params: {
  leads: string // JSON array
  contact_date?: string // YYYY-MM-DD
  relationship_type?: 'inquiry' | 'ebr' | 'unknown'
  response_format?: 'markdown' | 'json'
}): Promise<TCPAValidation> {
  if (USE_MOCK) {
    const leads: Lead[] = JSON.parse(params.leads)
    const compliant: Lead[] = []
    const nonCompliant: Lead[] = []
    const warnings: string[] = []
    
    const now = new Date()
    const eighteenMonthsAgo = new Date(now.getTime() - 18 * 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    for (const lead of leads) {
      const lastContact = lead.lastContact ? new Date(lead.lastContact) : new Date(lead.firstContact)
      const isEBR = params.relationship_type === 'ebr'
      const cutoff = isEBR ? eighteenMonthsAgo : ninetyDaysAgo
      
      if (lastContact > cutoff) {
        compliant.push(lead)
      } else {
        nonCompliant.push(lead)
      }
    }
    
    if (nonCompliant.length > 0) {
      warnings.push(`${nonCompliant.length} leads exceed TCPA contact window. Consider re-consent campaign.`)
    }
    
    return {
      compliant,
      nonCompliant,
      warnings,
      summary: {
        compliantCount: compliant.length,
        nonCompliantCount: nonCompliant.length,
        complianceRate: compliant.length / leads.length,
      },
    }
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:validate_tcpa_compliance', params)
  throw new Error('MCP client not configured')
}

export async function calculateReactivationValue(params: {
  total_leads: number
  segment?: Segment
  average_order_value?: number
  campaign_cost?: number
  response_format?: 'markdown' | 'json'
}): Promise<ROICalculation> {
  if (USE_MOCK) {
    const conversionRates: Record<Segment, number> = {
      'ghost': 0.01,
      'near-miss': 0.05,
      'vip': 0.15,
    }
    
    const rate = params.segment 
      ? conversionRates[params.segment] 
      : 0.04 // Blended average
    
    const aov = params.average_order_value || 200
    const cost = params.campaign_cost || 0
    const expectedBookings = Math.round(params.total_leads * rate)
    const expectedRevenue = expectedBookings * aov
    const netProfit = expectedRevenue - cost
    const roiPercentage = cost > 0 ? ((netProfit / cost) * 100) : 0
    const breakEvenBookings = cost > 0 ? Math.ceil(cost / aov) : 0
    
    return {
      totalLeads: params.total_leads,
      segment: params.segment,
      expectedBookings,
      expectedRevenue,
      campaignCost: cost,
      netProfit,
      roiPercentage,
      breakEvenBookings,
      conversionRate: rate,
    }
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:calculate_reactivation_value', params)
  throw new Error('MCP client not configured')
}

export async function generateCampaignStrategy(params: {
  total_leads: number
  industry?: string
  budget?: number
  goal?: CampaignGoal
  response_format?: 'markdown' | 'json'
}): Promise<CampaignStrategy> {
  if (USE_MOCK) {
    const total = params.total_leads
    // Typical distribution
    const ghostCount = Math.round(total * 0.45)
    const nearMissCount = Math.round(total * 0.35)
    const vipCount = total - ghostCount - nearMissCount
    
    const budget = params.budget || 1500
    
    return {
      totalLeads: total,
      industry: params.industry || 'default',
      budget,
      goal: params.goal || 'bookings',
      segmentAllocation: {
        ghost: { 
          count: ghostCount, 
          budget: Math.round(budget * 0.3), 
          expectedROI: 120 
        },
        nearMiss: { 
          count: nearMissCount, 
          budget: Math.round(budget * 0.45), 
          expectedROI: 280 
        },
        vip: { 
          count: vipCount, 
          budget: Math.round(budget * 0.25), 
          expectedROI: 450 
        },
      },
      recommendedCadence: 'hummingbird',
      dailySendVolume: Math.min(100, Math.ceil(total / 7)),
      rolloutWeeks: Math.ceil(total / 500),
      complianceNotes: [
        'All messages include STOP opt-out (TCPA required)',
        'Send window: 9am-8pm local time only (TCPA required)',
        'Max 3 messages per lead per campaign',
        'Daily volume limited by A2P 10DLC trust score',
        'Pre-send opt-out verification on each message',
      ],
      riskMitigation: [
        'Start with VIP segment (lowest risk, highest conversion)',
        'Monitor response rates before scaling to Ghost segment',
        'Pause if complaint rate exceeds 0.5%',
      ],
    }
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:generate_campaign_strategy', params)
  throw new Error('MCP client not configured')
}

export async function recommendScript(params: {
  segment: Segment
  business_name?: string
  service?: string
  include_all_variants?: boolean
  response_format?: 'markdown' | 'json'
}): Promise<Script | Script[]> {
  if (USE_MOCK) {
    // TCPA COMPLIANCE: All SMS templates include mandatory opt-out language
    const scripts: Record<ScriptVariant, Script> = {
      'direct-inquiry': {
        variant: 'direct-inquiry',
        template: `Hi {firstName}, are you still looking to get {service} done? - ${params.business_name || '{businessName}'}\n\nReply STOP to opt out`,
        segment: 'ghost',
        characterCount: 95,
        usageGuidelines: 'Best for ghost leads. Keep it simple, no links. TCPA compliant.',
      },
      'file-closure': {
        variant: 'file-closure',
        template: `Hi {firstName}, I was about to close your file. Should I keep it open? - ${params.business_name || '{businessName}'}\n\nReply STOP to opt out`,
        segment: 'near-miss',
        characterCount: 109,
        usageGuidelines: 'Triggers loss aversion. Great for 30-90 day gaps. TCPA compliant.',
      },
      'gift': {
        variant: 'gift',
        template: `Hi {firstName}, I have a complimentary {service} upgrade for you this week. Want me to save you a spot? - ${params.business_name || '{businessName}'}\n\nReply STOP to opt out`,
        segment: 'vip',
        characterCount: 142,
        usageGuidelines: 'Value-first approach. Use for recent, high-value clients. TCPA compliant.',
      },
      'breakup': {
        variant: 'breakup',
        template: `Hi {firstName}, I'll take you off our list. If you ever need {service} again, just text back. - ${params.business_name || '{businessName}'}`,
        segment: 'ghost',
        characterCount: 98,
        usageGuidelines: 'Final message only. No opt-out needed as this IS the opt-out.',
      },
    }
    
    if (params.include_all_variants) {
      return Object.values(scripts)
    }
    
    const segmentToScript: Record<Segment, ScriptVariant> = {
      'ghost': 'direct-inquiry',
      'near-miss': 'file-closure',
      'vip': 'gift',
    }
    
    return scripts[segmentToScript[params.segment]]
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:recommend_script', params)
  throw new Error('MCP client not configured')
}

export async function createReactivationCampaign(params: {
  campaign_name: string
  leads: string // JSON array
  segment: Segment
  script_variant: ScriptVariant
  channels?: Channel[]
  use_hummingbird_cadence?: boolean
  custom_cadence?: Array<{
    day: number
    time: string
    channel: Channel
    messageTemplate: string
  }>
  response_format?: 'markdown' | 'json'
}): Promise<Campaign> {
  if (USE_MOCK) {
    const leads: SegmentedLead[] = JSON.parse(params.leads)
    
    const hummingbirdCadence = [
      { day: 1, time: '09:00', channel: 'sms' as Channel, messageTemplate: 'direct-inquiry' },
      { day: 1, time: '09:05', channel: 'email' as Channel, messageTemplate: 'direct-inquiry' },
      { day: 2, time: '11:00', channel: 'voice' as Channel, messageTemplate: 'voicemail' },
      { day: 4, time: '14:00', channel: 'sms' as Channel, messageTemplate: 'file-closure' },
      { day: 7, time: '10:00', channel: 'sms' as Channel, messageTemplate: 'breakup' },
    ]
    
    return {
      id: `campaign_${Date.now()}`,
      name: params.campaign_name,
      tenantId: 'mock_tenant',
      segment: params.segment,
      scriptVariant: params.script_variant,
      leads,
      cadence: params.use_hummingbird_cadence !== false 
        ? hummingbirdCadence 
        : (params.custom_cadence || hummingbirdCadence),
      status: 'draft',
      createdAt: new Date().toISOString(),
      metrics: {
        sent: 0,
        delivered: 0,
        responses: 0,
        bookings: 0,
        revenue: 0,
      },
    }
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:create_reactivation_campaign', params)
  throw new Error('MCP client not configured')
}

export async function sendSMSBatch(params: {
  leads: string // JSON array with phone numbers
  message_template: string
  variables?: Record<string, string>
  provider?: 'notificationapi' | 'twilio' | 'simulate'
  dry_run?: boolean
  api_key?: string
  response_format?: 'markdown' | 'json'
}): Promise<SMSBatchResult> {
  if (USE_MOCK || params.dry_run !== false) {
    const leads: Lead[] = JSON.parse(params.leads)
    
    return {
      success: true,
      sent: leads.length,
      failed: 0,
      cost: leads.length * 0.0075, // ~$0.0075 per SMS
      dryRun: params.dry_run !== false,
      results: leads.map(lead => ({
        phone: lead.phone,
        status: 'simulated' as const,
        message: params.message_template
          .replace('{firstName}', lead.firstName)
          .replace('{lastName}', lead.lastName),
      })),
    }
  }
  
  // TODO: Real MCP call
  // return await mcpClient.call('lead-reactivation:send_sms_batch', params)
  throw new Error('MCP client not configured')
}

// =============================================================================
// LEAD REACTIVATION TYPES
// These mirror the MCP tool response schemas from lead-reactivation server
// =============================================================================

export type Segment = 'ghost' | 'near-miss' | 'vip'
export type RiskProfile = 'high' | 'medium' | 'low'
export type ScriptVariant = 'direct-inquiry' | 'file-closure' | 'gift' | 'breakup'
export type Channel = 'sms' | 'rcs' | 'email' | 'voice'
export type CampaignGoal = 'bookings' | 'engagement' | 'revenue'

export interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string // Cleaned, 10 digits
  email?: string
  source: string
  firstContact: string // ISO date
  lastContact?: string // ISO date
}

export interface SegmentedLead extends Lead {
  segment: Segment
  riskProfile: RiskProfile
  estimatedValue: number
  daysSinceContact: number
  recommendedScript: ScriptVariant
}

export interface SegmentSummary {
  ghost: number
  nearMiss: number
  vip: number
  total: number
  compliant: number
  nonCompliant: number
}

export interface ROICalculation {
  totalLeads: number
  segment?: Segment
  expectedBookings: number
  expectedRevenue: number
  campaignCost: number
  netProfit: number
  roiPercentage: number
  breakEvenBookings: number
  conversionRate: number
}

export interface CampaignStrategy {
  totalLeads: number
  industry: string
  budget?: number
  goal: CampaignGoal
  segmentAllocation: {
    ghost: { count: number; budget: number; expectedROI: number }
    nearMiss: { count: number; budget: number; expectedROI: number }
    vip: { count: number; budget: number; expectedROI: number }
  }
  recommendedCadence: string
  dailySendVolume: number
  rolloutWeeks: number
  complianceNotes: string[]
  riskMitigation: string[]
}

export interface Script {
  variant: ScriptVariant
  template: string
  segment: Segment
  characterCount: number
  usageGuidelines: string
}

export interface CadenceStep {
  day: number
  time: string // HH:MM format
  channel: Channel
  messageTemplate: string
}

export interface Campaign {
  id: string
  name: string
  tenantId: string
  segment: Segment
  scriptVariant: ScriptVariant
  leads: SegmentedLead[]
  cadence: CadenceStep[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: string
  metrics: {
    sent: number
    delivered: number
    responses: number
    bookings: number
    revenue: number
  }
}

export interface TCPAValidation {
  compliant: Lead[]
  nonCompliant: Lead[]
  warnings: string[]
  summary: {
    compliantCount: number
    nonCompliantCount: number
    complianceRate: number
  }
}

export interface SMSBatchResult {
  success: boolean
  sent: number
  failed: number
  cost: number
  dryRun: boolean
  results: {
    phone: string
    status: 'sent' | 'failed' | 'simulated'
    message: string
  }[]
}

// API Response Types
export interface ParseResponse {
  success: boolean
  summary: SegmentSummary
  leads: SegmentedLead[]
  tcpaWarnings: string[]
  filePath: string
}

export interface AnalyzeResponse {
  success: boolean
  analysis: {
    totalLeads: number
    totalEstimatedValue: number
    sprintCost: number
    projectedROI: number
    projectedBookings: number
    projectedRevenue: number
    breakEvenBookings: number
    bySegment: Record<Segment, ROICalculation>
  }
  strategy: CampaignStrategy
  headline: {
    primary: string
    secondary: string
    guarantee: string
  }
}

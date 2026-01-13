// =============================================================================
// POST /api/reactivation/analyze
// Calculates ROI projections and generates campaign strategy
// Called AFTER parse to show the "Analyze" step in onboarding
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  calculateReactivationValue,
  generateCampaignStrategy,
} from '@/lib/reactivation/mcp-client'
import type { SegmentedLead, Segment } from '@/types/reactivation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      tenantId,
      leads,
      industry,
      sprintCost = 1500,
    }: {
      tenantId: string
      leads: SegmentedLead[]
      industry: string
      sprintCost?: number
    } = body
    
    if (!leads || !leads.length) {
      return NextResponse.json(
        { error: 'Leads data required' },
        { status: 400 }
      )
    }
    
    // Calculate ROI for each segment
    const segments: Segment[] = ['ghost', 'near-miss', 'vip']
    const segmentROI: Record<Segment, Awaited<ReturnType<typeof calculateReactivationValue>>> = {} as Record<Segment, Awaited<ReturnType<typeof calculateReactivationValue>>>
    
    for (const segment of segments) {
      const segmentLeads = leads.filter(l => l.segment === segment)
      if (segmentLeads.length > 0) {
        segmentROI[segment] = await calculateReactivationValue({
          total_leads: segmentLeads.length,
          segment,
          campaign_cost: sprintCost * (segmentLeads.length / leads.length),
          response_format: 'json',
        })
      }
    }
    
    // Calculate total/blended ROI
    const totalROI = await calculateReactivationValue({
      total_leads: leads.length,
      campaign_cost: sprintCost,
      response_format: 'json',
    })
    
    // Generate strategy
    const strategy = await generateCampaignStrategy({
      total_leads: leads.length,
      industry,
      budget: sprintCost,
      goal: 'bookings',
      response_format: 'json',
    })
    
    // Calculate total estimated value from segmented leads
    const totalEstimatedValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
    
    return NextResponse.json({
      success: true,
      analysis: {
        totalLeads: leads.length,
        totalEstimatedValue: Math.round(totalEstimatedValue),
        sprintCost,
        projectedROI: totalROI.roiPercentage,
        projectedBookings: totalROI.expectedBookings,
        projectedRevenue: totalROI.expectedRevenue,
        breakEvenBookings: totalROI.breakEvenBookings,
        bySegment: segmentROI,
      },
      strategy,
      // Generate a "headline" for the UI
      headline: {
        primary: `$${Math.round(totalEstimatedValue).toLocaleString()} in recoverable revenue`,
        secondary: `From ${leads.filter(l => l.segment === 'ghost').length} ghost clients`,
        guarantee: totalROI.expectedBookings >= totalROI.breakEvenBookings
          ? 'ROI Guaranteed'
          : 'Break-even achievable',
      },
    })
    
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze leads', details: String(error) },
      { status: 500 }
    )
  }
}

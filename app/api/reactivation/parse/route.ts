// =============================================================================
// POST /api/reactivation/parse
// Handles CSV upload, parses contacts, segments them, validates TCPA
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import {
  parseContactFile,
  segmentLeads,
  validateTCPACompliance,
} from '@/lib/reactivation/mcp-client'
import type { SegmentSummary } from '@/types/reactivation'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Extract form fields
    const file = formData.get('csv') as File | null
    const platform = formData.get('platform') as string || 'unknown'
    const industry = formData.get('industry') as string || 'default'
    const tenantId = formData.get('tenantId') as string || 'onboarding'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      )
    }
    
    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadDir = join(process.cwd(), 'tmp', 'uploads', tenantId)
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = join(uploadDir, `${Date.now()}_${file.name}`)
    await writeFile(filePath, buffer)
    
    // Step 1: Parse the CSV
    const rawLeads = await parseContactFile({
      file_path: filePath,
      source_platform: platform,
      response_format: 'json',
    })
    
    // Step 2: Segment the leads
    const segmentedLeads = await segmentLeads({
      leads: JSON.stringify(rawLeads),
      industry,
      response_format: 'json',
    })
    
    // Step 3: Validate TCPA compliance
    const tcpaValidation = await validateTCPACompliance({
      leads: JSON.stringify(rawLeads),
      relationship_type: 'inquiry', // Default to inquiry (90 days)
      response_format: 'json',
    })
    
    // Calculate summary
    const summary: SegmentSummary = {
      ghost: segmentedLeads.filter(l => l.segment === 'ghost').length,
      nearMiss: segmentedLeads.filter(l => l.segment === 'near-miss').length,
      vip: segmentedLeads.filter(l => l.segment === 'vip').length,
      total: segmentedLeads.length,
      compliant: tcpaValidation.summary.compliantCount,
      nonCompliant: tcpaValidation.summary.nonCompliantCount,
    }
    
    // NOTE: Parsed leads are intentionally NOT persisted here. This is the
    // onboarding/preview step — there is no campaign yet, and `campaign_leads`
    // requires a `campaign_id` + a real `business_id`. Persistence happens when
    // the owner launches a campaign: POST /api/reactivation/launch creates the
    // campaign and inserts these leads into `campaign_leads`. The segmented
    // leads are returned below so the UI can hold them in state until launch.

    // Return summary for UI + full data for state
    return NextResponse.json({
      success: true,
      summary,
      leads: segmentedLeads,
      tcpaWarnings: tcpaValidation.warnings,
      filePath, // For reference
   
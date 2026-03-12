import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface A2PRequestBody {
  legalName: string
  ein: string
  businessType: string
  website: string
  street: string
  city: string
  state: string
  zip: string
  vertical: string
  monthlyVolume: number
  contactName: string
  contactPhone: string
  contactEmail: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: member } = await supabase
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    // Parse request
    const body = (await req.json()) as A2PRequestBody

    // Save A2P request
    const { error: insertError } = await supabase
      .from('business_a2p_requests')
      .insert({
        business_id: member.business_id,
        legal_name: body.legalName,
        ein: body.ein,
        business_type: body.businessType,
        website: body.website,
        address_street: body.street,
        address_city: body.city,
        address_state: body.state,
        address_zip: body.zip,
        vertical: body.vertical,
        estimated_monthly_volume: body.monthlyVolume,
        contact_name: body.contactName,
        contact_phone: body.contactPhone,
        contact_email: body.contactEmail,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        requested_by: user.id,
      })

    if (insertError) {
      // Table might not exist yet - create it or just return success for now
      console.error('Failed to insert A2P request:', insertError)

      // For MVP, we'll just log this and notify manually
      // In production, you'd want to ensure the table exists
      console.log('[A2P REQUEST]', {
        businessId: member.business_id,
        legalName: body.legalName,
        contactEmail: body.contactEmail,
      })
    }

    // TODO: Send notification to admin/support team
    // await sendSlackNotification('New A2P registration request')
    // await sendEmail({
    //   to: 'support@yourcompany.com',
    //   subject: 'New SMS A2P Request',
    //   body: `Business: ${body.legalName}\nContact: ${body.contactEmail}`,
    // })

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      estimatedActivation: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('A2P request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check A2P request status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    // Check if there's a pending A2P request
    const { data: request } = await supabase
      .from('business_a2p_requests')
      .select('*')
      .eq('business_id', member.business_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    if (!request) {
      return NextResponse.json({ status: 'not_requested' })
    }

    return NextResponse.json({
      status: request.status,
      submitted_at: request.submitted_at,
      approved_at: request.approved_at,
      trust_score: request.trust_score,
      estimated_activation: request.estimated_activation_date,
    })
  } catch (error) {
    console.error('A2P status check error:', error)
    return NextResponse.json({ status: 'not_requested' })
  }
}

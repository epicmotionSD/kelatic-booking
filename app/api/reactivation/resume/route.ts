import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { inngest } from '@/lib/inngest/client'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { campaignId, businessId } = body as { campaignId?: string; businessId?: string }

    if (!campaignId || !businessId) {
      return NextResponse.json({ error: 'campaignId and businessId are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    await supabase
      .from('campaigns')
      .update({ status: 'active', paused_at: null, started_at: new Date().toISOString(), current_day: 1 })
      .eq('id', campaignId)

    await inngest.send({
      name: 'campaign/started',
      data: { campaignId, businessId },
    })

    return NextResponse.json({ success: true, campaignId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resume campaign', details: String(error) }, { status: 500 })
  }
}

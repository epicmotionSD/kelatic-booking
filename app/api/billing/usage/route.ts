import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/types/billing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const { data: member, error: memberError } = await supabase
      .from('business_members')
      .select('business_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Get business to check plan
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('plan, subscription_current_period_end')
      .eq('id', member.business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const plan = business.plan || 'free';
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get campaigns count this month
    const periodStart = business.subscription_current_period_end
      ? new Date(new Date(business.subscription_current_period_end).getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', member.business_id)
      .gte('created_at', periodStart.toISOString());

    const campaignsCount = campaigns || 0;

    // Get contacts/clients count
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', member.business_id);

    const clientsCount = clients || 0;

    // Get SMS messages count this month
    const { data: messages, error: messagesError } = await supabase
      .from('campaign_messages')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', member.business_id)
      .eq('direction', 'outbound')
      .eq('channel', 'sms')
      .gte('created_at', periodStart.toISOString());

    const smsCount = messages || 0;

    return NextResponse.json({
      campaigns: {
        used: campaignsCount,
        limit: limits.campaigns_per_month,
        percentage: limits.campaigns_per_month > 0
          ? Math.round((campaignsCount / limits.campaigns_per_month) * 100)
          : 0,
      },
      contacts: {
        used: clientsCount,
        limit: limits.team_members * 500, // Approximate contacts limit based on plan
        percentage: Math.min(100, Math.round((clientsCount / (limits.team_members * 500)) * 100)),
      },
      sms: {
        used: smsCount,
        limit: limits.sms_messages_per_month,
        percentage: limits.sms_messages_per_month > 0
          ? Math.round((smsCount / limits.sms_messages_per_month) * 100)
          : 0,
      },
      period_end: business.subscription_current_period_end,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get usage' },
      { status: 500 }
    );
  }
}

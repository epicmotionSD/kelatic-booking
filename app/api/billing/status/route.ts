import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionDetails } from '@/lib/stripe/subscriptions';

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

    // Get subscription details
    const details = await getSubscriptionDetails(member.business_id);

    return NextResponse.json({
      ...details,
      // Add computed fields for UI
      isActive: ['active', 'trialing'].includes(details.plan_status),
      isTrialing: details.plan_status === 'trialing',
      isPastDue: details.plan_status === 'past_due',
      isCanceled: details.plan_status === 'canceled',
      willCancelAtPeriodEnd: details.subscription_cancel_at_period_end,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

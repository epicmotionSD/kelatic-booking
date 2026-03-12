import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reactivateSubscription } from '@/lib/stripe/subscriptions';

export async function POST(request: NextRequest) {
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

    // Check if user is owner/admin
    if (!['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can reactivate subscriptions' },
        { status: 403 }
      );
    }

    // Reactivate subscription
    const subscription = await reactivateSubscription(member.business_id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}

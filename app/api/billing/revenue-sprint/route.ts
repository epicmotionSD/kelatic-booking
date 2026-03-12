import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOneTimeCheckout, SUBSCRIPTION_PRODUCTS } from '@/lib/stripe/subscriptions';

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
        { error: 'Business not found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    // Check if user is owner/admin
    if (!['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can purchase Revenue Sprints' },
        { status: 403 }
      );
    }

    const businessId = member.business_id;

    // Get price ID for Revenue Sprint
    const product = SUBSCRIPTION_PRODUCTS.REVENUE_SPRINT;

    if (!product || !product.priceId) {
      return NextResponse.json(
        { error: 'Product not configured. Set STRIPE_PRICE_REVENUE_SPRINT env var.' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session for one-time payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createOneTimeCheckout({
      businessId,
      priceId: product.priceId,
      successUrl: `${appUrl}/admin/campaigns?sprint_success=true`,
      cancelUrl: `${appUrl}/admin/billing?sprint_canceled=true`,
      metadata: {
        product_type: 'revenue_sprint',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Revenue Sprint checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

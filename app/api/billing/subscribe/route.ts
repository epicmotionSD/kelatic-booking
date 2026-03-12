import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession, SUBSCRIPTION_PRODUCTS } from '@/lib/stripe/subscriptions';

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

    const body = await request.json();
    const { plan, trialDays } = body;

    // Validate plan
    if (!plan || !['trinity_monthly', 'trinity_annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be trinity_monthly or trinity_annual' },
        { status: 400 }
      );
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
        { error: 'Only owners and admins can manage subscriptions' },
        { status: 403 }
      );
    }

    const businessId = member.business_id;

    // Check if already has active subscription
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_subscription_id, plan_status')
      .eq('id', businessId)
      .single();

    if (
      business?.stripe_subscription_id &&
      ['active', 'trialing'].includes(business.plan_status)
    ) {
      return NextResponse.json(
        { error: 'Already has an active subscription' },
        { status: 400 }
      );
    }

    // Get price ID for selected plan
    const productKey = plan.toUpperCase().replace('_', '_') as keyof typeof SUBSCRIPTION_PRODUCTS;
    const product = SUBSCRIPTION_PRODUCTS[productKey];

    if (!product || !product.priceId) {
      return NextResponse.json(
        { error: 'Product not configured. Set STRIPE_PRICE_TRINITY_MONTHLY env var.' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      businessId,
      priceId: product.priceId,
      successUrl: `${appUrl}/admin/billing?success=true`,
      cancelUrl: `${appUrl}/admin/billing?canceled=true`,
      trialDays: trialDays || 14, // Default 14-day trial
      metadata: {
        plan,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

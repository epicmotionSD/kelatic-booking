import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, source = 'website', interests = [] } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, subscribed')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Re-subscribe if previously unsubscribed
      if (!existing.subscribed) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            subscribed: true,
            first_name: firstName || undefined,
            interests: interests.length > 0 ? interests : undefined,
            unsubscribed_at: null,
            unsubscribe_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error re-subscribing:', error);
          return NextResponse.json(
            { error: 'Failed to re-subscribe' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Welcome back! You have been re-subscribed.',
          resubscribed: true,
        });
      }

      // Already subscribed
      return NextResponse.json({
        message: 'You are already subscribed!',
        alreadySubscribed: true,
      });
    }

    // Create new subscriber
    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: email.toLowerCase(),
      first_name: firstName || null,
      source,
      interests: interests.length > 0 ? interests : null,
      subscribed: true,
    });

    if (error) {
      console.error('Error subscribing:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully subscribed to our newsletter!',
      success: true,
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find subscriber
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, subscribed')
      .eq('email', email.toLowerCase())
      .single();

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Email not found in our newsletter list' },
        { status: 404 }
      );
    }

    if (!subscriber.subscribed) {
      return NextResponse.json({
        message: 'You are already unsubscribed',
        alreadyUnsubscribed: true,
      });
    }

    // Unsubscribe
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        subscribed: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'You have been unsubscribed from our newsletter',
      success: true,
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Also support GET for email link unsubscribe
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=missing-email', request.url)
    );
  }

  // Simple token validation (in production, use a proper signed token)
  const expectedToken = Buffer.from(email.toLowerCase()).toString('base64');
  if (token !== expectedToken) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=invalid-token', request.url)
    );
  }

  // Unsubscribe
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      subscribed: false,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: 'Clicked unsubscribe link',
      updated_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase());

  if (error) {
    return NextResponse.redirect(
      new URL('/unsubscribe?error=failed', request.url)
    );
  }

  return NextResponse.redirect(
    new URL('/unsubscribe?success=true', request.url)
  );
}

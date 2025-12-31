import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBulkNewsletter, type NewsletterContent } from '@/lib/notifications/service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch subscribers list and stats
export async function GET() {
  try {
    // Get subscriber stats
    const { count: totalSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true);

    const { count: totalUnsubscribed } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', false);

    // Get recent subscribers
    const { data: recentSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, first_name, source, created_at')
      .eq('subscribed', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get subscriber sources breakdown
    const { data: sources } = await supabase
      .from('newsletter_subscribers')
      .select('source')
      .eq('subscribed', true);

    const sourceBreakdown = sources?.reduce((acc: Record<string, number>, sub) => {
      const src = sub.source || 'website';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        totalSubscribers: totalSubscribers || 0,
        totalUnsubscribed: totalUnsubscribed || 0,
        sources: sourceBreakdown || {},
      },
      recentSubscribers: recentSubscribers || [],
    });
  } catch (error) {
    console.error('Error fetching newsletter data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter data' },
      { status: 500 }
    );
  }
}

// POST - Send a newsletter campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, previewText, headline, content, ctaText, ctaUrl, testEmail } = body;

    if (!subject || !headline || !content) {
      return NextResponse.json(
        { error: 'Subject, headline, and content are required' },
        { status: 400 }
      );
    }

    const newsletterContent: NewsletterContent = {
      subject,
      previewText,
      headline,
      content,
      ctaText,
      ctaUrl,
    };

    // If test email provided, send only to that email
    if (testEmail) {
      const { sendNewsletterEmail } = await import('@/lib/notifications/service');
      const result = await sendNewsletterEmail(testEmail, newsletterContent);

      if (result.success) {
        return NextResponse.json({
          message: `Test email sent to ${testEmail}`,
          success: true,
        });
      } else {
        return NextResponse.json(
          { error: `Failed to send test email: ${result.error}` },
          { status: 500 }
        );
      }
    }

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('email, first_name')
      .eq('subscribed', true);

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found' },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        subject,
        preview_text: previewText,
        html_content: content,
        recipients_count: subscribers.length,
        status: 'sending',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      // Continue anyway - campaign tracking is optional
    }

    // Send bulk newsletter
    const result = await sendBulkNewsletter(subscribers, newsletterContent);

    // Update campaign status
    if (campaign) {
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sent',
          recipients_count: result.sent,
        })
        .eq('id', campaign.id);

      // Update subscriber email counts
      const sentEmails = result.results.filter((r) => r.success).map((r) => r.email);
      if (sentEmails.length > 0) {
        await supabase.rpc('increment_newsletter_sends', { emails: sentEmails });
      }
    }

    return NextResponse.json({
      message: `Newsletter sent to ${result.sent} subscribers`,
      sent: result.sent,
      failed: result.failed,
      campaignId: campaign?.id,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

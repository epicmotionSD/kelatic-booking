import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// Cron job to publish scheduled posts
// Runs every 15 minutes via Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all businesses with active campaigns
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('is_active', true);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: 'No active businesses' });
    }

    const results: {
      businessId: string;
      postsPublished: number;
      errors: string[];
    }[] = [];

    for (const business of businesses) {
      const agent = createMarketingAgent(business.id);
      const postsDue = await agent.getPostsDueForPublishing();

      const businessResult = {
        businessId: business.id,
        postsPublished: 0,
        errors: [] as string[],
      };

      for (const post of postsDue) {
        try {
          // Here you would integrate with actual social media APIs
          // For now, we simulate publishing by marking as published

          // Example: If it's email, send via SendGrid
          // Example: If it's social, post via Meta/Twitter API

          // For demonstration, we'll just mark as published
          // In production, implement actual publishing logic here:
          // await publishToInstagram(post);
          // await publishToFacebook(post);
          // await sendEmailCampaign(post);

          await agent.markPostPublished(post.id, {
            simulatedPublish: true,
            platform: post.platform,
            publishedAt: new Date().toISOString(),
          });

          businessResult.postsPublished++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await agent.markPostFailed(post.id, errorMessage);
          businessResult.errors.push(`Post ${post.id}: ${errorMessage}`);
        }
      }

      if (businessResult.postsPublished > 0 || businessResult.errors.length > 0) {
        results.push(businessResult);
      }
    }

    const totalPublished = results.reduce((sum, r) => sum + r.postsPublished, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        businessesProcessed: businesses.length,
        postsPublished: totalPublished,
        errors: totalErrors,
      },
      details: results.length > 0 ? results : undefined,
    });
  } catch (error) {
    console.error('Marketing cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, secret } = body;

    // Verify secret for manual triggers
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const postsDue = await agent.getPostsDueForPublishing();

    const results = {
      postsPublished: 0,
      postsFailed: 0,
      details: [] as any[],
    };

    for (const post of postsDue) {
      try {
        await agent.markPostPublished(post.id, {
          manualPublish: true,
          platform: post.platform,
          publishedAt: new Date().toISOString(),
        });
        results.postsPublished++;
        results.details.push({
          postId: post.id,
          platform: post.platform,
          status: 'published',
        });
      } catch (error) {
        results.postsFailed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await agent.markPostFailed(post.id, errorMessage);
        results.details.push({
          postId: post.id,
          platform: post.platform,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Manual publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish posts' },
      { status: 500 }
    );
  }
}

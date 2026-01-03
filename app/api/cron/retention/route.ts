import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createRetentionAgent } from '@/lib/agents/functional/retention';

// Cron job to calculate health scores and check re-engagement triggers
// Runs daily at 2 AM via Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all active businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('is_active', true);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: 'No active businesses' });
    }

    const results: {
      businessId: string;
      healthScoresCalculated: number;
      atRiskClients: number;
      triggersChecked: number;
      messagesSent: number;
      errors: string[];
    }[] = [];

    for (const business of businesses) {
      const businessResult = {
        businessId: business.id,
        healthScoresCalculated: 0,
        atRiskClients: 0,
        triggersChecked: 0,
        messagesSent: 0,
        errors: [] as string[],
      };

      const agent = createRetentionAgent(business.id);

      try {
        // Calculate health scores for all clients
        const healthResult = await agent.calculateAllHealthScores();
        businessResult.healthScoresCalculated = healthResult.calculated;
        businessResult.atRiskClients = healthResult.atRisk;

        // Alert if too many at-risk clients
        if (healthResult.atRisk > healthResult.calculated * 0.3) {
          await agent.createAlert(
            'high_churn_risk',
            'High Churn Risk Detected',
            `${healthResult.atRisk} clients (${Math.round((healthResult.atRisk / healthResult.calculated) * 100)}%) are at risk of churning.`,
            'warning',
            { atRiskCount: healthResult.atRisk, totalClients: healthResult.calculated }
          );
        }
      } catch (error) {
        businessResult.errors.push(
          `Health calculation error: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }

      try {
        // Check re-engagement triggers
        const triggerResult = await agent.checkReengagementTriggers();
        businessResult.triggersChecked = triggerResult.triggered;
        businessResult.messagesSent = triggerResult.sent;
      } catch (error) {
        businessResult.errors.push(
          `Trigger check error: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }

      results.push(businessResult);
    }

    const totalHealthCalculated = results.reduce((sum, r) => sum + r.healthScoresCalculated, 0);
    const totalAtRisk = results.reduce((sum, r) => sum + r.atRiskClients, 0);
    const totalMessagesSent = results.reduce((sum, r) => sum + r.messagesSent, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        businessesProcessed: businesses.length,
        healthScoresCalculated: totalHealthCalculated,
        atRiskClients: totalAtRisk,
        reengagementMessagesSent: totalMessagesSent,
        errors: totalErrors,
      },
      details: results.filter(r =>
        r.healthScoresCalculated > 0 ||
        r.messagesSent > 0 ||
        r.errors.length > 0
      ),
    });
  } catch (error) {
    console.error('Retention cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

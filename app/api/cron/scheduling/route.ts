import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createSchedulingAgent } from '@/lib/agents/functional/scheduling';

// Cron job to predict cancellations and analyze gaps
// Runs daily at 6 AM via Vercel Cron
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
      predictionsCreated: number;
      gapsDetected: number;
      errors: string[];
    }[] = [];

    for (const business of businesses) {
      const businessResult = {
        businessId: business.id,
        predictionsCreated: 0,
        gapsDetected: 0,
        errors: [] as string[],
      };

      const agent = createSchedulingAgent(business.id);

      try {
        // Run cancellation predictions for upcoming appointments
        const predictions = await agent.predictAllAtRisk();
        businessResult.predictionsCreated = predictions.length;

        // Send extra reminders for high-risk appointments
        for (const prediction of predictions) {
          if (prediction.riskLevel === 'critical' || prediction.riskLevel === 'high') {
            // In production, trigger additional reminder here
            // await sendExtraReminder(prediction.appointmentId);
          }
        }
      } catch (error) {
        businessResult.errors.push(
          `Prediction error: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }

      try {
        // Analyze schedule gaps
        const gapAnalysis = await agent.analyzeGaps();
        businessResult.gapsDetected = gapAnalysis.gaps.length;

        // Alert if utilization is low
        if (gapAnalysis.utilizationRate < 0.5) {
          await agent.createAlert(
            'low_utilization',
            'Low Schedule Utilization',
            `Schedule utilization is at ${Math.round(gapAnalysis.utilizationRate * 100)}%. Consider running promotions to fill gaps.`,
            'warning',
            { utilizationRate: gapAnalysis.utilizationRate, gapsCount: gapAnalysis.gaps.length }
          );
        }
      } catch (error) {
        businessResult.errors.push(
          `Gap analysis error: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }

      results.push(businessResult);
    }

    const totalPredictions = results.reduce((sum, r) => sum + r.predictionsCreated, 0);
    const totalGaps = results.reduce((sum, r) => sum + r.gapsDetected, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        businessesProcessed: businesses.length,
        predictionsCreated: totalPredictions,
        gapsDetected: totalGaps,
        errors: totalErrors,
      },
      details: results.filter(r => r.predictionsCreated > 0 || r.gapsDetected > 0 || r.errors.length > 0),
    });
  } catch (error) {
    console.error('Scheduling cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

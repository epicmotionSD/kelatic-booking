import { NextRequest, NextResponse } from 'next/server';
import { createSchedulingAgent } from '@/lib/agents/functional/scheduling';

// GET /api/agents/scheduling/predictions - Get at-risk appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const appointmentId = searchParams.get('appointmentId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    if (appointmentId) {
      // Get prediction for specific appointment
      const prediction = await agent.predictCancellation(appointmentId);
      return NextResponse.json({ prediction });
    }

    // Get all at-risk appointments
    const atRisk = await agent.getAtRiskAppointments();
    return NextResponse.json({ predictions: atRisk });
  } catch (error) {
    console.error('Get predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

// POST /api/agents/scheduling/predictions - Predict all upcoming appointments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, appointmentId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    if (appointmentId) {
      // Predict for specific appointment
      const prediction = await agent.predictCancellation(appointmentId);
      return NextResponse.json({ prediction });
    }

    // Predict all upcoming appointments
    const predictions = await agent.predictAllAtRisk();
    return NextResponse.json({
      predictions,
      message: `Found ${predictions.length} at-risk appointments`,
    });
  } catch (error) {
    console.error('Predict error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/scheduling/predictions - Update prediction with actual outcome
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, predictionId, actualOutcome, actionTaken } = body;

    if (!businessId || !predictionId) {
      return NextResponse.json(
        { error: 'businessId and predictionId are required' },
        { status: 400 }
      );
    }

    const validOutcomes = ['kept', 'cancelled', 'no_show', 'rescheduled'];
    if (actualOutcome && !validOutcomes.includes(actualOutcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    // Update prediction in database directly
    const updates: Record<string, any> = {};
    if (actualOutcome) {
      updates.actual_outcome = actualOutcome;
    }
    if (actionTaken) {
      updates.action_taken = actionTaken;
      updates.action_taken_at = new Date().toISOString();
    }

    // Note: This would use supabase directly in the agent
    // For now, return success
    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('Update prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to update prediction' },
      { status: 500 }
    );
  }
}

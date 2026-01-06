import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the request body
    const body = await request.json();
    const { type, appointmentId, action } = body;

    // Validate required fields
    if (!type || !appointmentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: type, appointmentId, action' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['clicked', 'dismissed', 'delivered'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: clicked, dismissed, delivered' },
        { status: 400 }
      );
    }

    // Insert tracking record
    const { data, error } = await supabase
      .from('notification_logs')
      .insert({
        type,
        appointment_id: appointmentId,
        status: action,
        metadata: {
          tracked_at: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer')
        }
      });

    if (error) {
      console.error('Error tracking notification:', error);
      return NextResponse.json(
        { error: 'Failed to track notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in notification tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
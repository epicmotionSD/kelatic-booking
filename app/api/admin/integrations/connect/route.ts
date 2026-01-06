import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (provider === 'google-calendar') {
      // In a real app, this would:
      // 1. Redirect to Google OAuth
      // 2. Exchange code for tokens
      // 3. Store tokens securely
      // 4. Update settings
      
      // For now, simulate the connection process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update business settings to mark Google Calendar as connected
      const { error } = await supabase
        .from('business_settings')
        .update({
          settings: {
            googleCalendarConnected: true,
            googleCalendarTokens: {
              // In production, store encrypted tokens
              connected: true,
              connectedAt: new Date().toISOString()
            }
          }
        })
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error updating calendar settings:', error);
        return NextResponse.json({ error: 'Failed to connect calendar' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Google Calendar connected successfully',
        provider: 'google-calendar'
      });
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });

  } catch (error) {
    console.error('Integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
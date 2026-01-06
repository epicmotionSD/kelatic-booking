import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, settings: notificationSettings } = body;

    if (type === 'sms-email') {
      // Simulate enabling SMS/Email notifications
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update business settings
      const { error } = await supabase
        .from('business_settings')
        .update({
          settings: {
            smsEmailEnabled: true,
            notificationSettings: {
              sms: notificationSettings?.sms || true,
              email: notificationSettings?.email || true,
              reminders: notificationSettings?.reminders || true,
              confirmations: notificationSettings?.confirmations || true,
              enabledAt: new Date().toISOString()
            }
          }
        })
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json({ error: 'Failed to enable notifications' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'SMS & Email notifications enabled',
        type: 'sms-email'
      });
    }

    return NextResponse.json({ error: 'Unsupported notification type' }, { status: 400 });

  } catch (error) {
    console.error('Notification setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
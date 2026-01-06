import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NotificationType } from '@/types/database';

const DEFAULT_PREFERENCES = {
  global: {
    email: true,
    sms: true,
    push: true,
    in_app: true,
    marketing: true
  },
  preferences: {} as Record<NotificationType, {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  }>
};

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_email, notification_sms, notification_push, notification_in_app, notification_marketing')
      .eq('id', user.id)
      .single();

    // Get specific notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id);

    // Build settings object
    const settings = {
      global: {
        email: profile?.notification_email ?? true,
        sms: profile?.notification_sms ?? true,
        push: profile?.notification_push ?? true,
        in_app: profile?.notification_in_app ?? true,
        marketing: profile?.notification_marketing ?? true
      },
      preferences: {} as Record<NotificationType, any>
    };

    // Map specific preferences
    preferences?.forEach(pref => {
      settings.preferences[pref.type as NotificationType] = {
        email: pref.email_enabled,
        sms: pref.sms_enabled,
        push: pref.push_enabled,
        in_app: pref.in_app_enabled
      };
    });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/preferences - Update user's notification preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { global, preferences } = await request.json();

    // Update global preferences in profile
    if (global) {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_email: global.email,
          notification_sms: global.sms,
          notification_push: global.push,
          notification_in_app: global.in_app,
          notification_marketing: global.marketing,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile preferences:', error);
        return NextResponse.json({ error: 'Failed to update global preferences' }, { status: 500 });
      }
    }

    // Update specific preferences
    if (preferences && typeof preferences === 'object') {
      for (const [type, settings] of Object.entries(preferences)) {
        if (typeof settings === 'object' && settings !== null) {
          const settingsObj = settings as any;
          const { error } = await supabase
            .from('notification_preferences')
            .upsert([{
              user_id: user.id,
              type: type as NotificationType,
              email_enabled: settingsObj.email,
              sms_enabled: settingsObj.sms,
              push_enabled: settingsObj.push,
              in_app_enabled: settingsObj.in_app,
              updated_at: new Date().toISOString()
            }]);

          if (error) {
            console.error(`Error updating preference for ${type}:`, error);
            // Continue with other preferences instead of failing completely
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
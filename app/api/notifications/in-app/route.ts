import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications/in-app - Get user's in-app notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notifications (unread first, then by creation date)
    const { data: notifications, error } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: notifications?.filter(n => !n.is_read).length || 0
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/in-app - Create new in-app notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      target_user_id,
      title,
      message,
      type = 'system_alert',
      priority = 'medium',
      action_url,
      action_label,
      expires_in_hours
    } = await request.json();

    if (!target_user_id || !title || !message) {
      return NextResponse.json({ 
        error: 'target_user_id, title, and message are required' 
      }, { status: 400 });
    }

    const expires_at = expires_in_hours 
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
      : null;

    const { data: notification, error } = await supabase
      .from('in_app_notifications')
      .insert([{
        user_id: target_user_id,
        title,
        message,
        type,
        priority,
        action_url,
        action_label,
        expires_at,
        metadata: {
          created_by: user.id,
          admin_created: true
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
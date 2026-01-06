import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business settings - this could be from a dedicated table or profile
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is ok
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Default settings if none exist
    const defaultSettings = {
      name: 'Your Business',
      address: '',
      phone: '',
      email: user.email,
      timezone: 'America/Chicago',
      currency: 'USD',
      bookingLeadTime: 2,
      bookingWindowDays: 60,
      cancellationPolicy: '24 hours notice required for cancellations.',
      depositPolicy: 'A deposit may be required to secure your appointment.',
      closedDays: [0, 1], // Sunday and Monday
      businessHours: {
        0: null, // Closed
        1: null, // Closed
        2: { open: '10:00', close: '19:00' },
        3: { open: '10:00', close: '19:00' },
        4: { open: '10:00', close: '19:00' },
        5: { open: '10:00', close: '19:00' },
        6: { open: '09:00', close: '17:00' },
      },
      googleCalendarConnected: false,
      smsEmailEnabled: false,
      stripeConnected: false,
    };

    return NextResponse.json({
      success: true,
      settings: settings?.settings || defaultSettings
    });

  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }

    // Upsert business settings
    const { error } = await supabase
      .from('business_settings')
      .upsert({
        owner_id: user.id,
        settings: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'owner_id'
      });

    if (error) {
      console.error('Error saving settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    // Check if all required settings are configured
    const isFullyConfigured = checkSettingsCompletion(settings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      isFullyConfigured
    });

  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function checkSettingsCompletion(settings: any): boolean {
  const required = [
    settings.name && settings.name.trim() !== '',
    settings.address && settings.address.trim() !== '',
    settings.phone && settings.phone.trim() !== '',
    settings.email && settings.email.trim() !== '',
    settings.businessHours && Object.keys(settings.businessHours).length > 0,
    settings.googleCalendarConnected === true,
    settings.smsEmailEnabled === true,
    settings.stripeConnected === true
  ];
  
  return required.every(Boolean);
}
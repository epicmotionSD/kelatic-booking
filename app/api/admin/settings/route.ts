import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

// Map between numeric day keys (frontend) and string day names (database)
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Convert database format to frontend format (numeric keys 0-6)
// DB can have either string keys ("sunday") or numeric keys ("0" or 0)
function convertHoursFromDb(dbHours: Record<string, any> | null): Record<number, any> {
  if (!dbHours) {
    return {
      0: null, 1: null,
      2: { open: '10:00', close: '19:00' },
      3: { open: '10:00', close: '19:00' },
      4: { open: '10:00', close: '19:00' },
      5: { open: '10:00', close: '19:00' },
      6: { open: '09:00', close: '17:00' },
    };
  }
  
  const result: Record<number, any> = {};
  
  // Check if using string day names (sunday, monday, etc.)
  if (dbHours.sunday !== undefined || dbHours.monday !== undefined) {
    DAY_NAMES.forEach((name, index) => {
      result[index] = dbHours[name] ?? null;
    });
  } else {
    // Using numeric keys (0, 1, 2, etc. or "0", "1", "2")
    for (let i = 0; i <= 6; i++) {
      result[i] = dbHours[i] ?? dbHours[String(i)] ?? null;
    }
  }
  
  return result;
}

// Convert frontend format (numeric keys 0-6) to database format
// We'll store as numeric string keys for simplicity
function convertHoursToDb(frontendHours: Record<string | number, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (let i = 0; i <= 6; i++) {
    result[String(i)] = frontendHours[i] ?? frontendHours[String(i)] ?? null;
  }
  return result;
}

// Derive closedDays from business_hours - days with null/empty hours are closed
function getClosedDaysFromHours(hours: Record<number, any>): number[] {
  const closedDays: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const dayHours = hours[i];
    // Day is closed if null, undefined, or has "00:00" for both open/close
    if (!dayHours || 
        (dayHours.open === '00:00' && dayHours.close === '00:00') ||
        (dayHours.open === '' && dayHours.close === '')) {
      closedDays.push(i);
    }
  }
  return closedDays;
}

export async function GET() {
  try {
    const business = await requireBusiness();
    const supabase = createAdminClient();


    // Get business settings row
    const { data: row, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is ok
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Map DB columns to settings object
    let settings;
    if (row) {
      const businessHours = convertHoursFromDb(row.business_hours);
      const closedDays = getClosedDaysFromHours(businessHours);
      
      settings = {
        name: business.name,
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        timezone: business.timezone || 'America/Chicago',
        currency: 'USD', // Not in DB yet, use default
        bookingLeadTime: row.booking_min_notice_hours ?? 2,
        bookingWindowDays: row.booking_advance_days ?? 60,
        cancellationPolicy: row.cancellation_policy || '24 hours notice required for cancellations.',
        depositPolicy: row.deposit_policy || 'A deposit may be required to secure your appointment.',
        closedDays: closedDays,
        businessHours: businessHours,
        googleCalendarConnected: false, // Not in DB yet
        smsEmailEnabled: row.send_booking_confirmations ?? false,
        stripeConnected: !!business.stripe_account_id, // Check if business has Stripe connected
        // Add more fields as needed from business_settings
      };
    } else {
      // No settings row exists yet - use sensible defaults
      const defaultHours: Record<number, any> = {
        0: null,
        1: null,
        2: { open: '10:00', close: '19:00' },
        3: { open: '10:00', close: '19:00' },
        4: { open: '10:00', close: '19:00' },
        5: { open: '10:00', close: '19:00' },
        6: { open: '10:00', close: '19:00' },
      };
      const defaultClosedDays = getClosedDaysFromHours(defaultHours);
      
      settings = {
        name: business.name,
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        timezone: business.timezone || 'America/Chicago',
        currency: 'USD',
        bookingLeadTime: 2,
        bookingWindowDays: 60,
        cancellationPolicy: '24 hours notice required for cancellations.',
        depositPolicy: 'A deposit may be required to secure your appointment.',
        closedDays: defaultClosedDays,
        businessHours: defaultHours,
        googleCalendarConnected: false,
        smsEmailEnabled: false,
        stripeConnected: !!business.stripe_account_id,
      };
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const business = await requireBusiness();
    const supabase = createAdminClient();

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }


    // Map settings object to DB columns
    // Only include columns that exist in the current schema
    const upsertData: any = {
      business_id: business.id,
      updated_at: new Date().toISOString(),
      booking_min_notice_hours: settings.bookingLeadTime,
      booking_advance_days: settings.bookingWindowDays,
      cancellation_policy: settings.cancellationPolicy,
      deposit_policy: settings.depositPolicy,
      business_hours: convertHoursToDb(settings.businessHours),
      send_booking_confirmations: settings.smsEmailEnabled,
    };

    // Update timezone on the businesses table if provided
    if (settings.timezone) {
      await supabase
        .from('businesses')
        .update({ timezone: settings.timezone, updated_at: new Date().toISOString() })
        .eq('id', business.id);
    }

    const { error } = await supabase
      .from('business_settings')
      .upsert(upsertData, {
        onConflict: 'business_id'
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
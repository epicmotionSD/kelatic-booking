import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

const dayToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const numberToDay: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const defaultSchedule: Record<string, { enabled: boolean; blocks: { id: string; start: string; end: string }[] }> = {
  sunday: { enabled: false, blocks: [] },
  monday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  friday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
  saturday: { enabled: true, blocks: [{ id: '1', start: '10:00', end: '16:00' }] },
};

async function getAuthorizedStylist() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { supabase, error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) };
  }

  if (!['stylist', 'admin', 'owner'].includes(profile.role)) {
    return { supabase, error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  return { supabase, stylistId: profile.id };
}

export async function GET() {
  try {
    const auth = await getAuthorizedStylist();
    if (auth.error) return auth.error;

    const { supabase, stylistId } = auth;

    const { data: scheduleRows, error } = await supabase
      .from('stylist_schedules')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('stylist_id', stylistId)
      .order('day_of_week');

    if (error) {
      throw error;
    }

    const weeklySchedule = { ...defaultSchedule };

    if (scheduleRows && scheduleRows.length > 0) {
      Object.keys(weeklySchedule).forEach((day) => {
        weeklySchedule[day] = { enabled: false, blocks: [] };
      });

      scheduleRows.forEach((row) => {
        const dayName = numberToDay[row.day_of_week];
        if (!dayName) return;

        if (!weeklySchedule[dayName].enabled) {
          weeklySchedule[dayName] = { enabled: row.is_active, blocks: [] };
        }

        if (row.is_active) {
          weeklySchedule[dayName].blocks.push({
            id: `${row.day_of_week}-${row.start_time}`,
            start: row.start_time.substring(0, 5),
            end: row.end_time.substring(0, 5),
          });
        }
      });
    }

    return NextResponse.json({ weeklySchedule });
  } catch (error) {
    console.error('Stylist schedule GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthorizedStylist();
    if (auth.error) return auth.error;

    const { supabase, stylistId } = auth;
    const { weeklySchedule } = await request.json();

    if (!weeklySchedule || typeof weeklySchedule !== 'object') {
      return NextResponse.json({ error: 'weeklySchedule is required' }, { status: 400 });
    }

    await supabase
      .from('stylist_schedules')
      .delete()
      .eq('stylist_id', stylistId);

    const scheduleRows: Array<{
      stylist_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }> = [];

    Object.entries(weeklySchedule).forEach(([day, schedule]: [string, any]) => {
      const dayNum = dayToNumber[day];
      if (dayNum === undefined) return;

      if (schedule.enabled && schedule.blocks && schedule.blocks.length > 0) {
        schedule.blocks.forEach((block: any) => {
          scheduleRows.push({
            stylist_id: stylistId,
            day_of_week: dayNum,
            start_time: `${block.start}:00`,
            end_time: `${block.end}:00`,
            is_active: true,
          });
        });
      } else {
        scheduleRows.push({
          stylist_id: stylistId,
          day_of_week: dayNum,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_active: false,
        });
      }
    });

    if (scheduleRows.length > 0) {
      const { error: insertError } = await supabase
        .from('stylist_schedules')
        .insert(scheduleRows);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stylist schedule PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

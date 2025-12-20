import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// Days mapping: UI uses lowercase names, DB uses 0-6 (0=Sunday)
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

// GET /api/admin/team/[id]/schedule - Get stylist schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    // Verify stylist exists
    const { data: stylist } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'stylist')
      .single();

    if (!stylist) {
      return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    }

    // Get weekly schedule from stylist_schedules table
    const { data: scheduleRows, error: scheduleError } = await supabase
      .from('stylist_schedules')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('stylist_id', id)
      .order('day_of_week');

    if (scheduleError) throw scheduleError;

    // Get blocked dates from stylist_time_off table
    const { data: timeOffRows, error: timeOffError } = await supabase
      .from('stylist_time_off')
      .select('id, start_datetime, end_datetime, reason')
      .eq('stylist_id', id)
      .gte('end_datetime', new Date().toISOString())
      .order('start_datetime');

    if (timeOffError) throw timeOffError;

    // Build weekly schedule object for the UI
    const defaultSchedule: Record<string, { enabled: boolean; blocks: { id: string; start: string; end: string }[] }> = {
      sunday: { enabled: false, blocks: [] },
      monday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      friday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      saturday: { enabled: true, blocks: [{ id: '1', start: '10:00', end: '16:00' }] },
    };

    const weeklySchedule: typeof defaultSchedule = { ...defaultSchedule };

    // Populate from database
    if (scheduleRows && scheduleRows.length > 0) {
      // Reset all days to empty first
      Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day] = { enabled: false, blocks: [] };
      });

      scheduleRows.forEach(row => {
        const dayName = numberToDay[row.day_of_week];
        if (dayName) {
          if (!weeklySchedule[dayName].enabled) {
            weeklySchedule[dayName] = { enabled: row.is_active, blocks: [] };
          }
          if (row.is_active) {
            weeklySchedule[dayName].blocks.push({
              id: `${row.day_of_week}-${row.start_time}`,
              start: row.start_time.substring(0, 5), // Remove seconds
              end: row.end_time.substring(0, 5),
            });
          }
        }
      });
    }

    // Build blocked dates array for the UI
    const blockedDates = (timeOffRows || []).map(row => {
      const startDate = new Date(row.start_datetime);
      const endDate = new Date(row.end_datetime);
      const isAllDay = startDate.getHours() === 0 && endDate.getHours() === 23;

      return {
        id: row.id,
        date: startDate.toISOString().split('T')[0],
        reason: row.reason || 'Time off',
        allDay: isAllDay,
        startTime: isAllDay ? undefined : startDate.toTimeString().substring(0, 5),
        endTime: isAllDay ? undefined : endDate.toTimeString().substring(0, 5),
      };
    });

    return NextResponse.json({
      weeklySchedule,
      blockedDates,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/team/[id]/schedule - Update stylist schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();

    const { weeklySchedule, blockedDates } = body;

    // Verify stylist exists
    const { data: stylist } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'stylist')
      .single();

    if (!stylist) {
      return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    }

    // Update weekly schedule
    if (weeklySchedule) {
      // Delete existing schedule entries
      await supabase
        .from('stylist_schedules')
        .delete()
        .eq('stylist_id', id);

      // Insert new schedule entries
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
              stylist_id: id,
              day_of_week: dayNum,
              start_time: block.start + ':00', // Add seconds
              end_time: block.end + ':00',
              is_active: true,
            });
          });
        } else {
          // Store disabled days too for reference
          scheduleRows.push({
            stylist_id: id,
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

        if (insertError) throw insertError;
      }
    }

    // Update blocked dates (time off)
    if (blockedDates !== undefined) {
      // Delete future time off entries
      await supabase
        .from('stylist_time_off')
        .delete()
        .eq('stylist_id', id)
        .gte('start_datetime', new Date().toISOString().split('T')[0]);

      // Insert new time off entries
      if (blockedDates.length > 0) {
        const timeOffRows = blockedDates.map((blocked: any) => {
          let startDatetime: string;
          let endDatetime: string;

          if (blocked.allDay) {
            startDatetime = `${blocked.date}T00:00:00`;
            endDatetime = `${blocked.date}T23:59:59`;
          } else {
            startDatetime = `${blocked.date}T${blocked.startTime}:00`;
            endDatetime = `${blocked.date}T${blocked.endTime}:00`;
          }

          return {
            stylist_id: id,
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            reason: blocked.reason || 'Time off',
          };
        });

        const { error: timeOffError } = await supabase
          .from('stylist_time_off')
          .insert(timeOffRows);

        if (timeOffError) throw timeOffError;
      }
    }

    // Check for appointments that may be affected by blocked dates
    if (blockedDates && blockedDates.length > 0) {
      const blockedDateStrings = blockedDates.map((b: any) => b.date);
      
      // Find appointments on blocked dates
      const { data: affectedAppointments } = await supabase
        .from('appointments')
        .select('id, start_time, client_id')
        .eq('stylist_id', id)
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', new Date().toISOString());

      const conflicts = affectedAppointments?.filter(apt => {
        const aptDate = new Date(apt.start_time).toISOString().split('T')[0];
        return blockedDateStrings.includes(aptDate);
      }) || [];

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: true,
          warning: `${conflicts.length} appointment(s) may need to be rescheduled`,
          conflicting_appointments: conflicts.map(c => c.id),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { createServerSupabaseClient, createAdminClient } from '../supabase/client';
import { createPaymentIntent, toCents } from '../stripe';
import type {
  Appointment,
  AppointmentWithDetails,
  AvailabilityRequest,
  AvailabilityResponse,
  BookingRequest,
  Service,
  StylistSchedule,
  TimeSlot,
} from '@/types/database';

// ============================================
// AVAILABILITY
// ============================================

interface ExtendedAvailabilityRequest {
  service_id?: string;
  stylist_id?: string;
  date: string;
  duration?: number;
  exclude_appointment?: string;
}

export async function getAvailability({
  service_id,
  stylist_id,
  date,
  duration: providedDuration,
  exclude_appointment,
}: ExtendedAvailabilityRequest): Promise<AvailabilityResponse> {
  const supabase = createAdminClient();
  
  let totalDuration: number;
  
  // If duration is provided directly, use it (for rescheduling)
  if (providedDuration) {
    totalDuration = providedDuration;
  } else if (service_id) {
    // Get service duration
    const { data: service } = await supabase
      .from('services')
      .select('duration, buffer_time')
      .eq('id', service_id)
      .single();
      
    if (!service) throw new Error('Service not found');
    
    totalDuration = service.duration + (service.buffer_time || 0);
  } else {
    throw new Error('Either service_id or duration must be provided');
  }
  
  const dayOfWeek = new Date(date).getDay();
  const slots: TimeSlot[] = [];
  
  // If stylist_id is provided directly (for rescheduling), just check that stylist
  if (stylist_id && !service_id) {
    // Get stylist info
    const { data: stylist } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, is_active')
      .eq('id', stylist_id)
      .eq('is_active', true)
      .single();
      
    if (!stylist) {
      return { date, slots: [] };
    }
    
    // Get stylist's schedules for this day
    const { data: schedules } = await supabase
      .from('stylist_schedules')
      .select('*')
      .eq('stylist_id', stylist_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);
      
    if (!schedules?.length) {
      return { date, slots: [] };
    }
    
    // Get existing appointments for this stylist on this date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('stylist_id', stylist_id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .not('status', 'in', '("cancelled","no_show")');
    
    // Exclude the current appointment if rescheduling
    if (exclude_appointment) {
      appointmentsQuery = appointmentsQuery.neq('id', exclude_appointment);
    }
    
    const { data: existingAppointments } = await appointmentsQuery;
      
    // Get time-off
    const { data: timeOff } = await supabase
      .from('stylist_time_off')
      .select('start_datetime, end_datetime')
      .eq('stylist_id', stylist_id)
      .lte('start_datetime', endOfDay)
      .gte('end_datetime', startOfDay);
    
    // Generate time slots for each schedule block
    for (const schedule of schedules) {
      const scheduleStart = parseTime(schedule.start_time);
      const scheduleEnd = parseTime(schedule.end_time);
      
      for (let time = scheduleStart; time + totalDuration <= scheduleEnd; time += 30) {
        const slotStart = formatTimeSlot(date, time);
        const slotEnd = formatTimeSlot(date, time + totalDuration);
        
        // Skip if this slot already exists
        if (slots.find(s => s.start_time === slotStart && s.stylist_id === stylist_id)) {
          continue;
        }
        
        const isAvailable = !hasConflict(
          slotStart,
          slotEnd,
          existingAppointments || [],
          timeOff || []
        );
        
        // For the simple time-only response format
        const timeStr = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
        
        slots.push({
          time: timeStr,
          start_time: slotStart,
          end_time: slotEnd,
          stylist_id: stylist_id,
          stylist_name: `${stylist.first_name} ${stylist.last_name}`,
          available: isAvailable,
        });
      }
    }
    
    return { date, slots };
  }
  
  // Original flow: get stylists who can perform this service
  let stylistQuery = supabase
    .from('stylist_services')
    .select(`
      stylist_id,
      custom_duration,
      profiles!inner (
        id,
        first_name,
        last_name,
        is_active
      )
    `)
    .eq('service_id', service_id!)
    .eq('is_active', true);
    
  if (stylist_id) {
    stylistQuery = stylistQuery.eq('stylist_id', stylist_id);
  }
  
  const { data: stylistServices } = await stylistQuery;
  
  if (!stylistServices?.length) {
    return { date, slots: [] };
  }
  
  for (const ss of stylistServices) {
    const profile = ss.profiles as any;
    if (!profile?.is_active) continue;
    
    // Get stylist's schedule for this day
    const { data: schedule } = await supabase
      .from('stylist_schedules')
      .select('*')
      .eq('stylist_id', ss.stylist_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();
      
    if (!schedule) continue;
    
    // Get existing appointments for this stylist on this date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('stylist_id', ss.stylist_id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .not('status', 'in', '("cancelled","no_show")');
    
    // Exclude the current appointment if rescheduling
    if (exclude_appointment) {
      appointmentsQuery = appointmentsQuery.neq('id', exclude_appointment);
    }
    
    const { data: existingAppointments } = await appointmentsQuery;
      
    // Get time-off
    const { data: timeOff } = await supabase
      .from('stylist_time_off')
      .select('start_datetime, end_datetime')
      .eq('stylist_id', ss.stylist_id)
      .lte('start_datetime', endOfDay)
      .gte('end_datetime', startOfDay);
    
    // Generate time slots (30-minute increments)
    const duration = ss.custom_duration || totalDuration;
    const scheduleStart = parseTime(schedule.start_time);
    const scheduleEnd = parseTime(schedule.end_time);
    
    for (let time = scheduleStart; time + duration <= scheduleEnd; time += 30) {
      const slotStart = formatTimeSlot(date, time);
      const slotEnd = formatTimeSlot(date, time + duration);
      
      const isAvailable = !hasConflict(
        slotStart,
        slotEnd,
        existingAppointments || [],
        timeOff || []
      );
      
      const timeStr = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      
      slots.push({
        time: timeStr,
        start_time: slotStart,
        end_time: slotEnd,
        stylist_id: ss.stylist_id,
        stylist_name: `${profile.first_name} ${profile.last_name}`,
        available: isAvailable,
      });
    }
  }
  
  return { date, slots };
}

// ============================================
// BOOKING
// ============================================

interface CreateBookingResult {
  appointment: Appointment;
  paymentIntent?: { clientSecret: string; id: string };
}

export async function createBooking(
  clientId: string,
  request: BookingRequest
): Promise<CreateBookingResult> {
  const supabase = await createServerSupabaseClient();
  const adminClient = createAdminClient();
  
  // Get service details
  const { data: service } = await adminClient
    .from('services')
    .select('*')
    .eq('id', request.service_id)
    .single();
    
  if (!service) throw new Error('Service not found');
  
  // Calculate end time
  const startTime = new Date(request.start_time);
  const endTime = new Date(startTime.getTime() + service.duration * 60000);
  
  // Verify availability (one more time to prevent race conditions)
  const { data: conflicts } = await adminClient
    .from('appointments')
    .select('id')
    .eq('stylist_id', request.stylist_id)
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString())
    .not('status', 'in', '("cancelled","no_show")')
    .limit(1);
    
  if (conflicts?.length) {
    throw new Error('Time slot is no longer available');
  }
  
  // Calculate price
  let totalPrice = service.base_price;
  
  // Add add-ons if any
  if (request.addon_ids?.length) {
    const { data: addons } = await adminClient
      .from('services')
      .select('base_price')
      .in('id', request.addon_ids);
      
    if (addons) {
      totalPrice += addons.reduce((sum, addon) => sum + addon.base_price, 0);
    }
  }
  
  // Create appointment
  const { data: appointment, error } = await adminClient
    .from('appointments')
    .insert({
      client_id: clientId,
      stylist_id: request.stylist_id,
      service_id: request.service_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      quoted_price: totalPrice,
      client_notes: request.client_notes,
      status: service.deposit_required ? 'pending' : 'confirmed',
    })
    .select()
    .single();
    
  if (error || !appointment) {
    throw new Error('Failed to create appointment');
  }
  
  // Insert add-ons
  if (request.addon_ids?.length) {
    const { data: addonServices } = await adminClient
      .from('services')
      .select('id, base_price, duration')
      .in('id', request.addon_ids);
      
    if (addonServices?.length) {
      await adminClient.from('appointment_addons').insert(
        addonServices.map((addon) => ({
          appointment_id: appointment.id,
          service_id: addon.id,
          price: addon.base_price,
          duration: addon.duration,
        }))
      );
    }
  }
  
  // Create payment intent if deposit required
  let paymentIntent;
  if (service.deposit_required && service.deposit_amount) {
    paymentIntent = await createPaymentIntent({
      amount: toCents(service.deposit_amount),
      appointmentId: appointment.id,
      isDeposit: true,
    });
    
    return {
      appointment,
      paymentIntent: {
        clientSecret: paymentIntent.client_secret!,
        id: paymentIntent.id,
      },
    };
  }
  
  return { appointment };
}

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

export async function getAppointmentById(
  appointmentId: string
): Promise<AppointmentWithDetails | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      client:profiles!appointments_client_id_fkey (*),
      stylist:profiles!appointments_stylist_id_fkey (*),
      service:services (*),
      addons:appointment_addons (
        *,
        service:services (*)
      ),
      payments (*)
    `)
    .eq('id', appointmentId)
    .single();
    
  return data;
}

export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: string,
  reason?: string
) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
    })
    .eq('id', appointmentId);
    
  if (error) throw error;
  
  // TODO: Process refund if deposit was paid
  // TODO: Send cancellation notification
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartTime: string
) {
  const supabase = await createServerSupabaseClient();
  
  // Get original appointment
  const { data: original } = await supabase
    .from('appointments')
    .select('*, service:services(*)')
    .eq('id', appointmentId)
    .single();
    
  if (!original) throw new Error('Appointment not found');
  
  const startTime = new Date(newStartTime);
  const duration = (original.service as Service).duration;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const { error } = await supabase
    .from('appointments')
    .update({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq('id', appointmentId);
    
  if (error) throw error;
  
  // TODO: Send reschedule notification
}

// ============================================
// HELPERS
// ============================================

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeSlot(date: string, minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${date}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

function hasConflict(
  slotStart: string,
  slotEnd: string,
  appointments: { start_time: string; end_time: string }[],
  timeOff: { start_datetime: string; end_datetime: string }[]
): boolean {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  
  // Check appointments
  for (const apt of appointments) {
    const aptStart = new Date(apt.start_time);
    const aptEnd = new Date(apt.end_time);
    
    if (start < aptEnd && end > aptStart) {
      return true;
    }
  }
  
  // Check time-off
  for (const off of timeOff) {
    const offStart = new Date(off.start_datetime);
    const offEnd = new Date(off.end_datetime);
    
    if (start < offEnd && end > offStart) {
      return true;
    }
  }
  
  return false;
}

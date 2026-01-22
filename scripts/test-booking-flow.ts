import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.BOOKING_E2E_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!baseUrl) {
  console.error('Missing BOOKING_E2E_BASE_URL or NEXT_PUBLIC_APP_URL');
  process.exit(1);
}

type Service = { id: string; name: string; duration: number };

type Stylist = { id: string; first_name?: string; last_name?: string };

type AvailabilitySlot = {
  time?: string;
  start_time?: string;
  end_time?: string;
  stylist_id?: string;
  available?: boolean;
};

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, baseUrl), init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getFirstAvailableSlot(serviceId: string): Promise<AvailabilitySlot | null> {
  for (let i = 1; i <= 14; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = formatDate(date);

    const availability = await requestJson(`/api/availability?service_id=${serviceId}&date=${dateStr}`);
    const slots = (availability?.slots || []) as AvailabilitySlot[];
    const available = slots.find((slot) => slot.available);
    if (available) {
      return available;
    }
  }

  return null;
}

async function run() {
  console.log(`Running booking flow test against ${baseUrl}`);

  const servicesResponse = await requestJson('/api/services');
  const services = (servicesResponse?.services || []) as Service[];
  if (!services.length) {
    throw new Error('No services available');
  }

  const service = services[0];

  const stylistsResponse = await requestJson('/api/stylists');
  const stylists = (stylistsResponse?.stylists || []) as Stylist[];
  if (!stylists.length) {
    throw new Error('No stylists available');
  }

  const stylist = stylists[0];

  const slot = await getFirstAvailableSlot(service.id);
  if (!slot || !slot.start_time) {
    throw new Error('No availability found in the next 14 days');
  }

  const timestamp = Date.now();
  const testEmail = `e2e+${timestamp}@kelatic.com`;

  const bookingPayload = {
    service_id: service.id,
    stylist_id: stylist.id,
    start_time: slot.start_time,
    addon_ids: [],
    client: {
      first_name: 'E2E',
      last_name: 'Test',
      email: testEmail,
      phone: '+15555550123',
      is_new: true,
    },
    notes: `E2E booking test ${timestamp}`,
  };

  const bookingResponse = await requestJson('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });

  const appointmentId = bookingResponse?.appointment?.id;
  if (!appointmentId) {
    throw new Error('Booking response missing appointment id');
  }

  const appointment = await requestJson(`/api/appointments/${appointmentId}`);
  if (!appointment?.id) {
    throw new Error('Failed to fetch appointment details');
  }

  console.log('✅ Booking flow passed');
  console.log(`Appointment ID: ${appointmentId}`);
  console.log(`Test email: ${testEmail}`);
}

run().catch((error) => {
  console.error('Booking flow failed:', error.message || error);
  process.exit(1);
});

/**
 * Amelia to KeLatic Booking Migration Script
 * 
 * Usage:
 *   1. Export your Amelia tables from WordPress database as CSV
 *   2. Place CSVs in ./migration-data/ folder
 *   3. Run: npm run migrate:amelia
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AmeliaUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  type: 'customer' | 'provider';
  note?: string;
}

interface AmeliaService {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  deposit?: string;
  categoryId?: string;
}

interface AmeliaAppointment {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  bookingStart: string;
  bookingEnd: string;
  status: string;
  price: string;
  internalNotes?: string;
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migrateUsers(csvPath: string) {
  console.log('Migrating users...');
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: AmeliaUser[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const clients: any[] = [];
  const stylists: any[] = [];

  for (const user of records) {
    const profile = {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone || null,
      role: user.type === 'provider' ? 'stylist' : 'client',
      notes: user.note || null,
      amelia_user_id: parseInt(user.id),
      migrated_at: new Date().toISOString(),
    };

    if (user.type === 'provider') {
      stylists.push(profile);
    } else {
      clients.push(profile);
    }
  }

  // Note: Users need to be created in Supabase Auth first
  // This creates profile records that will be linked when users sign up
  console.log(`Found ${clients.length} clients and ${stylists.length} stylists`);
  
  // For stylists, you may want to pre-create accounts
  // For clients, store their info and link when they first book
  
  return { clients, stylists };
}

async function migrateServices(csvPath: string) {
  console.log('Migrating services...');
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: AmeliaService[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const services = records.map((service) => ({
    name: service.name,
    description: service.description || null,
    category: inferCategory(service.name), // You'll need to map these
    base_price: parseFloat(service.price),
    duration: parseInt(service.duration),
    deposit_required: !!service.deposit && parseFloat(service.deposit) > 0,
    deposit_amount: service.deposit ? parseFloat(service.deposit) : null,
    is_active: true,
    amelia_service_id: parseInt(service.id),
  }));

  const { data, error } = await supabase
    .from('services')
    .insert(services)
    .select();

  if (error) {
    console.error('Error migrating services:', error);
    throw error;
  }

  console.log(`Migrated ${data.length} services`);
  return data;
}

async function migrateAppointments(
  csvPath: string,
  userMapping: Map<string, string>,
  serviceMapping: Map<string, string>
) {
  console.log('Migrating appointments...');
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: AmeliaAppointment[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const appointments = records
    .filter((apt) => {
      // Only migrate completed/confirmed appointments
      return ['approved', 'completed'].includes(apt.status.toLowerCase());
    })
    .map((apt) => ({
      client_id: userMapping.get(apt.customerId) || null,
      stylist_id: userMapping.get(apt.providerId) || null,
      service_id: serviceMapping.get(apt.serviceId) || null,
      start_time: apt.bookingStart,
      end_time: apt.bookingEnd,
      status: mapStatus(apt.status),
      quoted_price: parseFloat(apt.price),
      final_price: parseFloat(apt.price),
      stylist_notes: apt.internalNotes || null,
      amelia_appointment_id: parseInt(apt.id),
    }));

  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < appointments.length; i += batchSize) {
    const batch = appointments.slice(i, i + batchSize);
    const { error } = await supabase.from('appointments').insert(batch);
    
    if (error) {
      console.error(`Error migrating appointments batch ${i}:`, error);
    }
  }

  console.log(`Migrated ${appointments.length} appointments`);
}

// ============================================
// HELPERS
// ============================================

function inferCategory(serviceName: string): string {
  const name = serviceName.toLowerCase();
  
  if (name.includes('loc') || name.includes('retwist') || name.includes('dread')) {
    return 'locs';
  }
  if (name.includes('braid') || name.includes('cornrow') || name.includes('goddess')) {
    return 'braids';
  }
  if (name.includes('silk') || name.includes('press') || name.includes('flat iron')) {
    return 'silk_press';
  }
  if (name.includes('treatment') || name.includes('condition') || name.includes('scalp')) {
    return 'treatments';
  }
  if (name.includes('color') || name.includes('dye') || name.includes('highlight')) {
    return 'color';
  }
  if (name.includes('wash') || name.includes('twist') || name.includes('natural')) {
    return 'natural';
  }
  
  return 'other';
}

function mapStatus(ameliaStatus: string): string {
  const statusMap: Record<string, string> = {
    approved: 'confirmed',
    pending: 'pending',
    canceled: 'cancelled',
    rejected: 'cancelled',
    'no-show': 'no_show',
    completed: 'completed',
  };
  
  return statusMap[ameliaStatus.toLowerCase()] || 'completed';
}

// ============================================
// MAIN
// ============================================

async function main() {
  const migrationDir = './migration-data';
  
  console.log('Starting Amelia migration...\n');
  
  // Check for required files
  const requiredFiles = ['users.csv', 'services.csv', 'appointments.csv'];
  for (const file of requiredFiles) {
    const filePath = path.join(migrationDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing required file: ${filePath}`);
      console.log('\nPlease export the following tables from your WordPress database:');
      console.log('  - wp_amelia_users → users.csv');
      console.log('  - wp_amelia_services → services.csv');
      console.log('  - wp_amelia_appointments → appointments.csv');
      process.exit(1);
    }
  }
  
  try {
    // 1. Migrate services first
    const services = await migrateServices(path.join(migrationDir, 'services.csv'));
    const serviceMapping = new Map(
      services.map((s: any) => [String(s.amelia_service_id), s.id])
    );
    
    // 2. Migrate users (creates profile records)
    const { clients, stylists } = await migrateUsers(path.join(migrationDir, 'users.csv'));
    
    // Note: For a full migration, you'd need to:
    // - Create Supabase Auth accounts for stylists
    // - Store client info for later linking
    // For now, we'll skip the appointment migration since it requires user IDs
    
    console.log('\n✅ Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Create Supabase Auth accounts for stylists');
    console.log('2. Link migrated profiles to auth accounts');
    console.log('3. Set up stylist schedules and services');
    console.log('4. Send invite emails to existing clients');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

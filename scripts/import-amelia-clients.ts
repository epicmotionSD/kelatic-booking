import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUSINESS_ID = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';

interface Client {
  amelia_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birthday: string | null;
  note: string | null;
}

function parseInsertStatements(sql: string): Client[] {
  const clients: Client[] = [];
  
  // Find all INSERT statements
  const insertRegex = /INSERT INTO `gzf_amelia_users`\s*\(([^)]+)\)\s*VALUES\s*(.+?);/gs;
  
  let insertMatch;
  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const columns = insertMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    const valuesStr = insertMatch[2];
    
    // Find column indices
    const idIdx = columns.indexOf('id');
    const firstNameIdx = columns.indexOf('firstName');
    const lastNameIdx = columns.indexOf('lastName');
    const emailIdx = columns.indexOf('email');
    const phoneIdx = columns.indexOf('phone');
    const typeIdx = columns.indexOf('type');
    
    // Parse each row - handle quoted strings and NULLs
    const rows = parseRows(valuesStr);
    
    for (const row of rows) {
      // Only include customers
      const type = typeIdx >= 0 ? row[typeIdx] : 'customer';
      if (type !== 'customer') continue;
      
      const email = emailIdx >= 0 ? row[emailIdx] : null;
      const phone = phoneIdx >= 0 ? row[phoneIdx] : null;
      
      // Skip if no contact info
      if (!email && !phone) continue;
      
      clients.push({
        amelia_id: parseInt(row[idIdx] || '0'),
        first_name: (row[firstNameIdx] || '').trim(),
        last_name: (row[lastNameIdx] || '').trim(),
        email: email,
        phone: phone,
        gender: null,
        birthday: null,
        note: null,
      });
    }
  }
  
  return clients;
}

function parseRows(valuesStr: string): (string | null)[][] {
  const rows: (string | null)[][] = [];
  let current = '';
  let inString = false;
  let depth = 0;
  let row: (string | null)[] = [];
  let value = '';
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const prev = i > 0 ? valuesStr[i-1] : '';
    
    if (char === "'" && prev !== '\\') {
      inString = !inString;
      value += char;
    } else if (!inString) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          row = [];
          value = '';
        } else {
          value += char;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          // End of row
          row.push(parseValue(value.trim()));
          rows.push(row);
          value = '';
        } else {
          value += char;
        }
      } else if (char === ',' && depth === 1) {
        row.push(parseValue(value.trim()));
        value = '';
      } else if (depth >= 1) {
        value += char;
      }
    } else {
      value += char;
    }
  }
  
  return rows;
}

function parseValue(val: string): string | null {
  if (val === 'NULL' || val === '') return null;
  // Remove surrounding quotes
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'");
  }
  return val;
}

function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned || null;
}

async function importClients() {
  console.log('📂 Reading SQL files...\n');
  
  const files = [
    'gzf_amelia_users_1.sql',
    'gzf_amelia_users_2.sql',
    'gzf_amelia_users_3.sql',
    'gzf_amelia_users_4.sql',
    'gzf_amelia_users_5.sql',
    'gzf_amelia_users_6.sql',
  ];
  
  let allClients: Client[] = [];
  
  for (const file of files) {
    try {
      const sql = readFileSync(resolve(process.cwd(), file), 'utf-8');
      const clients = parseInsertStatements(sql);
      console.log(`✓ ${file}: ${clients.length} clients`);
      allClients = allClients.concat(clients);
    } catch (err) {
      console.log(`⚠ ${file}: not found or error reading`);
    }
  }
  
  console.log(`\n📊 Total clients parsed: ${allClients.length}`);
  
  if (allClients.length === 0) {
    console.log('No clients found to import.');
    return;
  }
  
  // Dedupe by email (keep first occurrence)
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const uniqueClients = allClients.filter(c => {
    const email = c.email?.toLowerCase();
    const phone = cleanPhone(c.phone);
    
    // Skip if we've seen this email or phone
    if (email && seenEmails.has(email)) return false;
    if (phone && seenPhones.has(phone)) return false;
    
    if (email) seenEmails.add(email);
    if (phone) seenPhones.add(phone);
    return true;
  });
  
  console.log(`📊 Unique clients (deduped): ${uniqueClients.length}`);
  
  // Check existing clients in Supabase to avoid duplicates
  console.log('\n🔍 Checking for existing clients in database...');
  
  const emails = uniqueClients.map(c => c.email?.toLowerCase()).filter(Boolean) as string[];
  const { data: existingByEmail } = await supabase
    .from('clients')
    .select('email')
    .eq('business_id', BUSINESS_ID)
    .in('email', emails.slice(0, 1000)); // Supabase has limits
    
  const existingEmails = new Set((existingByEmail || []).map(p => p.email?.toLowerCase()));
  console.log(`Found ${existingEmails.size} existing clients by email`);
  
  // Filter out existing
  const newClients = uniqueClients.filter(c => {
    const email = c.email?.toLowerCase();
    return !email || !existingEmails.has(email);
  });
  
  console.log(`📊 New clients to import: ${newClients.length}`);
  
  if (newClients.length === 0) {
    console.log('All clients already exist in database.');
    return;
  }
  
  // Import in batches of 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  
  console.log('\n📥 Importing clients...\n');
  
  for (let i = 0; i < newClients.length; i += batchSize) {
    const batch = newClients.slice(i, i + batchSize);
    
    const records = batch.map(c => ({
      first_name: c.first_name || 'Unknown',
      last_name: c.last_name || '',
      email: c.email?.toLowerCase() || null,
      phone: cleanPhone(c.phone),
      business_id: BUSINESS_ID,
      source: 'amelia_import',
      amelia_id: c.amelia_id,
    }));
    
    const { data, error } = await supabase
      .from('clients')
      .insert(records)
      .select('id');
    
    if (error) {
      console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      imported += data?.length || 0;
      process.stdout.write(`\r✓ Imported: ${imported} / ${newClients.length}`);
    }
  }
  
  console.log(`\n\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Errors: ${errors}`);
}

importClients();

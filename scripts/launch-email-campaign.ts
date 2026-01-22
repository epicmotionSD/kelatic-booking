import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import crypto from 'node:crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (flag: string, fallback?: string) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
};

const file = getArg('--file', 'gzf_amelia_users_segmented.csv')!;
const segmentFilter = (getArg('--segmentFilter', 'GRAVEYARD') || 'GRAVEYARD').toUpperCase();
const businessId = getArg('--businessId')!;
const businessName = getArg('--businessName', 'KeLatic Hair Lounge')!;
const service = getArg('--service', 'locs appointment')!;
const baseUrl = getArg('--baseUrl', 'https://kelatic.com')!;
const token = getArg('--token', process.env.CRON_SECRET) || '';
const count = Number(getArg('--count', '2000'));

if (!businessId) {
  console.error('Missing --businessId');
  process.exit(1);
}

if (!token) {
  console.error('Missing CRON_SECRET or --token');
  process.exit(1);
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(cell);
      cell = '';
      if (row.length > 1 || row.some(value => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function mapSegment(segment: string) {
  const normalized = segment.toUpperCase();
  if (normalized === 'GRAVEYARD') return 'ghost';
  if (normalized === 'CORE') return 'near-miss';
  if (normalized === 'DRIFTER') return 'vip';
  return normalized.toLowerCase();
}

async function loadLeads() {
  const csvPath = path.resolve(process.cwd(), file);
  const content = await fs.readFile(csvPath, 'utf8');
  const rows = parseCsv(content);

  if (rows.length === 0) {
    throw new Error(`No rows found in ${file}`);
  }

  const headers = rows[0].map(normalizeHeader);
  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => headerIndex.set(header, index));

  const getValue = (row: string[], key: string): string => {
    const idx = headerIndex.get(key);
    if (idx === undefined) return '';
    return (row[idx] || '').trim();
  };

  const leads = [] as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone: string;
    segment: string;
    days_since_contact: number;
    estimated_value: number;
    original_first_contact?: string | null;
    original_last_contact?: string | null;
  }>;

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const segment = getValue(row, 'segment').toUpperCase();
    if (segmentFilter !== 'ALL' && segment && segment !== segmentFilter) continue;

    const email = (getValue(row, 'email') || getValue(row, 'email_address')).toLowerCase();
    if (!email) continue;
    if (seenEmails.has(email)) continue;

    const phoneRaw = getValue(row, 'clean_phone') || getValue(row, 'phone') || '';
    if (phoneRaw && seenPhones.has(phoneRaw)) continue;

    const firstName = getValue(row, 'firstname') || getValue(row, 'first_name') || 'there';
    const lastName = getValue(row, 'lastname') || getValue(row, 'last_name') || '';
    const phone = phoneRaw;
    const daysInactive = Number(getValue(row, 'days_inactive') || '365');
    const firstContact = getValue(row, 'first_contact') || null;
    const lastContact = getValue(row, 'last_contact') || null;

    leads.push({
      id: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      segment: mapSegment(segment || segmentFilter),
      days_since_contact: daysInactive,
      estimated_value: Number(getValue(row, 'estimated_value') || '85'),
      original_first_contact: firstContact,
      original_last_contact: lastContact,
    });

    seenEmails.add(email);
    if (phoneRaw) {
      seenPhones.add(phoneRaw);
    }

    if (leads.length >= count) break;
  }

  return leads;
}

async function run() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false } });

  const leads = await loadLeads();
  console.log(`[leads] Loaded ${leads.length} leads from ${file}`);

  const cadenceConfig = [
    { day: 1, delayHours: 0, channel: 'email', script: 'direct_inquiry' },
    { day: 3, delayHours: 48, channel: 'email', script: 'file_closure' },
    { day: 7, delayHours: 144, channel: 'email', script: 'breakup' },
  ];

  const dailySendLimit = Number(getArg('--dailySendLimit', '1600'));

  const dbSegment = mapSegment(segmentFilter);

  const campaignId = crypto.randomUUID();

  const { error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      id: campaignId,
      business_id: businessId,
      name: `Email Reactivation - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: 'paused',
      segment: dbSegment,
      script_variant: 'direct_inquiry',
      script_template: 'email',
      script_variables: { service },
      cadence_type: 'custom',
      cadence_config: cadenceConfig,
      total_leads: leads.length,
      daily_send_limit: dailySendLimit,
      started_at: null,
      metrics: { sent: 0, delivered: 0, responded: 0, booked: 0, revenue: 0 },
    });

  if (campaignError) {
    throw new Error(`Failed to create campaign: ${campaignError.message}`);
  }

  const leadRows = leads.map((lead) => ({
    id: lead.id,
    campaign_id: campaignId,
    business_id: businessId,
    first_name: lead.first_name,
    last_name: lead.last_name,
    phone: lead.phone,
    email: lead.email,
    segment: dbSegment,
    days_since_contact: lead.days_since_contact,
    estimated_value: lead.estimated_value,
    source_platform: 'graveyard',
    original_first_contact: lead.original_first_contact,
    original_last_contact: lead.original_last_contact,
    status: 'pending',
    tcpa_compliant: true,
  }));

  const { error: leadsError } = await supabase
    .from('campaign_leads')
    .insert(leadRows);

  if (leadsError) {
    await supabase.from('campaigns').delete().eq('id', campaignId);
    throw new Error(`Failed to insert leads: ${leadsError.message}`);
  }

  const resumeUrl = new URL('/api/reactivation/resume', baseUrl).toString();
  const response = await fetch(resumeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ campaignId, businessId, businessName }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Launch failed (${response.status}): ${text}`);
  }

  console.log(`[launch] ${text}`);
  console.log(`Campaign ID: ${campaignId}`);
}

run().catch((error) => {
  console.error('[error]', error.message || error);
  process.exit(1);
});

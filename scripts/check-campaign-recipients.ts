import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const campaignId = process.argv[2];
if (!campaignId) {
  console.error('Usage: tsx scripts/check-campaign-recipients.ts <campaignId>');
  process.exit(1);
}

const csvPath = path.resolve(process.cwd(), 'gzf_amelia_users_segmented.csv');

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

async function loadCsvEmails() {
  const content = await fs.readFile(csvPath, 'utf8');
  const rows = parseCsv(content);
  if (!rows.length) {
    throw new Error('CSV has no rows');
  }

  const headers = rows[0].map(normalizeHeader);
  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => headerIndex.set(header, index));

  const getValue = (row: string[], key: string): string => {
    const idx = headerIndex.get(key);
    if (idx === undefined) return '';
    return (row[idx] || '').trim();
  };

  const emails: Record<string, { segment: string }> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const email = (getValue(row, 'email') || getValue(row, 'email_address') || '').trim().toLowerCase();
    if (!email) continue;
    emails[email] = {
      segment: (getValue(row, 'segment') || getValue(row, 'Segment') || '').trim(),
    };
  }

  return emails;
}

async function fetchCampaignEmails() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false } });
  const all: { to_email: string | null; status: string | null; cadence_day: number | null }[] = [];
  const pageSize = 1000;
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('campaign_messages')
      .select('to_email,status,cadence_day')
      .eq('campaign_id', campaignId)
      .eq('channel', 'email')
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page += 1;
  }

  return all;
}

async function run() {
  const csvEmails = await loadCsvEmails();
  const campaignMessages = await fetchCampaignEmails();

  const sentCounts: Record<string, number> = {};
  for (const msg of campaignMessages) {
    const email = (msg.to_email || '').trim().toLowerCase();
    if (!email) continue;
    sentCounts[email] = (sentCounts[email] || 0) + 1;
  }

  const matched = Object.keys(sentCounts).filter((email) => csvEmails[email]);

  const segmentCounts: Record<string, number> = {};
  for (const email of matched) {
    const segment = (csvEmails[email].segment || 'UNKNOWN').toUpperCase();
    segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
  }

  console.log(`CSV emails: ${Object.keys(csvEmails).length}`);
  console.log(`Campaign email recipients: ${Object.keys(sentCounts).length}`);
  console.log(`Matched CSV recipients: ${matched.length}`);
  Object.entries(segmentCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([segment, count]) => console.log(`${segment}: ${count}`));

  const outPath = path.resolve(process.cwd(), 'campaign_completed_matched_emails.csv');
  const output = ['email,times_sent,segment'];
  matched.sort().forEach((email) => {
    const segment = csvEmails[email].segment || '';
    output.push(`${email},${sentCounts[email]},${segment}`);
  });

  await fs.writeFile(outPath, output.join('\n'), 'utf8');
  console.log(`Saved matched emails to ${outPath}`);
}

run().catch((error) => {
  console.error('Failed to match recipients:', error.message || error);
  process.exit(1);
});

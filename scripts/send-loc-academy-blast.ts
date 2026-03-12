/**
 * Kelatic Loc Academy Blast Email - Resend Version
 * 
 * Sends promotional emails to the full client list about
 * Loc Academy classes starting March 30, 2025.
 * 
 * Usage:
 *   npx tsx scripts/send-loc-academy-blast.ts --dryRun          # Preview without sending
 *   npx tsx scripts/send-loc-academy-blast.ts --test            # Send test to shawnsonier04@gmail.com
 *   npx tsx scripts/send-loc-academy-blast.ts                   # Send to all contacts
 *   npx tsx scripts/send-loc-academy-blast.ts --subject 2       # Use subject line #2
 *   npx tsx scripts/send-loc-academy-blast.ts --batchSize 50    # Send in batches of 50
 *   npx tsx scripts/send-loc-academy-blast.ts --resume          # Resume from last progress
 */

import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================
// CONFIGURATION
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Kelatic Loc Academy <hello@kelatic.com>';
const TEST_EMAIL = 'shawnsonier04@gmail.com';
const PROGRESS_FILE = path.resolve(__dirname, '../.loc-academy-blast-progress.json');

// Subject line options
const SUBJECT_LINES: Record<number, string> = {
  1: '🎓 Loc Classes Start March 30 – Learn Retwist, Detox & Styling!',
  2: '💜 Ready to Learn Locs the RIGHT Way?',
  3: '✨ Become Certified in Loc Twisting & Care – Enrolling Now',
  4: '💰 Turn Loc Skills Into Income – Classes Now Open',
};

// CSV source files (relative to project root)
const CSV_SOURCES = [
  { file: 'gzf_amelia_users_segmented.csv', emailCol: 'email', firstNameCol: 'firstName' },
  { file: 'list.csv', emailCol: 'Email', firstNameCol: 'First Name' },
  { file: 'ghost_clients.csv', emailCol: 'email', firstNameCol: 'firstName' },
];

// ============================================================
// EMAIL TEMPLATE
// ============================================================

function getEmailHtml(firstName?: string): string {
  const greeting = firstName ? `Hey ${firstName}` : 'Hey Beautiful';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelatic Loc Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2d1b4e 0%, #4a2d6b 50%, #6b3fa0 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;font-weight:700;letter-spacing:1px;">
        KELATIC LOC ACADEMY
      </h1>
      <p style="color:#d4b8e8;font-size:14px;margin:0;letter-spacing:2px;text-transform:uppercase;">
        Learn. Create. Certify.
      </p>
    </div>

    <!-- Hero Banner -->
    <div style="background-color:#f8f4fc;padding:30px;text-align:center;border-bottom:3px solid #6b3fa0;">
      <h2 style="color:#2d1b4e;font-size:24px;margin:0 0 10px 0;">
        🎓 Classes Begin March 30th
      </h2>
      <p style="color:#666;font-size:16px;margin:0;">
        Professional Loc Education in San Diego
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding:30px;color:#333;line-height:1.7;font-size:15px;">
      
      <p style="font-size:17px;margin-top:0;">
        ${greeting} 👋
      </p>
      
      <p>
        You've been part of the Kelatic family — and now we're opening the doors to something brand new.
      </p>
      
      <p>
        <strong>Kelatic Loc Academy</strong> is officially enrolling for our first round of classes, and we want YOU to be part of it.
      </p>
      
      <p>
        Whether you want to learn how to maintain your own locs or become a certified loc technician and start earning — this is your chance.
      </p>

      <!-- What You'll Learn Box -->
      <div style="background-color:#f8f4fc;border-left:4px solid #6b3fa0;padding:20px;margin:25px 0;border-radius:0 8px 8px 0;">
        <h3 style="color:#2d1b4e;margin:0 0 15px 0;font-size:18px;">
          ✨ What You'll Learn:
        </h3>
        <ul style="margin:0;padding-left:20px;color:#444;">
          <li style="margin-bottom:8px;">Loc Retwist & Interlocking techniques</li>
          <li style="margin-bottom:8px;">Loc Detox & Deep Cleansing</li>
          <li style="margin-bottom:8px;">Loc Styling (updos, barrel rolls, wraps & more)</li>
          <li style="margin-bottom:8px;">How to manage your own locs at home</li>
          <li style="margin-bottom:8px;">Optional Certification to start taking clients</li>
        </ul>
      </div>

      <!-- Class Details -->
      <div style="background-color:#2d1b4e;color:#ffffff;padding:25px;border-radius:8px;margin:25px 0;">
        <h3 style="margin:0 0 15px 0;font-size:18px;color:#d4b8e8;">
          📅 Class Details:
        </h3>
        <table style="width:100%;color:#ffffff;font-size:14px;">
          <tr>
            <td style="padding:5px 0;width:40%;color:#d4b8e8;">Start Date:</td>
            <td style="padding:5px 0;"><strong>March 30, 2025</strong></td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#d4b8e8;">Location:</td>
            <td style="padding:5px 0;"><strong>San Diego, CA</strong></td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#d4b8e8;">Format:</td>
            <td style="padding:5px 0;"><strong>In-Person, Hands-On Training</strong></td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#d4b8e8;">Certification:</td>
            <td style="padding:5px 0;"><strong>Available upon completion</strong></td>
          </tr>
        </table>
      </div>

      <p>
        Spots are limited — this is a small, hands-on class so every student gets personal attention.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:30px 0;">
        <a href="https://kelaticlocacademy.com" 
           style="display:inline-block;background:linear-gradient(135deg,#6b3fa0,#8b5fc0);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(107,63,160,0.3);">
          🔗 Learn More & Enroll Now
        </a>
      </div>

      <p style="text-align:center;color:#666;font-style:italic;">
        Have questions? Just reply to this email — we'd love to chat.
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color:#2d1b4e;padding:25px 30px;text-align:center;">
      <p style="color:#d4b8e8;font-size:13px;margin:0 0 10px 0;">
        Kelatic Loc Academy · San Diego, CA
      </p>
      <div style="margin:15px 0;">
        <a href="https://kelaticlocacademy.com" style="color:#d4b8e8;text-decoration:none;font-size:13px;margin:0 10px;">Website</a>
        <span style="color:#4a2d6b;">|</span>
        <a href="https://instagram.com/kelaticlocs" style="color:#d4b8e8;text-decoration:none;font-size:13px;margin:0 10px;">Instagram</a>
        <span style="color:#4a2d6b;">|</span>
        <a href="https://kelatic.x3o.ai" style="color:#d4b8e8;text-decoration:none;font-size:13px;margin:0 10px;">Book Online</a>
      </div>
      <p style="color:#8b7a9e;font-size:11px;margin:15px 0 0 0;">
        You're receiving this because you're a valued Kelatic client.
        <br>If you'd prefer not to hear from us, simply reply "unsubscribe."
      </p>
    </div>
    
  </div>
</body>
</html>`;
}

// ============================================================
// CSV PARSING
// ============================================================

interface Contact {
  email: string;
  firstName?: string;
}

function parseCSV(filePath: string, emailCol: string, firstNameCol: string): Contact[] {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  CSV not found: ${filePath}`);
    return [];
  }

  const raw = fs.readFileSync(fullPath, 'utf-8');
  const lines = raw.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const emailIdx = headers.findIndex(h => h.toLowerCase() === emailCol.toLowerCase());
  const nameIdx = headers.findIndex(h => h.toLowerCase() === firstNameCol.toLowerCase());

  if (emailIdx === -1) {
    console.warn(`⚠️  Email column "${emailCol}" not found in ${filePath}`);
    return [];
  }

  const contacts: Contact[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const email = cols[emailIdx]?.toLowerCase().trim();
    
    if (email && email.includes('@') && email.includes('.')) {
      contacts.push({
        email,
        firstName: nameIdx >= 0 ? cols[nameIdx]?.trim() : undefined,
      });
    }
  }

  return contacts;
}

function loadAllContacts(): Contact[] {
  const allContacts = new Map<string, Contact>();

  for (const source of CSV_SOURCES) {
    const contacts = parseCSV(source.file, source.emailCol, source.firstNameCol);
    let newCount = 0;

    for (const contact of contacts) {
      if (!allContacts.has(contact.email)) {
        allContacts.set(contact.email, contact);
        newCount++;
      }
    }

    console.log(`📄 ${source.file}: ${contacts.length} emails (${newCount} new unique)`);
  }

  const result = Array.from(allContacts.values());
  console.log(`\n📊 Total unique contacts: ${result.length}`);
  return result;
}

// ============================================================
// PROGRESS TRACKING
// ============================================================

interface Progress {
  sentEmails: string[];
  failedEmails: string[];
  lastBatchIndex: number;
  startedAt: string;
  lastUpdated: string;
}

function loadProgress(): Progress | null {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return null;
}

function saveProgress(progress: Progress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ============================================================
// MAIN SEND LOGIC
// ============================================================

async function sendEmail(
  resend: Resend,
  to: string,
  subject: string,
  html: string,
  firstName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      tags: [
        { name: 'campaign', value: 'loc-academy-blast-2025' },
        { name: 'type', value: 'promotional' },
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dryRun');
  const isTest = args.includes('--test');
  const shouldResume = args.includes('--resume');
  
  // Parse subject line choice (default: 1)
  const subjectIdx = args.indexOf('--subject');
  const subjectChoice = subjectIdx >= 0 ? parseInt(args[subjectIdx + 1]) : 1;
  const subject = SUBJECT_LINES[subjectChoice] || SUBJECT_LINES[1];

  // Parse batch size (default: 100)
  const batchIdx = args.indexOf('--batchSize');
  const batchSize = batchIdx >= 0 ? parseInt(args[batchIdx + 1]) : 100;

  console.log('\n' + '='.repeat(60));
  console.log('🎓 KELATIC LOC ACADEMY - EMAIL BLAST');
  console.log('='.repeat(60));
  console.log(`📧 Subject: ${subject}`);
  console.log(`📦 Batch Size: ${batchSize}`);
  console.log(`🔧 Mode: ${isDryRun ? 'DRY RUN' : isTest ? 'TEST' : 'LIVE SEND'}`);
  console.log('='.repeat(60) + '\n');

  // Validate API key
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    console.error('   Get your API key at https://resend.com/api-keys');
    console.error('   Add to .env.local: RESEND_API_KEY=re_xxxxxxxxxxxx');
    process.exit(1);
  }

  const resend = new Resend(RESEND_API_KEY);

  // Load contacts
  console.log('📂 Loading contact lists...\n');
  let contacts = loadAllContacts();

  // Test mode: only send to test email
  if (isTest) {
    contacts = [{ email: TEST_EMAIL, firstName: 'Shawn' }];
    console.log(`\n🧪 TEST MODE: Sending only to ${TEST_EMAIL}\n`);
  }

  // Dry run mode: just show stats
  if (isDryRun) {
    console.log('\n🔍 DRY RUN - No emails will be sent');
    console.log(`   Would send to ${contacts.length} contacts`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${FROM_EMAIL}`);
    
    // Show sample
    console.log('\n📋 Sample contacts (first 10):');
    contacts.slice(0, 10).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.email} (${c.firstName || 'No name'})`);
    });
    return;
  }

  // Resume support
  let progress: Progress = {
    sentEmails: [],
    failedEmails: [],
    lastBatchIndex: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  if (shouldResume) {
    const saved = loadProgress();
    if (saved) {
      progress = saved;
      const alreadySent = new Set(progress.sentEmails);
      const originalCount = contacts.length;
      contacts = contacts.filter(c => !alreadySent.has(c.email));
      console.log(`\n🔄 RESUMING: ${progress.sentEmails.length} already sent, ${contacts.length} remaining (of ${originalCount})\n`);
    }
  }

  // Send emails
  let sent = 0;
  let failed = 0;
  let dailyLimitHit = false;

  console.log(`\n🚀 Sending ${contacts.length} emails...\n`);

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const html = getEmailHtml(contact.firstName);

    if (dailyLimitHit) {
      console.log(`\n⏸️  Daily limit reached. Run with --resume to continue tomorrow.`);
      break;
    }

    const result = await sendEmail(resend, contact.email, subject, html, contact.firstName);

    if (result.success) {
      sent++;
      progress.sentEmails.push(contact.email);
      
      if (sent % 10 === 0 || sent === contacts.length) {
        const pct = ((sent + failed) / contacts.length * 100).toFixed(1);
        console.log(`   ✅ ${sent} sent, ${failed} failed (${pct}% complete)`);
      }
    } else {
      failed++;
      progress.failedEmails.push(contact.email);
      console.log(`   ❌ Failed: ${contact.email} - ${result.error}`);

      // Check for rate limit / daily limit errors
      if (result.error?.includes('rate limit') || result.error?.includes('daily quota') || result.error?.includes('too many requests')) {
        dailyLimitHit = true;
        console.log(`\n⚠️  Rate/daily limit detected. Saving progress...`);
      }
    }

    // Save progress every 25 emails
    if ((sent + failed) % 25 === 0) {
      saveProgress(progress);
    }

    // Rate limiting: ~2 emails/second to stay safe
    if (i < contacts.length - 1) {
      await sleep(500);
    }
  }

  // Final save
  saveProgress(progress);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BLAST SUMMARY');
  console.log('='.repeat(60));
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📧 Total processed: ${sent + failed} / ${contacts.length}`);
  
  if (contacts.length > sent + failed) {
    console.log(`   ⏸️  Remaining: ${contacts.length - sent - failed} (use --resume to continue)`);
  }
  
  console.log(`   💾 Progress saved to: ${PROGRESS_FILE}`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('Failed emails:');
    progress.failedEmails.forEach(e => console.log(`   - ${e}`));
  }
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as sgMail from '@sendgrid/mail';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sendgridKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hello@kelatic.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!sendgridKey) {
  console.error('Missing SENDGRID_API_KEY');
  process.exit(1);
}

const campaignId = process.argv[2];
const toEmail = process.argv[3];

if (!campaignId || !toEmail) {
  console.error('Usage: tsx scripts/sendgrid-tracking-test.ts <campaignId> <email>');
  process.exit(1);
}

sgMail.setApiKey(sendgridKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function run() {
  const { data: lead, error: leadError } = await supabase
    .from('campaign_leads')
    .select('id, business_id')
    .eq('campaign_id', campaignId)
    .limit(1)
    .single();

  if (leadError || !lead) {
    console.error('Failed to load a campaign lead:', leadError?.message || 'Not found');
    process.exit(1);
  }

  const { data: message, error: messageError } = await supabase
    .from('campaign_messages')
    .insert({
      campaign_id: campaignId,
      campaign_lead_id: lead.id,
      business_id: lead.business_id,
      direction: 'outbound',
      channel: 'email',
      to_email: toEmail,
      from_email: fromEmail,
      body: 'Tracking test email',
      cadence_day: 0,
      script_variant: 'direct_inquiry',
      status: 'queued',
      queued_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (messageError || !message) {
    console.error('Failed to create campaign message:', messageError?.message || 'Unknown');
    process.exit(1);
  }

  const subject = 'Kelatic tracking test (campaign)';
  const html = '<p>Tracking test. <a href="https://kelatic.com/book">Book now</a></p>';

  const [res] = await sgMail.send({
    to: toEmail,
    from: fromEmail,
    subject,
    html,
    customArgs: {
      campaign_message_id: message.id,
      campaign_id: campaignId,
      campaign_lead_id: lead.id,
      business_id: lead.business_id,
    },
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
  });

  await supabase
    .from('campaign_messages')
    .update({
      status: res?.statusCode === 202 ? 'sent' : 'failed',
      sendgrid_message_id: res?.headers?.['x-message-id'] || res?.headers?.['X-Message-Id'],
      sent_at: res?.statusCode === 202 ? new Date().toISOString() : null,
    })
    .eq('id', message.id);

  console.log(`Sent ${res.statusCode} with campaign_message_id ${message.id}`);
}

run().catch((error) => {
  console.error('Failed to send tracking test:', error.message || error);
  process.exit(1);
});

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as sgMail from '@sendgrid/mail';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sendgridKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'info@kelatic.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!sendgridKey) {
  console.error('Missing SENDGRID_API_KEY');
  process.exit(1);
}

const campaignId = process.argv[2];
const dayRaw = process.argv[3];

if (!campaignId || !dayRaw) {
  console.error('Usage: tsx scripts/send-campaign-cadence-email.ts <campaignId> <day>');
  process.exit(1);
}

const day = Number(dayRaw);
if (!Number.isFinite(day)) {
  console.error('Day must be a number');
  process.exit(1);
}

sgMail.setApiKey(sendgridKey);

const BOOKING_URL = process.env.PUBLIC_BOOKING_URL || 'https://kelatic.com/book';
const OFFER_URL = process.env.PUBLIC_SPECIAL_OFFERS_URL || 'https://kelatic.com/special-offers';

const EMAIL_TEMPLATES = {
  direct_inquiry: {
    subject: 'Still thinking about {service} at {businessName}?',
    headline: "Let's get you booked",
    body: "Hi {firstName}, if you're still interested in {service}, we'd love to take care of you this week. You can grab the next available slot in minutes.",
    ctaLabel: 'Book your appointment',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'View the $75 Wednesday Special',
    secondaryUrl: OFFER_URL,
  },
  file_closure: {
    subject: 'Quick check-in from {businessName}',
    headline: 'Should we keep your spot open?',
    body: "Hi {firstName}, we were about to close your file for {service}. If you still want to come in, book below and we'll take care of the rest.",
    ctaLabel: 'Keep my spot',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'See current offers',
    secondaryUrl: OFFER_URL,
  },
  gift: {
    subject: 'A complimentary upgrade for your next visit',
    headline: 'We saved a bonus for you',
    body: "Hi {firstName}, we'd love to gift you a complimentary {service} upgrade on your next visit. Book now and we'll apply it for you.",
    ctaLabel: 'Claim the upgrade',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'Browse our specials',
    secondaryUrl: OFFER_URL,
  },
  breakup: {
    subject: 'Last check-in from {businessName}',
    headline: "We're here if you need us",
    body: "Hi {firstName}, we won't keep reaching out. If you ever want {service} again, you can book anytime below.",
    ctaLabel: 'Book anytime',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'See current offers',
    secondaryUrl: OFFER_URL,
  },
} as const;

function interpolateTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }, template);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function run() {
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id,business_id,cadence_config,script_variant,script_variables,daily_send_limit')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error('Failed to fetch campaign:', campaignError?.message || 'Not found');
    process.exit(1);
  }

  const cadenceConfig = Array.isArray(campaign.cadence_config) ? campaign.cadence_config : [];
  const cadenceStep = cadenceConfig.find((step: any) => Number(step.day) === day && (step.channel || step.type) === 'email');

  if (!cadenceStep) {
    console.error(`No email cadence step found for day ${day}.`);
    process.exit(1);
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', campaign.business_id)
    .single();

  if (businessError || !business) {
    console.error('Failed to fetch business:', businessError?.message || 'Not found');
    process.exit(1);
  }

  const { data: leads, error: leadsError } = await supabase
    .from('campaign_leads')
    .select('id,first_name,last_name,email,phone,status,has_responded')
    .eq('campaign_id', campaignId)
    .in('status', ['pending', 'in_progress'])
    .eq('has_responded', false);

  if (leadsError) {
    console.error('Failed to fetch leads:', leadsError.message);
    process.exit(1);
  }

  const { data: existingMessages, error: messagesError } = await supabase
    .from('campaign_messages')
    .select('campaign_lead_id')
    .eq('campaign_id', campaignId)
    .eq('cadence_day', day)
    .eq('channel', 'email');

  if (messagesError) {
    console.error('Failed to fetch existing messages:', messagesError.message);
    process.exit(1);
  }

  const alreadySent = new Set((existingMessages || []).map((msg) => msg.campaign_lead_id));

  const availableLeads = (leads || []).filter((lead) => lead.email && !alreadySent.has(lead.id));

  const dailyLimit = campaign.daily_send_limit || availableLeads.length;
  const batch = availableLeads.slice(0, dailyLimit);

  console.log(`Sending day ${day} email to ${batch.length} leads (skipping ${alreadySent.size} already sent).`);

  let sentCount = 0;
  let failedCount = 0;

  for (const lead of batch) {
    const scriptVariant = (cadenceStep.script || cadenceStep.scriptVariant || campaign.script_variant || 'direct_inquiry') as keyof typeof EMAIL_TEMPLATES;
    const emailTemplate = EMAIL_TEMPLATES[scriptVariant] || EMAIL_TEMPLATES.direct_inquiry;

    const templateVars = {
      firstName: lead.first_name || 'there',
      service: campaign.script_variables?.service || 'your appointment',
      businessName: business.name,
    };

    const subject = interpolateTemplate(emailTemplate.subject, templateVars);
    const headline = interpolateTemplate(emailTemplate.headline, templateVars);
    const body = interpolateTemplate(emailTemplate.body, templateVars);
    const ctaLabel = interpolateTemplate(emailTemplate.ctaLabel, templateVars);
    const ctaUrl = emailTemplate.ctaUrl;
    const secondaryLabel = emailTemplate.secondaryLabel
      ? interpolateTemplate(emailTemplate.secondaryLabel, templateVars)
      : null;
    const secondaryUrl = emailTemplate.secondaryUrl;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin: 0 0 12px; font-size: 22px;">${headline}</h2>
        <p style="margin: 0 0 16px;">${body}</p>
        <p style="margin: 24px 0;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 20px; background: #f59e0b; color: #111; text-decoration: none; border-radius: 999px; font-weight: 700;">
            ${ctaLabel}
          </a>
        </p>
        ${secondaryLabel && secondaryUrl ? `<p style=\"margin: 0 0 8px;\"><a href=\"${secondaryUrl}\" style=\"color: #f59e0b; text-decoration: none;\">${secondaryLabel}</a></p>` : ''}
        <p style="margin: 24px 0 0; color: #666; font-size: 12px;">If you no longer want to hear from us, you can ignore this email.</p>
      </div>
    `;

    const emailBodyText = `${headline}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}${secondaryLabel && secondaryUrl ? `\n${secondaryLabel}: ${secondaryUrl}` : ''}`;

    const { data: emailMessage, error: emailMessageError } = await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: campaignId,
        campaign_lead_id: lead.id,
        business_id: campaign.business_id,
        direction: 'outbound',
        channel: 'email',
        to_email: lead.email,
        from_email: fromEmail,
        body: emailBodyText,
        cadence_day: day,
        script_variant: scriptVariant,
        status: 'queued',
        queued_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (emailMessageError || !emailMessage) {
      console.error(`Failed to create email record for lead ${lead.id}:`, emailMessageError?.message || 'Unknown');
      failedCount += 1;
      continue;
    }

    try {
      const [response] = await sgMail.send({
        to: lead.email,
        from: fromEmail,
        subject,
        html,
        customArgs: {
          campaign_message_id: emailMessage.id,
          campaign_id: campaignId,
          campaign_lead_id: lead.id,
          business_id: campaign.business_id,
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      });

      const messageId = response?.headers?.['x-message-id'] || response?.headers?.['X-Message-Id'];

      await supabase
        .from('campaign_messages')
        .update({
          status: response?.statusCode === 202 ? 'sent' : 'failed',
          sendgrid_message_id: messageId,
          sent_at: response?.statusCode === 202 ? new Date().toISOString() : null,
          failed_at: response?.statusCode === 202 ? null : new Date().toISOString(),
        })
        .eq('id', emailMessage.id);

      await supabase
        .from('campaign_leads')
        .update({
          status: 'in_progress',
          current_cadence_day: day,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      sentCount += 1;
    } catch (error) {
      const err = error as { message?: string };
      await supabase
        .from('campaign_messages')
        .update({
          status: 'failed',
          error_message: err.message || 'SendGrid error',
          failed_at: new Date().toISOString(),
        })
        .eq('id', emailMessage.id);

      failedCount += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Done. Sent: ${sentCount}, Failed: ${failedCount}`);
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

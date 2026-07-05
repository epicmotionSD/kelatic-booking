// Notification Service - Email (Resend) & SMS (Twilio)
// Multi-tenant aware - uses business context for branding
import type { Business, BusinessSettings } from '@/lib/tenant';
import {
  getEmailProviderName,
  getSmsProviderName,
  isEmailProviderConfigured,
  isSmsProviderConfigured,
  sendEmailMessage,
  sendSmsMessage,
} from '@/lib/notifications/providers';
import { createAdminClient } from '@/lib/supabase/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

// Get business URL
function getBusinessUrl(business: Business): string {
  if (business.custom_domain) {
    return `https://${business.custom_domain}`;
  }
  return `https://${business.slug}.${ROOT_DOMAIN}`;
}

// Get full address string
function getFullAddress(business: Business): string {
  const parts = [business.address, business.city, business.state, business.zip].filter(Boolean);
  return parts.join(', ');
}

// Get logo URL
function getLogoUrl(business: Business): string {
  if (business.logo_url?.startsWith('http')) {
    return business.logo_url;
  }
  return `${getBusinessUrl(business)}${business.logo_url || '/logo.png'}`;
}

function getBrandGradient(business: Business): string {
  const primaryColor = business.primary_color || '#f59e0b';
  const secondaryColor = business.secondary_color || primaryColor;
  return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
}

// Get provider-aware from email to avoid using an unverified sender domain.
function getFromEmail(ctx: BusinessContext): string {
  const provider = getEmailProviderName();

  if (provider === 'sendgrid') {
    return ctx.settings?.sendgrid_from_email
      || process.env.SENDGRID_FROM_EMAIL
      || process.env.RESEND_FROM_EMAIL
      || `bookings@${ROOT_DOMAIN}`;
  }

  if (provider === 'resend') {
    return process.env.RESEND_FROM_EMAIL
      || process.env.SENDGRID_FROM_EMAIL
      || `bookings@${ROOT_DOMAIN}`;
  }

  if (provider === 'smtp') {
    return process.env.SMTP_USER
      || process.env.RESEND_FROM_EMAIL
      || process.env.SENDGRID_FROM_EMAIL
      || `bookings@${ROOT_DOMAIN}`;
  }

  return process.env.SENDGRID_FROM_EMAIL
    || process.env.RESEND_FROM_EMAIL
    || ctx.settings?.sendgrid_from_email
    || `bookings@${ROOT_DOMAIN}`;
}

export interface AppointmentDetails {
  id: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  stylist_name: string;
  service_name: string;
  service_duration: number;
  appointment_date: string;
  appointment_time: string;
  total_amount?: number;
  add_ons?: string[];
  notes?: string;
}

export interface BusinessContext {
  business: Business;
  settings?: BusinessSettings | null;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format time for display
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}

function getInternalCcRecipients(ctx: BusinessContext): string[] {
  if (ctx.business.slug === 'kelatic') {
    return ['info@kelatic.com'];
  }
  return [];
}

// ============================================
// SHARED EMAIL LAYOUT BUILDER
// ============================================

interface EmailLayoutOptions {
  business: Business;
  bannerText?: string | null;
  bannerSubtext?: string | null;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  footerNote?: string;
}

function buildEmailHtml(opts: EmailLayoutOptions): string {
  const { business } = opts;
  const primaryColor = business.primary_color || '#f59e0b';
  const address = getFullAddress(business);
  const siteUrl = getBusinessUrl(business);
  const city = business.city ? `${business.city}${business.state ? ', ' + business.state : ''}` : '';
  const businessDomain = business.custom_domain || `${business.slug}.${ROOT_DOMAIN}`;

  const bannerHtml = opts.bannerText ? `
          <!-- OFFER / INFO BANNER -->
          <tr>
            <td style="background:${primaryColor};padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:800;color:#111111;letter-spacing:0.06em;">${opts.bannerText}</p>
              ${opts.bannerSubtext ? `<p style="margin:4px 0 0;font-size:12px;color:#111111;opacity:0.75;">${opts.bannerSubtext}</p>` : ''}
            </td>
          </tr>` : '';

  const ctaHtml = opts.ctaLabel && opts.ctaUrl ? `
              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="background:${primaryColor};border-radius:8px;">
                    <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111111;text-decoration:none;letter-spacing:0.02em;">${opts.ctaLabel}</a>
                  </td>
                </tr>
              </table>` : '';

  const secondaryHtml = opts.secondaryLabel && opts.secondaryUrl ? `
              <p style="margin:12px 0 0;font-size:13px;">
                <a href="${opts.secondaryUrl}" style="color:${primaryColor};text-decoration:underline;">${opts.secondaryLabel}</a>
              </p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:#111111;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:#ffffff;text-transform:uppercase;">${business.name}</p>
              ${business.tagline ? `<p style="margin:4px 0 0;font-size:11px;color:#888888;letter-spacing:0.12em;text-transform:uppercase;">${business.tagline}</p>` : ''}
            </td>
          </tr>
${bannerHtml}
          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111111;line-height:1.3;">${opts.headline}</h1>
              ${opts.bodyHtml}
${ctaHtml}
${secondaryHtml}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eeeeee;margin:0;" />
            </td>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#111111;">${business.name}</p>
              <p style="margin:0 0 12px;font-size:12px;color:#888888;">${city ? city + ' &middot; ' : ''}${businessDomain}</p>
              <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.6;">
                ${opts.footerNote || `You're receiving this because you have an appointment with us.<br/>Questions? ${business.phone ? `Call us at ${business.phone}.` : `Visit ${businessDomain}.`}`}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function getConfirmationEmailHtml(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const primaryColor = business.primary_color || '#f59e0b';
  const isPending = appointment.status === 'pending';
  const firstName = appointment.client_name.split(' ')[0];

  const addOnsHtml = appointment.add_ons?.length
    ? `<p style="margin:4px 0 0;font-size:13px;color:#888888;">Add-ons: ${appointment.add_ons.join(', ')}</p>`
    : '';

  const addressHtml = (() => {
    const addr = getFullAddress(business);
    if (!addr) return '';
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
    return `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#f9f9f9;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Location</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#111111;">${addr}</p>
                    <a href="${mapsUrl}" style="font-size:13px;color:${primaryColor};text-decoration:none;">Get Directions &rarr;</a>
                  </td>
                </tr>
              </table>`;
  })();

  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">${
    isPending
      ? `Hi ${firstName}, your appointment request is pending. Complete your deposit to lock in your time.`
      : `Hi ${firstName}, you're all set! We can't wait to see you. Here are your details:`
  }</p>

              <!-- APPOINTMENT DETAILS CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #eeeeee;">
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Service</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${appointment.service_name}</p>
                    ${addOnsHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding:16px 20px;border-bottom:1px solid #eeeeee;border-right:1px solid #eeeeee;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${formatDate(appointment.appointment_date)}</p>
                        </td>
                        <td width="50%" style="padding:16px 20px;border-bottom:1px solid #eeeeee;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${formatTime(appointment.appointment_time)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:16px 20px;border-right:1px solid #eeeeee;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Stylist</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${appointment.stylist_name}</p>
                        </td>
                        <td width="50%" style="padding:16px 20px;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Duration</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${formatDuration(appointment.service_duration)}</p>
                        </td>
                      </tr>
                      ${appointment.total_amount != null ? `
                      <tr>
                        <td colspan="2" style="padding:16px 20px;border-top:1px solid #eeeeee;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Total</p>
                          <p style="margin:0;font-size:20px;font-weight:700;color:${primaryColor};">$${(appointment.total_amount ?? 0).toFixed(2)}</p>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              ${addressHtml}

              <!-- REMINDERS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">Reminders</p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.8;">
                      &bull; Arrive 10&ndash;15 minutes early<br/>
                      &bull; Come with clean, product-free hair<br/>
                      &bull; Reschedule at least 24 hours in advance<br/>
                      &bull; Late arrivals may result in shortened service time
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#888888;">
                Need to reschedule?
                <a href="${siteUrl}/appointments/${appointment.id}/reschedule" style="color:${primaryColor};text-decoration:none;">Reschedule here</a>${business.phone ? ` or call <a href="tel:${business.phone.replace(/[^0-9]/g, '')}" style="color:${primaryColor};text-decoration:none;">${business.phone}</a>` : ''}.
              </p>`;

  return buildEmailHtml({
    business,
    bannerText: isPending ? 'DEPOSIT REQUIRED' : 'APPOINTMENT CONFIRMED',
    bannerSubtext: isPending ? 'Complete your deposit to lock in your slot' : "We're excited to see you",
    headline: isPending ? 'Your booking is pending' : `See you ${formatDate(appointment.appointment_date)}`,
    bodyHtml,
    ctaLabel: isPending ? 'Complete Deposit' : 'View Appointment',
    ctaUrl: `${siteUrl}/appointments/${appointment.id}`,
  });
}

function getReminderEmailHtml(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const primaryColor = business.primary_color || '#f59e0b';
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'today';
  const firstName = appointment.client_name.split(' ')[0];

  const addressHtml = (() => {
    const addr = getFullAddress(business);
    if (!addr) return '';
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addr)}`;
    return `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#f9f9f9;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Location</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#111111;">${addr}</p>
                    <a href="${mapsUrl}" style="font-size:13px;color:${primaryColor};text-decoration:none;">Get Directions &rarr;</a>
                  </td>
                </tr>
              </table>`;
  })();

  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">Hi ${firstName}, just a heads-up &mdash; your appointment is <strong>${timeLabel}</strong>. We're looking forward to seeing you!</p>

              <!-- APPOINTMENT SUMMARY -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111111;">${appointment.service_name}</p>
                    <p style="margin:0 0 4px;font-size:14px;color:#444444;">${formatDate(appointment.appointment_date)} &middot; ${formatTime(appointment.appointment_time)}</p>
                    <p style="margin:0;font-size:14px;color:#888888;">with ${appointment.stylist_name} &middot; ${formatDuration(appointment.service_duration)}</p>
                  </td>
                </tr>
              </table>

              ${addressHtml}

              <!-- CHECKLIST -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">Before you arrive</p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.8;">
                      &bull; Arrive 10&ndash;15 minutes early<br/>
                      &bull; Come with clean, product-free hair<br/>
                      &bull; Bring reference photos if you have a look in mind<br/>
                      &bull; Have your payment method ready
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#888888;">Can't make it? ${business.phone ? `Call us at <a href="tel:${business.phone.replace(/[^0-9]/g, '')}" style="color:${primaryColor};text-decoration:none;">${business.phone}</a> to reschedule.` : `<a href="${siteUrl}/appointments/${appointment.id}/reschedule" style="color:${primaryColor};text-decoration:none;">Reschedule here</a>.`}</p>`;

  return buildEmailHtml({
    business,
    bannerText: hoursUntil === 24 ? 'SEE YOU TOMORROW' : 'SEE YOU TODAY',
    bannerSubtext: `${formatTime(appointment.appointment_time)} &middot; ${appointment.service_name}`,
    headline: `Your appointment is ${timeLabel}!`,
    bodyHtml,
    ctaLabel: 'View Appointment',
    ctaUrl: `${siteUrl}/appointments/${appointment.id}`,
  });
}

function getCancellationEmailHtml(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const primaryColor = business.primary_color || '#f59e0b';
  const firstName = appointment.client_name.split(' ')[0];

  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">Hi ${firstName}, your appointment has been cancelled. We're sorry we won't be seeing you this time &mdash; we hope to welcome you back soon.</p>

              <!-- CANCELLED DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#aaaaaa;text-decoration:line-through;">${appointment.service_name}</p>
                    <p style="margin:0;font-size:14px;color:#aaaaaa;text-decoration:line-through;">${formatDate(appointment.appointment_date)} &middot; ${formatTime(appointment.appointment_time)}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#444444;">Whenever you're ready, we'd love to see you again. Book a new appointment at any time.</p>`;

  return buildEmailHtml({
    business,
    bannerText: null,
    headline: 'Appointment cancelled',
    bodyHtml,
    ctaLabel: 'Book a New Appointment',
    ctaUrl: `${siteUrl}/book`,
    footerNote: `You're receiving this because you had an appointment with us.<br/>Questions? ${business.phone ? `Call us at ${business.phone}.` : `Visit ${getBusinessUrl(business)}.`}`,
  });
}

function getStylistNotificationHtml(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const primaryColor = business.primary_color || '#f59e0b';

  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">A new appointment has been booked. Here are the details:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #eeeeee;">
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Client</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${appointment.client_name}</p>
                    ${appointment.client_phone ? `<p style="margin:2px 0 0;font-size:13px;color:#888888;">${appointment.client_phone}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #eeeeee;">
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Service</p>
                    <p style="margin:0;font-size:15px;color:#111111;">${appointment.service_name} &mdash; ${formatDuration(appointment.service_duration)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding:16px 20px;border-right:1px solid #eeeeee;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${formatDate(appointment.appointment_date)}</p>
                        </td>
                        <td width="50%" style="padding:16px 20px;">
                          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                          <p style="margin:0;font-size:14px;color:#111111;">${formatTime(appointment.appointment_time)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${appointment.notes ? `
                <tr>
                  <td style="padding:16px 20px;border-top:1px solid #eeeeee;">
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Client Notes</p>
                    <p style="margin:0;font-size:14px;color:#111111;">${appointment.notes}</p>
                  </td>
                </tr>` : ''}
              </table>`;

  return buildEmailHtml({
    business,
    bannerText: 'NEW BOOKING',
    bannerSubtext: `${appointment.client_name} &mdash; ${formatDate(appointment.appointment_date)}`,
    headline: 'You have a new appointment',
    bodyHtml,
    footerNote: `Internal notification from ${business.name}.`,
  });
}

// ============================================
// SMS TEMPLATES
// ============================================

function getConfirmationSms(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const address = getFullAddress(business);
  const isPending = appointment.status === 'pending';

  if (isPending) {
    return `⏳ ${business.name} Booking Pending

📅 ${formatDate(appointment.appointment_date)}
⏰ ${formatTime(appointment.appointment_time)}
💇 ${appointment.service_name} with ${appointment.stylist_name}

Complete your deposit to confirm this appointment.${business.phone ? ` Need help? Call ${business.phone}` : ''}`;
  }

  return `✅ ${business.name} Booking Confirmed!

📅 ${formatDate(appointment.appointment_date)}
⏰ ${formatTime(appointment.appointment_time)}
💇 ${appointment.service_name} with ${appointment.stylist_name}
${address ? `\n📍 ${address}` : ''}
${business.phone ? `\nNeed to reschedule? Call ${business.phone}` : ''}`;
}

function getReminderSms(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): string {
  const { business } = ctx;
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'today';

  return `⏰ Reminder: Your ${business.name} appointment is ${timeLabel}!

📅 ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}
💇 ${appointment.service_name}

Please arrive 10 min early.${business.phone ? ` Can't make it? Call ${business.phone}` : ''}`;
}

function getCancellationSms(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);

  return `Your ${business.name} appointment on ${formatDate(appointment.appointment_date)} has been cancelled.

Book a new appointment anytime at ${siteUrl}/book${business.phone ? ` or call ${business.phone}` : ''}`;
}

// ============================================
// SEND FUNCTIONS
// ============================================

export async function sendConfirmationEmail(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  if (!isEmailProviderConfigured()) {
    console.log(`[Email] ${getEmailProviderName()} not configured, skipping confirmation email`);
    return false;
  }

  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);
  const isPending = appointment.status === 'pending';

  try {
    const result = await sendEmailMessage({
      to: appointment.client_email,
      cc: getInternalCcRecipients(ctx),
      fromEmail,
      fromName: business.name,
      subject: isPending
        ? `Appointment pending - ${formatDate(appointment.appointment_date)}`
        : `Appointment confirmed - ${formatDate(appointment.appointment_date)}`,
      html: getConfirmationEmailHtml(appointment, ctx),
    });

    if (!result.success) {
      throw new Error(result.error || 'Email provider send failed');
    }

    console.log(`[Email] Confirmation sent to ${appointment.client_email}`);
    if (result.messageId) {
      console.log('[Email] Provider message ID:', result.messageId);
    }
    return true;
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderEmail(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): Promise<boolean> {
  if (!isEmailProviderConfigured()) {
    console.log(`[Email] ${getEmailProviderName()} not configured, skipping reminder email`);
    return false;
  }

  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);

  try {
    const result = await sendEmailMessage({
      to: appointment.client_email,
      fromEmail,
      fromName: business.name,
      subject: `Reminder: your appointment is ${hoursUntil === 24 ? 'tomorrow' : 'today'}`,
      html: getReminderEmailHtml(appointment, hoursUntil, ctx),
    });

    if (!result.success) {
      throw new Error(result.error || 'Email provider send failed');
    }

    console.log(`[Email] Reminder sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationEmail(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  if (!isEmailProviderConfigured()) {
    console.log(`[Email] ${getEmailProviderName()} not configured, skipping cancellation email`);
    return false;
  }

  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);

  try {
    const result = await sendEmailMessage({
      to: appointment.client_email,
      fromEmail,
      fromName: business.name,
      subject: `Appointment Cancelled - ${business.name}`,
      html: getCancellationEmailHtml(appointment, ctx),
    });

    if (!result.success) {
      throw new Error(result.error || 'Email provider send failed');
    }

    console.log(`[Email] Cancellation sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send cancellation:', error);
    return false;
  }
}

export async function sendConfirmationSms(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!isSmsProviderConfigured() || !fromPhone || !appointment.client_phone) {
    console.log(`[SMS] ${getSmsProviderName()} not configured or no phone number, skipping confirmation SMS`);
    return false;
  }

  try {
    const result = await sendSmsMessage({
      body: getConfirmationSms(appointment, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });

    if (!result.success) {
      throw new Error(result.error || 'SMS provider send failed');
    }

    console.log(`[SMS] Confirmation sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderSms(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!isSmsProviderConfigured() || !fromPhone || !appointment.client_phone) {
    console.log(`[SMS] ${getSmsProviderName()} not configured or no phone number, skipping reminder SMS`);
    return false;
  }

  try {
    const result = await sendSmsMessage({
      body: getReminderSms(appointment, hoursUntil, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });

    if (!result.success) {
      throw new Error(result.error || 'SMS provider send failed');
    }

    console.log(`[SMS] Reminder sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationSms(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!isSmsProviderConfigured() || !fromPhone || !appointment.client_phone) {
    console.log(`[SMS] ${getSmsProviderName()} not configured or no phone number, skipping cancellation SMS`);
    return false;
  }

  try {
    const result = await sendSmsMessage({
      body: getCancellationSms(appointment, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });

    if (!result.success) {
      throw new Error(result.error || 'SMS provider send failed');
    }

    console.log(`[SMS] Cancellation sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send cancellation:', error);
    return false;
  }
}

// ============================================
// COMBINED NOTIFICATION FUNCTIONS
// ============================================

export async function sendBookingConfirmation(appointment: AppointmentDetails, ctx: BusinessContext): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendConfirmationEmail(appointment, ctx),
    sendConfirmationSms(appointment, ctx),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendBookingReminder(
  appointment: AppointmentDetails,
  hoursUntil: number,
  ctx: BusinessContext
): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendReminderEmail(appointment, hoursUntil, ctx),
    sendReminderSms(appointment, hoursUntil, ctx),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendBookingCancellation(appointment: AppointmentDetails, ctx: BusinessContext): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendCancellationEmail(appointment, ctx),
    sendCancellationSms(appointment, ctx),
  ]);

  return { email: emailResult, sms: smsResult };
}

// ============================================
// STYLIST NOTIFICATIONS
// ============================================

function getStylistNotificationEmailHtml(
  appointment: AppointmentDetails,
  ctx: BusinessContext
): string {
  const { business } = ctx;
  const logoUrl = getLogoUrl(business);
  const gradient = getBrandGradient(business);
  const addOnsHtml = appointment.add_ons?.length
    ? `<p style="margin: 2px 0 0; color: #a1a1aa; font-size: 14px;">Add-ons: ${appointment.add_ons.join(', ')}</p>`
    : '';
  const notesHtml = appointment.notes
    ? `
      <tr>
        <td style="padding-top: 16px; border-top: 1px solid #52525b;">
          <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Client Notes</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 15px;">${appointment.notes}</p>
        </td>
      </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #18181b 100%); padding: 30px; text-align: center; border-bottom: 2px solid ${business.primary_color};">
              <img src="${logoUrl}" alt="${business.name}" style="height: 60px; width: auto;" />
            </td>
          </tr>

          <!-- Title Banner -->
          <tr>
            <td style="background: ${gradient}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">📅 New Appointment</h1>
              <p style="margin: 10px 0 0; color: rgba(0,0,0,0.7); font-size: 16px;">You have a new client booked</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px;">Hi ${appointment.stylist_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">A new appointment has been booked with you. Here are the details:</p>

              <!-- Client Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid ${business.primary_color};">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: ${business.primary_color}; font-size: 12px; font-weight: 600; text-transform: uppercase;">Client</p>
                    <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${appointment.client_name}</p>
                  </td>
                </tr>
              </table>

              <!-- Appointment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #52525b;">
                <tr><td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 16px; border-bottom: 1px solid #52525b;">
                        <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Service</p>
                        <p style="margin: 4px 0 0; color: #ffffff; font-size: 18px; font-weight: 600;">${appointment.service_name}</p>
                        ${addOnsHtml}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 0; border-bottom: 1px solid #52525b;">
                        <table width="100%">
                          <tr>
                            <td width="50%">
                              <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Date</p>
                              <p style="margin: 4px 0 0; color: #ffffff; font-size: 16px;">${formatDate(appointment.appointment_date)}</p>
                            </td>
                            <td width="50%">
                              <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Time</p>
                              <p style="margin: 4px 0 0; color: #ffffff; font-size: 16px;">${formatTime(appointment.appointment_time)}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px; ${notesHtml ? 'border-bottom: 1px solid #52525b; padding-bottom: 16px;' : ''}">
                        <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Duration</p>
                        <p style="margin: 4px 0 0; color: #ffffff; font-size: 16px;">${formatDuration(appointment.service_duration)}</p>
                      </td>
                    </tr>
                    ${notesHtml}
                  </table>
                </td></tr>
              </table>

              <!-- Footer note -->
              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">This is an internal notification for ${business.name} staff only.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 30px; text-align: center; border-top: 1px solid #3f3f46;">
              <img src="${logoUrl}" alt="${business.name}" style="height: 36px; width: auto; margin-bottom: 12px;" />
              <p style="margin: 0; color: #71717a; font-size: 12px;">© ${new Date().getFullYear()} ${business.name}. Internal staff notification.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function notifyStylistNewBooking(
  stylistEmail: string,
  stylistPhone: string | null,
  appointment: AppointmentDetails,
  ctx: BusinessContext
): Promise<void> {
  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  // Email to stylist
  if (isEmailProviderConfigured()) {
    try {
      const result = await sendEmailMessage({
        to: stylistEmail,
        fromEmail,
        fromName: business.name,
        subject: `New booking: ${appointment.client_name} - ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}`,
        html: getStylistNotificationEmailHtml(appointment, ctx),
      });

      if (!result.success) {
        throw new Error(result.error || 'Email provider send failed');
      }
    } catch (error) {
      console.error('[Email] Failed to notify stylist:', error);
    }
  }

  // SMS to stylist
  if (isSmsProviderConfigured() && fromPhone && stylistPhone) {
    try {
      const result = await sendSmsMessage({
        body: `📅 New booking: ${appointment.client_name} for ${appointment.service_name} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}`,
        from: fromPhone,
        to: stylistPhone,
      });

      if (!result.success) {
        throw new Error(result.error || 'SMS provider send failed');
      }
    } catch (error) {
      console.error('[SMS] Failed to notify stylist:', error);
    }
  }
}

// ============================================
// NEWSLETTER FUNCTIONS
// ============================================

export interface NewsletterContent {
  subject: string;
  previewText?: string;
  headline: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

function getNewsletterEmailHtml(
  content: NewsletterContent,
  subscriberEmail: string,
  ctx: BusinessContext
): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const unsubscribeToken = Buffer.from(subscriberEmail.toLowerCase()).toString('base64');
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&token=${unsubscribeToken}`;

  const bodyHtml = `
              <div style="font-size:15px;line-height:1.7;color:#444444;">${content.content}</div>`;

  return buildEmailHtml({
    business,
    headline: content.headline,
    bodyHtml,
    ctaLabel: content.ctaText,
    ctaUrl: content.ctaUrl,
    footerNote: `You're receiving this because you subscribed to updates from ${business.name}.<br/><a href="${unsubscribeUrl}" style="color:#888888;">Unsubscribe</a>`,
  });
}

export async function sendNewsletterEmail(
  content: NewsletterContent,
  subscriberEmail: string,
  ctx: BusinessContext
): Promise<boolean> {
  if (!isEmailProviderConfigured()) {
    console.log(`[Email] ${getEmailProviderName()} not configured, skipping newsletter`);
    return false;
  }

  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);

  try {
    const result = await sendEmailMessage({
      to: subscriberEmail,
      fromEmail,
      fromName: business.name,
      subject: content.subject,
      html: getNewsletterEmailHtml(content, subscriberEmail, ctx),
    });

    if (!result.success) {
      throw new Error(result.error || 'Email provider send failed');
    }

    console.log(`[Email] Newsletter sent to ${subscriberEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send newsletter:', error);
    return false;
  }
}

// ─── Send confirmation by appointment id ─────────────────────────────────────
// Used by both the booking POST handler (when no deposit is required) and the
// Stripe webhook (when a deposit lands and the appointment flips confirmed).
// Logs the result to notification_logs and de-dupes — if a confirmation has
// already been logged for this appointment, this is a no-op.
export async function sendConfirmationByAppointmentId(
  appointmentId: string,
  source: 'booking_api' | 'stripe_webhook'
): Promise<void> {
  try {
    const admin = createAdminClient();

    // De-dupe: don't send a confirmation twice. The booking-api path skips
    // sending for pending bookings, so the webhook is the source for those.
    // But if anything ever calls both, this guards against duplicates.
    const { data: existingLog } = await admin
      .from('notification_logs')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('notification_type', 'confirmation')
      .maybeSingle();
    if (existingLog) {
      console.log(`[${source}] Confirmation already sent for ${appointmentId}, skipping`);
      return;
    }

    const { data: appointment, error } = await admin
      .from('appointments')
      .select(`
        id,
        status,
        start_time,
        business_id,
        is_walk_in,
        walk_in_name,
        walk_in_email,
        walk_in_phone,
        client:profiles!appointments_client_id_fkey (
          id, first_name, last_name, email, phone
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id, first_name, last_name, email, phone
        ),
        service:services (
          id, name, duration
        ),
        appointment_addons (
          service:services (name)
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      console.error(`[${source}] Appointment not found for notification:`, { error, appointmentId });
      return;
    }

    const client = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client;
    const stylist = Array.isArray(appointment.stylist) ? appointment.stylist[0] : appointment.stylist;
    const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;

    const clientName = client
      ? `${client.first_name} ${client.last_name}`
      : appointment.walk_in_name || 'Guest';
    const clientEmail = client?.email || appointment.walk_in_email;
    const clientPhone = client?.phone || appointment.walk_in_phone;

    if (!clientEmail) {
      console.error(`[${source}] No client email for ${appointmentId}, skipping`);
      return;
    }

    const { data: businessRow } = await admin
      .from('businesses')
      .select('*')
      .eq('id', appointment.business_id)
      .single();
    if (!businessRow) {
      console.error(`[${source}] Business not found for notification`);
      return;
    }

    const { data: settingsRow } = await admin
      .from('business_settings')
      .select('*')
      .eq('business_id', appointment.business_id)
      .maybeSingle();

    const timezone = businessRow?.timezone || 'America/Chicago';
    const startTime = new Date(appointment.start_time);
    const appointmentDate = startTime.toLocaleDateString('en-CA', { timeZone: timezone });
    const appointmentTime = startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });

    const appointmentDetails: AppointmentDetails = {
      id: appointment.id,
      status: appointment.status,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || undefined,
      stylist_name: `${stylist?.first_name ?? ''} ${stylist?.last_name ?? ''}`.trim(),
      service_name: service?.name || 'Service',
      service_duration: service?.duration || 60,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      add_ons: appointment.appointment_addons?.map((a: any) => a.service?.name).filter(Boolean),
    };

    const ctx = { business: businessRow, settings: settingsRow || null };

    const result = await sendBookingConfirmation(appointmentDetails, ctx as any);
    console.log(`[${source}] Confirmation result:`, result);

    if (stylist?.email) {
      await notifyStylistNewBooking(stylist.email, stylist.phone, appointmentDetails, ctx as any);
    }

    await admin.from('notification_logs').insert({
      appointment_id: appointmentId,
      notification_type: 'confirmation',
      email_sent: result?.email || false,
      sms_sent: result?.sms || false,
      recipient_email: clientEmail,
      recipient_phone: clientPhone,
    });
  } catch (err) {
    console.error(`[${source}] Failed to send confirmation:`, err);
  }
}

// ============================================
// PRODUCT ORDER NOTIFICATIONS (Vitality House storefront)
// ============================================
// Fired by the Stripe webhook when an online product order is paid. Sends the
// customer a branded receipt and notifies the shop owner that a sale came in.
// Best-effort: any failure is logged but never blocks the webhook ack.

interface OrderRow {
  id: string;
  business_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  tip_cents: number | null;
  discount_cents: number | null;
  total_cents: number | null;
  notes: string | null;
  fulfillment_type: string | null;
}

interface OrderItemRow {
  product_name: string | null;
  quantity: number | null;
  unit_price_cents: number | null;
  line_total_cents: number | null;
  selected_options: Array<{ name?: string }> | null;
}

function money(cents: number | null | undefined): string {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

function orderItemsRowsHtml(items: OrderItemRow[], primaryColor: string): string {
  return items
    .map((it) => {
      const opts = (it.selected_options || [])
        .map((o) => o?.name)
        .filter(Boolean)
        .join(', ');
      return `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:14px;color:#111111;">
                    <strong>${it.quantity ?? 1}×</strong> ${it.product_name || 'Item'}
                    ${opts ? `<span style="display:block;font-size:12px;color:#888888;">${opts}</span>` : ''}
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:14px;color:#111111;text-align:right;white-space:nowrap;">${money(it.line_total_cents)}</td>
                </tr>`;
    })
    .join('');
}

function orderTotalsHtml(order: OrderRow, primaryColor: string): string {
  const rows: string[] = [
    `<tr><td style="padding:4px 0;font-size:14px;color:#888888;">Subtotal</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${money(order.subtotal_cents)}</td></tr>`,
  ];
  if ((order.discount_cents ?? 0) > 0) {
    rows.push(`<tr><td style="padding:4px 0;font-size:14px;color:${primaryColor};">Reward discount</td><td style="padding:4px 0;font-size:14px;color:${primaryColor};text-align:right;">-${money(order.discount_cents)}</td></tr>`);
  }
  if ((order.tax_cents ?? 0) > 0) {
    rows.push(`<tr><td style="padding:4px 0;font-size:14px;color:#888888;">Tax</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${money(order.tax_cents)}</td></tr>`);
  }
  if ((order.tip_cents ?? 0) > 0) {
    rows.push(`<tr><td style="padding:4px 0;font-size:14px;color:#888888;">Tip</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${money(order.tip_cents)}</td></tr>`);
  }
  rows.push(`<tr><td style="padding:10px 0 0;font-size:16px;font-weight:700;color:#111111;">Total</td><td style="padding:10px 0 0;font-size:18px;font-weight:700;color:${primaryColor};text-align:right;">${money(order.total_cents)}</td></tr>`);
  return rows.join('');
}

function getOrderReceiptHtml(order: OrderRow, items: OrderItemRow[], business: Business): string {
  const primaryColor = business.primary_color || '#3f7d4f';
  const firstName = (order.customer_name || 'there').split(' ')[0];
  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">Hi ${firstName}, thanks for your order! We've received it and will have it ready for pickup shortly.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:20px;">
                <tr><td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${orderItemsRowsHtml(items, primaryColor)}
                    ${orderTotalsHtml(order, primaryColor)}
                  </table>
                </td></tr>
              </table>
              ${order.notes ? `<p style="margin:0 0 8px;font-size:13px;color:#888888;"><strong>Your notes:</strong> ${order.notes}</p>` : ''}
              <p style="margin:0;font-size:13px;color:#888888;">Pickup only${business.phone ? ` &middot; Questions? Call ${business.phone}` : ''}.</p>`;

  return buildEmailHtml({
    business,
    bannerText: 'ORDER CONFIRMED',
    bannerSubtext: 'Thanks for supporting us',
    headline: 'Your order is confirmed',
    bodyHtml,
    footerNote: `You're receiving this because you placed an order with ${business.name}.`,
  });
}

type SaleChannel = 'online' | 'in_store';

function getOwnerOrderHtml(
  order: OrderRow,
  items: OrderItemRow[],
  business: Business,
  channel: SaleChannel = 'online'
): string {
  const primaryColor = business.primary_color || '#3f7d4f';
  const intro = channel === 'in_store'
    ? 'You just recorded a new in-store register sale.'
    : 'You just received a new online order.';
  const bodyHtml = `
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444444;">${intro}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeee;border-radius:8px;margin-bottom:20px;">
                <tr><td style="padding:16px 20px;border-bottom:1px solid #eeeeee;">
                  <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:0.08em;">Customer</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${order.customer_name || 'Guest'}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#888888;">${order.customer_email || ''}${order.customer_phone ? ` &middot; ${order.customer_phone}` : ''}</p>
                </td></tr>
                <tr><td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${orderItemsRowsHtml(items, primaryColor)}
                    ${orderTotalsHtml(order, primaryColor)}
                  </table>
                </td></tr>
              </table>
              ${order.notes ? `<p style="margin:0 0 8px;font-size:13px;color:#888888;"><strong>Order notes:</strong> ${order.notes}</p>` : ''}`;

  return buildEmailHtml({
    business,
    bannerText: channel === 'in_store' ? 'NEW REGISTER SALE' : 'NEW ORDER',
    bannerSubtext: `${order.customer_name || 'Guest'} &middot; ${money(order.total_cents)}`,
    headline: `${channel === 'in_store' ? 'New register sale' : 'New order'} &middot; ${money(order.total_cents)}`,
    bodyHtml,
    ctaLabel: 'View in dashboard',
    ctaUrl: `${getBusinessUrl(business)}/admin/orders`,
    footerNote: `Internal sale notification from ${business.name}.`,
  });
}

// Send the customer receipt + owner sale notification for a paid product order.
// Idempotency is handled by the caller (only fire on the pending→paid transition).
export async function sendOrderNotifications(
  orderId: string,
  opts?: { channel?: SaleChannel }
): Promise<void> {
  const channel: SaleChannel = opts?.channel ?? 'online';
  try {
    const admin = createAdminClient();

    const { data: order } = await admin
      .from('orders')
      .select('id, business_id, customer_name, customer_email, customer_phone, subtotal_cents, tax_cents, tip_cents, discount_cents, total_cents, notes, fulfillment_type')
      .eq('id', orderId)
      .single();
    if (!order) {
      console.error(`[order-notify] Order not found: ${orderId}`);
      return;
    }

    const { data: items } = await admin
      .from('order_items')
      .select('product_name, quantity, unit_price_cents, line_total_cents, selected_options')
      .eq('order_id', orderId);

    const { data: business } = await admin
      .from('businesses')
      .select('*')
      .eq('id', order.business_id)
      .single();
    if (!business) {
      console.error(`[order-notify] Business not found for order ${orderId}`);
      return;
    }

    if (!isEmailProviderConfigured()) {
      console.log('[order-notify] Email provider not configured, skipping');
      return;
    }

    const ctx: BusinessContext = { business: business as Business, settings: null };
    const fromEmail = getFromEmail(ctx);
    const orderRow = order as OrderRow;
    const itemRows = (items || []) as OrderItemRow[];

    // Customer receipt
    if (orderRow.customer_email) {
      try {
        const result = await sendEmailMessage({
          to: orderRow.customer_email,
          fromEmail,
          fromName: business.name,
          subject: `Your ${business.name} order — ${money(orderRow.total_cents)}`,
          html: getOrderReceiptHtml(orderRow, itemRows, business as Business),
        });
        if (!result.success) throw new Error(result.error || 'send failed');
        console.log(`[order-notify] Receipt sent to ${orderRow.customer_email}`);
      } catch (err) {
        console.error('[order-notify] Receipt send failed:', err);
      }
    }

    // Owner notification — Kelatic Vitality House routes all sale confirmations
    // to its dedicated inbox; other tenants use their configured business email.
    const ownerEmail = business.slug === 'vitality'
      ? 'business4kelatic@gmail.com'
      : business.email;
    if (ownerEmail) {
      const cc = getInternalCcRecipients(ctx).filter((e) => e !== ownerEmail);
      try {
        const result = await sendEmailMessage({
          to: ownerEmail,
          cc: cc.length ? cc : undefined,
          fromEmail,
          fromName: business.name,
          subject: `🛎️ ${channel === 'in_store' ? 'New register sale' : 'New order'} — ${money(orderRow.total_cents)} from ${orderRow.customer_name || 'a customer'}`,
          html: getOwnerOrderHtml(orderRow, itemRows, business as Business, channel),
        });
        if (!result.success) throw new Error(result.error || 'send failed');
        console.log(`[order-notify] Owner notified at ${ownerEmail}`);
      } catch (err) {
        console.error('[order-notify] Owner notify send failed:', err);
      }
    }

    // Owner SMS (best-effort) if Twilio + a business phone are configured.
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || '';
    if (isSmsProviderConfigured() && fromPhone && business.phone) {
      try {
        await sendSmsMessage({
          from: fromPhone,
          to: business.phone,
          body: `🛎️ New ${business.name} ${channel === 'in_store' ? 'register sale' : 'order'}: ${money(orderRow.total_cents)} from ${orderRow.customer_name || 'a customer'}. Check your dashboard.`,
        });
      } catch (err) {
        console.error('[order-notify] Owner SMS failed:', err);
      }
    }
  } catch (err) {
    console.error('[order-notify] Failed:', err);
  }
}

// ============================================
// REFERRAL CONVERSION NOTIFICATIONS
// ============================================
// Fired by the loyalty module when a referee's first paid event flips a
// pending referral to converted. Best-effort: failures are logged but never
// block the conversion itself.

export interface ReferralConversionDetails {
  referrerEmail: string | null;
  referrerPhone: string | null;
  referrerName: string;
  refereeName: string;
  pointsAwarded: number;
  currencyLabel: string;
  newBalance: number;
}

function getReferralConversionEmailHtml(
  details: ReferralConversionDetails,
  ctx: BusinessContext
): string {
  const { business } = ctx;
  const primaryColor = business.primary_color || '#f59e0b';
  const firstName = details.referrerName.split(' ')[0] || 'there';
  const bodyHtml = `
              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
                Thanks for sharing <strong>${business.name}</strong>.
                <strong>${details.refereeName}</strong> just made their first
                purchase &mdash; and you just earned
                <strong style="color:${primaryColor};">${details.pointsAwarded} ${details.currencyLabel}</strong>
                as a thank-you.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;border-radius:8px;margin:16px 0;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#666;">Your balance</p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:#111;">${details.newBalance} <span style="font-size:14px;font-weight:400;color:#666;">${details.currencyLabel}</span></p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;color:#888;line-height:1.6;">
                Keep sharing your code &mdash; every friend who joins is more ${details.currencyLabel} for you.
              </p>`;

  return buildEmailHtml({
    business,
    bannerText: 'REFERRAL CONVERTED',
    bannerSubtext: `+${details.pointsAwarded} ${details.currencyLabel}`,
    headline: `Your friend joined ${business.name}`,
    bodyHtml,
    ctaLabel: 'View your rewards',
    ctaUrl: `${getBusinessUrl(business)}/account`,
  });
}

export async function sendReferralConversionEmail(
  details: ReferralConversionDetails,
  ctx: BusinessContext
): Promise<boolean> {
  if (!isEmailProviderConfigured()) return false;
  if (!details.referrerEmail) return false;

  const { business } = ctx;
  const fromEmail = getFromEmail(ctx);

  try {
    const result = await sendEmailMessage({
      to: details.referrerEmail,
      fromEmail,
      fromName: business.name,
      subject: `You earned ${details.pointsAwarded} ${details.currencyLabel} — referral converted!`,
      html: getReferralConversionEmailHtml(details, ctx),
    });
    if (!result.success) {
      throw new Error(result.error || 'Email provider send failed');
    }
    console.log(`[Email] Referral conversion sent to ${details.referrerEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send referral conversion:', error);
    return false;
  }
}

export async function sendReferralConversionSms(
  details: ReferralConversionDetails,
  ctx: BusinessContext
): Promise<boolean> {
  const fromPhone =
    ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';
  if (!isSmsProviderConfigured() || !fromPhone || !details.referrerPhone) {
    return false;
  }

  const firstName = details.refereeName.split(' ')[0] || 'Your friend';
  const body =
    `${firstName} just made their first purchase at ${ctx.business.name}! ` +
    `You earned ${details.pointsAwarded} ${details.currencyLabel}. Balance: ${details.newBalance}.`;

  try {
    const result = await sendSmsMessage({
      body,
      from: fromPhone,
      to: details.referrerPhone,
    });
    if (!result.success) {
      throw new Error(result.error || 'SMS provider send failed');
    }
    console.log(`[SMS] Referral conversion sent to ${details.referrerPhone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send referral conversion:', error);
    return false;
  }
}

/** Fire both channels in parallel; either failing is non-fatal. */
export async function sendReferralConversionNotice(
  details: ReferralConversionDetails,
  ctx: BusinessContext
): Promise<{ email: boolean; sms: boolean }> {
  const [email, sms] = await Promise.all([
    sendReferralConversionEmail(details, ctx),
    sendReferralConversionSms(details, ctx),
  ]);
  return { email, sms };
}

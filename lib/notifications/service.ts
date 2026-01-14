// Notification Service - Email (SendGrid) & SMS (Twilio)
// Multi-tenant aware - uses business context for branding
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import type { Business, BusinessSettings } from '@/lib/tenant';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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

// Get brand gradient
function getBrandGradient(business: Business): string {
  return `linear-gradient(135deg, ${business.primary_color} 0%, ${business.secondary_color} 100%)`;
}

export interface AppointmentDetails {
  id: string;
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

// ============================================
// EMAIL TEMPLATES
// ============================================

function getConfirmationEmailHtml(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const logoUrl = getLogoUrl(business);
  const address = getFullAddress(business);
  const gradient = getBrandGradient(business);

  const addOnsHtml = appointment.add_ons?.length
    ? `<p style="margin: 0; color: #666;">Add-ons: ${appointment.add_ons.join(', ')}</p>`
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #18181b 100%); padding: 30px; text-align: center; border-bottom: 2px solid ${business.primary_color};">
              <img src="${logoUrl}" alt="${business.name}" style="height: 60px; width: auto;" />
            </td>
          </tr>
          <!-- Title Banner -->
          <tr>
            <td style="background: ${gradient}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">Appointment Confirmed!</h1>
              <p style="margin: 10px 0 0; color: rgba(0,0,0,0.7); font-size: 16px;">We're excited to see you</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">Your appointment has been confirmed! We're excited to see you. Here are your booking details:</p>

              <!-- Appointment Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #52525b;">
                <tr>
                  <td>
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
                        <td style="padding: 16px 0; border-bottom: 1px solid #52525b;">
                          <table width="100%">
                            <tr>
                              <td width="50%">
                                <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Stylist</p>
                                <p style="margin: 4px 0 0; color: #ffffff; font-size: 16px;">${appointment.stylist_name}</p>
                              </td>
                              <td width="50%">
                                <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Duration</p>
                                <p style="margin: 4px 0 0; color: #ffffff; font-size: 16px;">${formatDuration(appointment.service_duration)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; color: ${business.primary_color}; font-size: 14px; font-weight: 600; text-transform: uppercase;">Total</p>
                          <p style="margin: 4px 0 0; color: ${business.primary_color}; font-size: 24px; font-weight: 700;">$${appointment.total_amount.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Location -->
              ${address ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 600;">📍 Location</p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">${address}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(address)}" style="color: ${business.primary_color}; font-size: 14px; text-decoration: none;">Get Directions →</a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Important Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(245, 158, 11, 0.3);">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: ${business.primary_color}; font-size: 16px; font-weight: 600;">⚡ Important Reminders</p>
                    <ul style="margin: 0; padding-left: 20px; color: #a1a1aa; font-size: 14px; line-height: 1.8;">
                      <li>Please arrive 10-15 minutes early</li>
                      <li>Come with clean, product-free hair unless otherwise instructed</li>
                      <li>If you need to reschedule, please give us at least 24 hours notice</li>
                      <li>Late arrivals may result in shortened service time</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="${siteUrl}/appointments/${appointment.id}" style="display: inline-block; padding: 14px 32px; background: ${gradient}; color: #000000; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">View Appointment</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Need to make changes? <a href="${siteUrl}/appointments/${appointment.id}/reschedule" style="color: ${business.primary_color}; text-decoration: none;">Reschedule</a>${business.phone ? ` or call us at <a href="tel:${business.phone.replace(/[^0-9]/g, '')}" style="color: ${business.primary_color}; text-decoration: none;">${business.phone}</a>` : ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
              <img src="${logoUrl}" alt="${business.name}" style="height: 40px; width: auto; margin-bottom: 15px;" />
              ${address ? `<p style="margin: 0 0 5px; color: #a1a1aa; font-size: 14px;">${address}</p>` : ''}
              ${business.phone ? `<p style="margin: 0 0 15px; color: #a1a1aa; font-size: 14px;">${business.phone}</p>` : ''}
              <p style="margin: 0; color: #71717a; font-size: 12px;">© ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
              ${business.tagline ? `<p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">${business.tagline}</p>` : ''}
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

function getReminderEmailHtml(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): string {
  const { business } = ctx;
  const logoUrl = getLogoUrl(business);
  const address = getFullAddress(business);
  const gradient = getBrandGradient(business);
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'today';

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #18181b 100%); padding: 30px; text-align: center; border-bottom: 2px solid ${business.primary_color};">
              <img src="${logoUrl}" alt="${business.name}" style="height: 60px; width: auto;" />
            </td>
          </tr>
          <!-- Title Banner -->
          <tr>
            <td style="background: ${gradient}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">Appointment Reminder ⏰</h1>
              <p style="margin: 10px 0 0; color: rgba(0,0,0,0.7); font-size: 16px;">Your appointment is ${timeLabel}!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">This is a friendly reminder about your upcoming appointment at ${business.name}.</p>

              <!-- Appointment Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #52525b;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 600;">${appointment.service_name}</p>
                    <p style="margin: 0 0 4px; color: #a1a1aa; font-size: 16px;">📅 ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}</p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 16px;">💇 with ${appointment.stylist_name}</p>
                  </td>
                </tr>
              </table>

              <!-- Checklist -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(245, 158, 11, 0.3);">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: ${business.primary_color}; font-size: 16px; font-weight: 600;">✅ Pre-Appointment Checklist</p>
                    <ul style="margin: 0; padding-left: 20px; color: #a1a1aa; font-size: 14px; line-height: 2;">
                      <li>Arrive 10-15 minutes early</li>
                      <li>Hair should be clean and product-free</li>
                      <li>Bring reference photos if you have a specific style in mind</li>
                      <li>Have your payment method ready</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Location -->
              ${address ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 600;">📍 Location</p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">${address}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(address)}" style="color: ${business.primary_color}; font-size: 14px; text-decoration: none;">Get Directions →</a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Can't make it? ${business.phone ? `Please call us at <a href="tel:${business.phone.replace(/[^0-9]/g, '')}" style="color: ${business.primary_color}; text-decoration: none;">${business.phone}</a> to reschedule.` : `Please contact us to reschedule.`}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
              <img src="${logoUrl}" alt="${business.name}" style="height: 40px; width: auto; margin-bottom: 15px;" />
              ${address ? `<p style="margin: 0 0 5px; color: #a1a1aa; font-size: 14px;">${address}</p>` : ''}
              ${business.phone ? `<p style="margin: 0 0 15px; color: #a1a1aa; font-size: 14px;">${business.phone}</p>` : ''}
              <p style="margin: 0; color: #71717a; font-size: 12px;">See you soon! ✨</p>
              ${business.tagline ? `<p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">${business.tagline}</p>` : ''}
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

function getCancellationEmailHtml(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const siteUrl = getBusinessUrl(business);
  const logoUrl = getLogoUrl(business);
  const address = getFullAddress(business);
  const gradient = getBrandGradient(business);

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #18181b 100%); padding: 30px; text-align: center; border-bottom: 2px solid ${business.primary_color};">
              <img src="${logoUrl}" alt="${business.name}" style="height: 60px; width: auto;" />
            </td>
          </tr>
          <!-- Title Banner -->
          <tr>
            <td style="background-color: #3f3f46; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Appointment Cancelled</h1>
              <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 16px;">We hope to see you again soon</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">Your appointment has been cancelled as requested. We're sorry we won't be seeing you this time!</p>

              <!-- Cancelled Appointment Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #52525b;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #71717a; font-size: 14px; text-decoration: line-through;">${appointment.service_name}</p>
                    <p style="margin: 0; color: #71717a; font-size: 14px; text-decoration: line-through;">${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}</p>
                  </td>
                </tr>
              </table>

              <!-- Rebook CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="margin: 0 0 20px; color: #a1a1aa; font-size: 16px;">We'd love to see you soon! Book a new appointment when you're ready.</p>
                    <a href="${siteUrl}/book" style="display: inline-block; padding: 14px 32px; background: ${gradient}; color: #000000; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">Book New Appointment</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
              <img src="${logoUrl}" alt="${business.name}" style="height: 40px; width: auto; margin-bottom: 15px;" />
              ${address ? `<p style="margin: 0 0 5px; color: #a1a1aa; font-size: 14px;">${address}</p>` : ''}
              ${business.phone ? `<p style="margin: 0 0 15px; color: #a1a1aa; font-size: 14px;">${business.phone}</p>` : ''}
              <p style="margin: 0; color: #71717a; font-size: 12px;">© ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
              ${business.tagline ? `<p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">${business.tagline}</p>` : ''}
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

// ============================================
// SMS TEMPLATES
// ============================================

function getConfirmationSms(appointment: AppointmentDetails, ctx: BusinessContext): string {
  const { business } = ctx;
  const address = getFullAddress(business);

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
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping confirmation email');
    return false;
  }

  const { business } = ctx;
  const fromEmail = ctx.settings?.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL || `bookings@${ROOT_DOMAIN}`;

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: fromEmail,
        name: business.name,
      },
      subject: `✨ Appointment Confirmed - ${formatDate(appointment.appointment_date)}`,
      html: getConfirmationEmailHtml(appointment, ctx),
    });
    console.log(`[Email] Confirmation sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderEmail(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping reminder email');
    return false;
  }

  const { business } = ctx;
  const fromEmail = ctx.settings?.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL || `bookings@${ROOT_DOMAIN}`;

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: fromEmail,
        name: business.name,
      },
      subject: `⏰ Reminder: Your appointment is ${hoursUntil === 24 ? 'tomorrow' : 'today'}!`,
      html: getReminderEmailHtml(appointment, hoursUntil, ctx),
    });
    console.log(`[Email] Reminder sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationEmail(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping cancellation email');
    return false;
  }

  const { business } = ctx;
  const fromEmail = ctx.settings?.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL || `bookings@${ROOT_DOMAIN}`;

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: fromEmail,
        name: business.name,
      },
      subject: `Appointment Cancelled - ${business.name}`,
      html: getCancellationEmailHtml(appointment, ctx),
    });
    console.log(`[Email] Cancellation sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send cancellation:', error);
    return false;
  }
}

export async function sendConfirmationSms(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!twilioClient || !fromPhone || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping confirmation SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getConfirmationSms(appointment, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });
    console.log(`[SMS] Confirmation sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderSms(appointment: AppointmentDetails, hoursUntil: number, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!twilioClient || !fromPhone || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping reminder SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getReminderSms(appointment, hoursUntil, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });
    console.log(`[SMS] Reminder sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationSms(appointment: AppointmentDetails, ctx: BusinessContext): Promise<boolean> {
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  if (!twilioClient || !fromPhone || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping cancellation SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getCancellationSms(appointment, ctx),
      from: fromPhone,
      to: appointment.client_phone,
    });
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

export async function notifyStylistNewBooking(
  stylistEmail: string,
  stylistPhone: string | null,
  appointment: AppointmentDetails,
  ctx: BusinessContext
): Promise<void> {
  const { business } = ctx;
  const fromEmail = ctx.settings?.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL || `bookings@${ROOT_DOMAIN}`;
  const fromPhone = ctx.settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '';

  // Email to stylist
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: stylistEmail,
        from: {
          email: fromEmail,
          name: business.name,
        },
        subject: `📅 New Booking: ${appointment.client_name} - ${formatDate(appointment.appointment_date)}`,
        html: `
          <h2>New Appointment Booked</h2>
          <p><strong>Client:</strong> ${appointment.client_name}</p>
          <p><strong>Service:</strong> ${appointment.service_name}</p>
          <p><strong>Date:</strong> ${formatDate(appointment.appointment_date)}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.appointment_time)}</p>
          <p><strong>Duration:</strong> ${formatDuration(appointment.service_duration)}</p>
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
        `,
      });
    } catch (error) {
      console.error('[Email] Failed to notify stylist:', error);
    }
  }

  // SMS to stylist
  if (twilioClient && fromPhone && stylistPhone) {
    try {
      await twilioClient.messages.create({
        body: `📅 New booking: ${appointment.client_name} for ${appointment.service_name} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}`,
        from: fromPhone,
        to: stylistPhone,
      });
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
  const logoUrl = getLogoUrl(business);
  const address = getFullAddress(business);
  const gradient = getBrandGradient(business);

  const unsubscribeToken = Buffer.from(subscriberEmail.toLowerCase()).toString('base64');
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&token=${unsubscribeToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  ${content.previewText ? `<!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${content.previewText}</span>` : ''}
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #18181b 100%); padding: 30px; text-align: center; border-bottom: 2px solid ${business.primary_color};">
              <img src="${logoUrl}" alt="${business.name}" style="height: 60px; width: auto;" />
            </td>
          </tr>

          <!-- Headline Banner -->
          <tr>
            <td style="background: ${gradient}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">${content.headline}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="color: #a1a1aa; font-size: 16px; line-height: 1.8;">
                ${content.content}
              </div>

              ${content.ctaText && content.ctaUrl ? `
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${content.ctaUrl}" style="display: inline-block; padding: 16px 40px; background: ${gradient}; color: #000000; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px;">${content.ctaText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #3f3f46; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center; border-top: 1px solid #3f3f46;">
              <img src="${logoUrl}" alt="${business.name}" style="height: 40px; width: auto; margin-bottom: 15px;" />
              ${address ? `<p style="margin: 0 0 5px; color: #a1a1aa; font-size: 14px;">${address}</p>` : ''}
              ${business.phone ? `
              <p style="margin: 0 0 15px; color: #a1a1aa; font-size: 14px;">
                <a href="tel:${business.phone.replace(/[^0-9]/g, '')}" style="color: ${business.primary_color}; text-decoration: none;">${business.phone}</a>
              </p>
              ` : ''}

              <!-- Social Links -->
              <p style="margin: 0 0 20px;">
                ${business.instagram_handle ? `<a href="https://instagram.com/${business.instagram_handle.replace('@', '')}" style="color: ${business.primary_color}; text-decoration: none; margin: 0 10px;">Instagram</a>` : ''}
                <a href="${siteUrl}/book" style="color: ${business.primary_color}; text-decoration: none; margin: 0 10px;">Book Now</a>
              </p>

              <p style="margin: 0; color: #71717a; font-size: 12px;">© ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
              ${business.tagline ? `<p style="margin: 10px 0 0; color: #71717a; font-size: 11px;">${business.tagline}</p>` : ''}

              <!-- Unsubscribe -->
              <p style="margin: 20px 0 0; color: #52525b; font-size: 11px;">
                Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #52525b; text-decoration: underline;">Unsubscribe</a>
              </p>
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

export async function sendNewsletterEmail(
  to: string,
  content: NewsletterContent,
  ctx: BusinessContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Newsletter] SendGrid not configured, skipping email');
    return { success: false, error: 'SendGrid not configured' };
  }

  const { business } = ctx;
  const fromEmail = ctx.settings?.sendgrid_from_email || process.env.SENDGRID_FROM_EMAIL || `newsletter@${ROOT_DOMAIN}`;

  try {
    const [response] = await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: business.name,
      },
      subject: content.subject,
      html: getNewsletterEmailHtml(content, to, ctx),
    });

    console.log(`[Newsletter] Email sent to ${to}`);
    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error) {
    console.error('[Newsletter] Failed to send:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBulkNewsletter(
  subscribers: Array<{ email: string; firstName?: string }>,
  content: NewsletterContent,
  ctx: BusinessContext
): Promise<{
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const result = await sendNewsletterEmail(subscriber.email, content, ctx);
    results.push({
      email: subscriber.email,
      success: result.success,
      error: result.error,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`[Newsletter] Bulk send complete: ${sent} sent, ${failed} failed`);
  return { sent, failed, results };
}

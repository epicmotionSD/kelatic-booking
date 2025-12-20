// Notification Service - Email (SendGrid) & SMS (Twilio)
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'bookings@kelatic.com';
const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER || '';
const SALON_NAME = 'KeLatic Hair Lounge';
const SALON_PHONE = '(713) 555-1234';
const SALON_ADDRESS = '123 Main Street, Houston, TX 77001';

export interface AppointmentDetails {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  stylist_name: string;
  service_name: string;
  service_duration: number;
  appointment_date: string; // ISO date string
  appointment_time: string; // HH:MM format
  total_amount: number;
  add_ons?: string[];
  notes?: string;
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

function getConfirmationEmailHtml(appointment: AppointmentDetails): string {
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Appointment Confirmed! ✨</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${SALON_NAME}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">Your appointment has been confirmed! We're excited to see you. Here are your booking details:</p>
              
              <!-- Appointment Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid #e9d5ff;">
                          <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Service</p>
                          <p style="margin: 4px 0 0; color: #333; font-size: 18px; font-weight: 600;">${appointment.service_name}</p>
                          ${addOnsHtml}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e9d5ff;">
                          <table width="100%">
                            <tr>
                              <td width="50%">
                                <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Date</p>
                                <p style="margin: 4px 0 0; color: #333; font-size: 16px;">${formatDate(appointment.appointment_date)}</p>
                              </td>
                              <td width="50%">
                                <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Time</p>
                                <p style="margin: 4px 0 0; color: #333; font-size: 16px;">${formatTime(appointment.appointment_time)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e9d5ff;">
                          <table width="100%">
                            <tr>
                              <td width="50%">
                                <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Stylist</p>
                                <p style="margin: 4px 0 0; color: #333; font-size: 16px;">${appointment.stylist_name}</p>
                              </td>
                              <td width="50%">
                                <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Duration</p>
                                <p style="margin: 4px 0 0; color: #333; font-size: 16px;">${formatDuration(appointment.service_duration)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase;">Total</p>
                          <p style="margin: 4px 0 0; color: #333; font-size: 24px; font-weight: 700;">$${appointment.total_amount.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Location -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #333; font-size: 16px; font-weight: 600;">📍 Location</p>
                    <p style="margin: 0; color: #666; font-size: 14px;">${SALON_ADDRESS}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(SALON_ADDRESS)}" style="color: #9333ea; font-size: 14px; text-decoration: none;">Get Directions →</a>
                  </td>
                </tr>
              </table>
              
              <!-- Important Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: #c2410c; font-size: 16px; font-weight: 600;">⚡ Important Reminders</p>
                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
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
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">View Appointment</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #666; font-size: 14px;">Need to make changes? <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}/reschedule" style="color: #9333ea; text-decoration: none;">Reschedule</a> or call us at <a href="tel:${SALON_PHONE.replace(/[^0-9]/g, '')}" style="color: #9333ea; text-decoration: none;">${SALON_PHONE}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #333; font-size: 16px; font-weight: 600;">${SALON_NAME}</p>
              <p style="margin: 0 0 5px; color: #666; font-size: 14px;">${SALON_ADDRESS}</p>
              <p style="margin: 0 0 15px; color: #666; font-size: 14px;">${SALON_PHONE}</p>
              <p style="margin: 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${SALON_NAME}. All rights reserved.</p>
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

function getReminderEmailHtml(appointment: AppointmentDetails, hoursUntil: number): string {
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'today';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Appointment Reminder ⏰</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your appointment is ${timeLabel}!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">This is a friendly reminder about your upcoming appointment at ${SALON_NAME}.</p>
              
              <!-- Appointment Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #333; font-size: 20px; font-weight: 600;">${appointment.service_name}</p>
                    <p style="margin: 0 0 4px; color: #666; font-size: 16px;">📅 ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}</p>
                    <p style="margin: 0; color: #666; font-size: 16px;">💇 with ${appointment.stylist_name}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Checklist -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: #333; font-size: 16px; font-weight: 600;">✅ Pre-Appointment Checklist</p>
                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 2;">
                      <li>Arrive 10-15 minutes early</li>
                      <li>Hair should be clean and product-free</li>
                      <li>Bring reference photos if you have a specific style in mind</li>
                      <li>Have your payment method ready</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Location -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #333; font-size: 16px; font-weight: 600;">📍 Location</p>
                    <p style="margin: 0; color: #666; font-size: 14px;">${SALON_ADDRESS}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(SALON_ADDRESS)}" style="color: #9333ea; font-size: 14px; text-decoration: none;">Get Directions →</a>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #666; font-size: 14px;">Can't make it? Please call us at <a href="tel:${SALON_PHONE.replace(/[^0-9]/g, '')}" style="color: #9333ea; text-decoration: none;">${SALON_PHONE}</a> to reschedule.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #666; font-size: 14px;">See you soon! 💜</p>
              <p style="margin: 10px 0 0; color: #999; font-size: 12px;">${SALON_NAME} | ${SALON_PHONE}</p>
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

function getCancellationEmailHtml(appointment: AppointmentDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #6b7280; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Appointment Cancelled</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 18px;">Hi ${appointment.client_name.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">Your appointment has been cancelled as requested. We're sorry we won't be seeing you this time!</p>
              
              <!-- Cancelled Appointment Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #666; font-size: 14px; text-decoration: line-through;">${appointment.service_name}</p>
                    <p style="margin: 0; color: #666; font-size: 14px; text-decoration: line-through;">${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Rebook CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="margin: 0 0 20px; color: #666; font-size: 16px;">We'd love to see you soon! Book a new appointment when you're ready.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/book" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">Book New Appointment</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999; font-size: 12px;">${SALON_NAME} | ${SALON_PHONE}</p>
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

function getConfirmationSms(appointment: AppointmentDetails): string {
  return `✅ ${SALON_NAME} Booking Confirmed!

📅 ${formatDate(appointment.appointment_date)}
⏰ ${formatTime(appointment.appointment_time)}
💇 ${appointment.service_name} with ${appointment.stylist_name}

📍 ${SALON_ADDRESS}

Need to reschedule? Call ${SALON_PHONE}`;
}

function getReminderSms(appointment: AppointmentDetails, hoursUntil: number): string {
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'today';
  return `⏰ Reminder: Your ${SALON_NAME} appointment is ${timeLabel}!

📅 ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}
💇 ${appointment.service_name}

Please arrive 10 min early. Can't make it? Call ${SALON_PHONE}`;
}

function getCancellationSms(appointment: AppointmentDetails): string {
  return `Your ${SALON_NAME} appointment on ${formatDate(appointment.appointment_date)} has been cancelled.

Book a new appointment anytime at ${process.env.NEXT_PUBLIC_APP_URL}/book or call ${SALON_PHONE}`;
}

// ============================================
// SEND FUNCTIONS
// ============================================

export async function sendConfirmationEmail(appointment: AppointmentDetails): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping confirmation email');
    return false;
  }

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: FROM_EMAIL,
        name: SALON_NAME,
      },
      subject: `✨ Appointment Confirmed - ${formatDate(appointment.appointment_date)}`,
      html: getConfirmationEmailHtml(appointment),
    });
    console.log(`[Email] Confirmation sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderEmail(appointment: AppointmentDetails, hoursUntil: number): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping reminder email');
    return false;
  }

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: FROM_EMAIL,
        name: SALON_NAME,
      },
      subject: `⏰ Reminder: Your appointment is ${hoursUntil === 24 ? 'tomorrow' : 'today'}!`,
      html: getReminderEmailHtml(appointment, hoursUntil),
    });
    console.log(`[Email] Reminder sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationEmail(appointment: AppointmentDetails): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] SendGrid not configured, skipping cancellation email');
    return false;
  }

  try {
    await sgMail.send({
      to: appointment.client_email,
      from: {
        email: FROM_EMAIL,
        name: SALON_NAME,
      },
      subject: `Appointment Cancelled - ${SALON_NAME}`,
      html: getCancellationEmailHtml(appointment),
    });
    console.log(`[Email] Cancellation sent to ${appointment.client_email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send cancellation:', error);
    return false;
  }
}

export async function sendConfirmationSms(appointment: AppointmentDetails): Promise<boolean> {
  if (!twilioClient || !FROM_PHONE || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping confirmation SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getConfirmationSms(appointment),
      from: FROM_PHONE,
      to: appointment.client_phone,
    });
    console.log(`[SMS] Confirmation sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send confirmation:', error);
    return false;
  }
}

export async function sendReminderSms(appointment: AppointmentDetails, hoursUntil: number): Promise<boolean> {
  if (!twilioClient || !FROM_PHONE || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping reminder SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getReminderSms(appointment, hoursUntil),
      from: FROM_PHONE,
      to: appointment.client_phone,
    });
    console.log(`[SMS] Reminder sent to ${appointment.client_phone}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send reminder:', error);
    return false;
  }
}

export async function sendCancellationSms(appointment: AppointmentDetails): Promise<boolean> {
  if (!twilioClient || !FROM_PHONE || !appointment.client_phone) {
    console.log('[SMS] Twilio not configured or no phone number, skipping cancellation SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: getCancellationSms(appointment),
      from: FROM_PHONE,
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

export async function sendBookingConfirmation(appointment: AppointmentDetails): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendConfirmationEmail(appointment),
    sendConfirmationSms(appointment),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendBookingReminder(
  appointment: AppointmentDetails,
  hoursUntil: number
): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendReminderEmail(appointment, hoursUntil),
    sendReminderSms(appointment, hoursUntil),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendBookingCancellation(appointment: AppointmentDetails): Promise<{
  email: boolean;
  sms: boolean;
}> {
  const [emailResult, smsResult] = await Promise.all([
    sendCancellationEmail(appointment),
    sendCancellationSms(appointment),
  ]);

  return { email: emailResult, sms: smsResult };
}

// ============================================
// STYLIST NOTIFICATIONS
// ============================================

export async function notifyStylistNewBooking(
  stylistEmail: string,
  stylistPhone: string | null,
  appointment: AppointmentDetails
): Promise<void> {
  // Email to stylist
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: stylistEmail,
        from: {
          email: FROM_EMAIL,
          name: SALON_NAME,
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
  if (twilioClient && FROM_PHONE && stylistPhone) {
    try {
      await twilioClient.messages.create({
        body: `📅 New booking: ${appointment.client_name} for ${appointment.service_name} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}`,
        from: FROM_PHONE,
        to: stylistPhone,
      });
    } catch (error) {
      console.error('[SMS] Failed to notify stylist:', error);
    }
  }
}

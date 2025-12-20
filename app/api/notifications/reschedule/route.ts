import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getRescheduleEmailHtml(
  clientName: string,
  serviceName: string,
  stylistName: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  appointmentId: string
): string {
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
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Appointment Rescheduled 📅</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${SALON_NAME}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 18px;">Hi ${clientName.split(' ')[0]},</p>
              <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">Your appointment has been successfully rescheduled. Here are your updated details:</p>
              
              <!-- Old vs New Time -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="48%" style="vertical-align: top;">
                    <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px;">
                      <p style="margin: 0 0 8px; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase;">Previous Time</p>
                      <p style="margin: 0; color: #666; font-size: 14px; text-decoration: line-through;">${oldDate}</p>
                      <p style="margin: 0; color: #666; font-size: 14px; text-decoration: line-through;">${oldTime}</p>
                    </div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align: top;">
                    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px;">
                      <p style="margin: 0 0 8px; color: #16a34a; font-size: 12px; font-weight: 600; text-transform: uppercase;">New Time</p>
                      <p style="margin: 0; color: #333; font-size: 14px; font-weight: 600;">${newDate}</p>
                      <p style="margin: 0; color: #333; font-size: 14px; font-weight: 600;">${newTime}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Appointment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; color: #333; font-size: 16px; font-weight: 600;">Appointment Details</p>
                    <p style="margin: 0 0 4px; color: #666; font-size: 14px;">💇 <strong>Service:</strong> ${serviceName}</p>
                    <p style="margin: 0; color: #666; font-size: 14px;">👤 <strong>Stylist:</strong> ${stylistName}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Location -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #333; font-size: 16px; font-weight: 600;">📍 Location</p>
                    <p style="margin: 0; color: #666; font-size: 14px;">${SALON_ADDRESS}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(SALON_ADDRESS)}" style="color: #2563eb; font-size: 14px; text-decoration: none;">Get Directions →</a>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointmentId}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">View Appointment</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #666; font-size: 14px;">Need to make more changes? <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointmentId}/reschedule" style="color: #9333ea; text-decoration: none;">Reschedule again</a> or call us at <a href="tel:${SALON_PHONE.replace(/[^0-9]/g, '')}" style="color: #9333ea; text-decoration: none;">${SALON_PHONE}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #666; font-size: 14px;">See you at your new time! 💜</p>
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

function getRescheduleSms(
  serviceName: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string
): string {
  return `📅 ${SALON_NAME} - Appointment Rescheduled!

Your ${serviceName} appointment has been moved:

❌ Was: ${oldDate} at ${oldTime}
✅ Now: ${newDate} at ${newTime}

📍 ${SALON_ADDRESS}

Questions? Call ${SALON_PHONE}`;
}

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, oldStartTime, newStartTime } = await request.json();

    if (!appointmentId || !oldStartTime || !newStartTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        client:profiles!appointments_client_id_fkey (
          first_name,
          last_name,
          email,
          phone
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          first_name,
          last_name,
          email
        ),
        service:services (
          name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Handle Supabase join which may return arrays
    const client = Array.isArray(appointment.client)
      ? appointment.client[0]
      : appointment.client;
    const stylist = Array.isArray(appointment.stylist)
      ? appointment.stylist[0]
      : appointment.stylist;
    const service = Array.isArray(appointment.service)
      ? appointment.service[0]
      : appointment.service;

    const clientName = `${client?.first_name} ${client?.last_name}`;
    const stylistName = `${stylist?.first_name} ${stylist?.last_name}`;
    const serviceName = service?.name || 'Service';

    const oldDate = formatDate(oldStartTime);
    const oldTime = formatTime(oldStartTime);
    const newDate = formatDate(newStartTime);
    const newTime = formatTime(newStartTime);

    let emailSent = false;
    let smsSent = false;

    // Send email
    if (process.env.SENDGRID_API_KEY && client?.email) {
      try {
        await sgMail.send({
          to: client.email,
          from: {
            email: FROM_EMAIL,
            name: SALON_NAME,
          },
          subject: `📅 Appointment Rescheduled - ${newDate}`,
          html: getRescheduleEmailHtml(
            clientName,
            serviceName,
            stylistName,
            oldDate,
            oldTime,
            newDate,
            newTime,
            appointmentId
          ),
        });
        emailSent = true;
        console.log(`[Email] Reschedule notification sent to ${client.email}`);
      } catch (err) {
        console.error('[Email] Failed to send reschedule notification:', err);
      }
    }

    // Send SMS
    if (twilioClient && FROM_PHONE && client?.phone) {
      try {
        await twilioClient.messages.create({
          body: getRescheduleSms(serviceName, oldDate, oldTime, newDate, newTime),
          from: FROM_PHONE,
          to: client.phone,
        });
        smsSent = true;
        console.log(`[SMS] Reschedule notification sent to ${client.phone}`);
      } catch (err) {
        console.error('[SMS] Failed to send reschedule notification:', err);
      }
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      appointment_id: appointmentId,
      notification_type: 'reschedule',
      email_sent: emailSent,
      sms_sent: smsSent,
      recipient_email: client?.email,
      recipient_phone: client?.phone,
    });

    // Also notify stylist
    if (process.env.SENDGRID_API_KEY && stylist?.email) {
      try {
        await sgMail.send({
          to: stylist.email,
          from: {
            email: FROM_EMAIL,
            name: SALON_NAME,
          },
          subject: `📅 Rescheduled: ${clientName} - ${newDate}`,
          html: `
            <h2>Appointment Rescheduled</h2>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Previous:</strong> ${oldDate} at ${oldTime}</p>
            <p><strong>New:</strong> ${newDate} at ${newTime}</p>
          `,
        });
      } catch (err) {
        console.error('[Email] Failed to notify stylist:', err);
      }
    }

    return NextResponse.json({
      success: true,
      email: emailSent,
      sms: smsSent,
    });
  } catch (error) {
    console.error('Reschedule notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

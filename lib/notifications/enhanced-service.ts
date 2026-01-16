// Enhanced Notification Service with full system integration
// Supports: Email, SMS, Push, In-App notifications with templates, queue, preferences
import sgMail from '@sendgrid/mail';
import webpush from 'web-push';
import twilio from 'twilio';
import { createClient } from '@/lib/supabase/client';
import type { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationTemplate,
  InAppNotification,
  NotificationLog,
  NotificationPreference,
  PushSubscription as PushSub,
  NotificationQueue,
  Profile,
  Appointment
} from '@/types/database';

// Initialize services
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Configure web push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'kelatic@gmail.com'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================
// NOTIFICATION SERVICE CLASS
// ============================================
export class NotificationService {
  private supabase = createClient();

  // ============================================
  // TEMPLATE RENDERING
  // ============================================
  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private async getTemplate(
    type: NotificationType, 
    channel: NotificationChannel,
    businessId?: string
  ): Promise<NotificationTemplate | null> {
    const { data } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('channel', channel)
      .eq('is_active', true)
      .or(`business_id.is.null,business_id.eq.${businessId || 'null'}`)
      .order('business_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    return data;
  }

  // ============================================
  // PREFERENCE CHECKING
  // ============================================
  private async checkUserPreferences(
    userId: string, 
    type: NotificationType, 
    channel: NotificationChannel
  ): Promise<boolean> {
    // Check global profile preferences first
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('notification_email, notification_sms, notification_push, notification_in_app')
      .eq('id', userId)
      .single();

    if (!profile) return false;

    // Check channel-specific profile setting
    const globalEnabled = {
      email: profile.notification_email,
      sms: profile.notification_sms,
      push: profile.notification_push,
      in_app: profile.notification_in_app
    }[channel];

    if (!globalEnabled) return false;

    // Check specific type preferences
    const { data: preference } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .single();

    if (!preference) return true; // Default enabled if no specific preference

    return {
      email: preference.email_enabled,
      sms: preference.sms_enabled,
      push: preference.push_enabled,
      in_app: preference.in_app_enabled
    }[channel] || false;
  }

  // ============================================
  // LOGGING
  // ============================================
  private async logNotification(log: Partial<NotificationLog>): Promise<void> {
    await this.supabase.from('notification_logs').insert([{
      ...log,
      created_at: new Date().toISOString()
    }]);
  }

  // ============================================
  // EMAIL NOTIFICATIONS
  // ============================================
  async sendEmail(
    userId: string,
    type: NotificationType,
    variables: Record<string, any>,
    options: {
      appointmentId?: string;
      businessId?: string;
      priority?: NotificationPriority;
      customTemplate?: { subject: string; content: string; };
    } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check preferences
      const canSend = await this.checkUserPreferences(userId, type, 'email');
      if (!canSend) {
        return { success: false, error: 'User disabled email notifications for this type' };
      }

      // Get user email
      const { data: user } = await this.supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', userId)
        .single();

      if (!user?.email) {
        return { success: false, error: 'User email not found' };
      }

      // Get template or use custom
      let subject: string;
      let content: string;
      let templateId: string | undefined;

      if (options.customTemplate) {
        subject = this.renderTemplate(options.customTemplate.subject, variables);
        content = this.renderTemplate(options.customTemplate.content, variables);
        templateId = 'custom';
      } else {
        const template = await this.getTemplate(type, 'email', options.businessId);
        if (!template) {
          return { success: false, error: 'Email template not found' };
        }
        templateId = template.id;
        subject = this.renderTemplate(template.subject_template, variables);
        content = this.renderTemplate(template.content_template, variables);
      }

      // Send email
      if (!process.env.SENDGRID_API_KEY) {
        console.log('[Email] SendGrid not configured, logging notification');
        await this.logNotification({
          user_id: userId,
          appointment_id: options.appointmentId,
          notification_type: type,
          channel: 'email',
          recipient_email: user.email,
          status: 'failed',
          error_message: 'SendGrid not configured',
          template_id: templateId
        });
        return { success: false, error: 'Email service not configured' };
      }

      const result = await sgMail.send({
        to: user.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'kelatic@gmail.com',
          name: variables.business_name || 'KeLatic'
        },
        subject,
        html: content,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      });

      // Log success
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'email',
        recipient_email: user.email,
        status: 'sent',
        template_id: templateId,
        sent_at: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id'] as string
      };

    } catch (error) {
      console.error('[Email] Send failed:', error);
      
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'email',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        template_id: 'email-template'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================
  // SMS NOTIFICATIONS
  // ============================================
  async sendSMS(
    userId: string,
    type: NotificationType,
    variables: Record<string, any>,
    options: {
      appointmentId?: string;
      businessId?: string;
      priority?: NotificationPriority;
      customTemplate?: string;
    } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check preferences
      const canSend = await this.checkUserPreferences(userId, type, 'sms');
      if (!canSend) {
        return { success: false, error: 'User disabled SMS notifications for this type' };
      }

      // Get user phone
      const { data: user } = await this.supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (!user?.phone) {
        return { success: false, error: 'User phone not found' };
      }

      // Get template or use custom
      let message: string;
      let templateId: string | undefined;

      if (options.customTemplate) {
        message = this.renderTemplate(options.customTemplate, variables);
        templateId = 'custom';
      } else {
        const template = await this.getTemplate(type, 'sms', options.businessId);
        if (!template) {
          return { success: false, error: 'SMS template not found' };
        }
        templateId = template.id;
        message = this.renderTemplate(template.content_template, variables);
      }

      // Send SMS
      if (!twilioClient) {
        console.log('[SMS] Twilio not configured, logging notification');
        await this.logNotification({
          user_id: userId,
          appointment_id: options.appointmentId,
          notification_type: type,
          channel: 'sms',
          recipient_phone: user.phone,
          status: 'failed',
          error_message: 'Twilio not configured',
          template_id: templateId
        });
        return { success: false, error: 'SMS service not configured' };
      }

      const result = await twilioClient.messages.create({
        to: user.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message
      });

      // Log success
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'sms',
        recipient_phone: user.phone,
        status: 'sent',
        template_id: templateId,
        sent_at: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.sid
      };

    } catch (error) {
      console.error('[SMS] Send failed:', error);
      
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'sms',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        template_id: 'sms-template'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================
  async sendPush(
    userId: string,
    type: NotificationType,
    variables: Record<string, any>,
    options: {
      appointmentId?: string;
      businessId?: string;
      priority?: NotificationPriority;
      actionUrl?: string;
      icon?: string;
      badge?: string;
    } = {}
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = { success: true, sent: 0, failed: 0, errors: [] as string[] };

    try {
      // Check preferences
      const canSend = await this.checkUserPreferences(userId, type, 'push');
      if (!canSend) {
        return { success: false, sent: 0, failed: 1, errors: ['User disabled push notifications'] };
      }

      // Get template
      const template = await this.getTemplate(type, 'push', options.businessId);
      if (!template) {
        return { success: false, sent: 0, failed: 1, errors: ['Push template not found'] };
      }

      // Get user's push subscriptions
      const { data: subscriptions } = await this.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        return { success: false, sent: 0, failed: 1, errors: ['No active push subscriptions'] };
      }

      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        return { success: false, sent: 0, failed: 1, errors: ['Push service not configured'] };
      }

      // Render notification
      const title = this.renderTemplate(template.subject_template, variables);
      const body = this.renderTemplate(template.content_template, variables);

      const payload = JSON.stringify({
        title,
        body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        data: {
          url: options.actionUrl || '/',
          appointmentId: options.appointmentId,
          type,
          timestamp: Date.now()
        },
        actions: options.actionUrl ? [{
          action: 'view',
          title: 'View Details',
          icon: '/icon-view.png'
        }] : undefined,
        requireInteraction: options.priority === 'high' || options.priority === 'urgent'
      });

      // Send to all subscriptions
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }, payload);

          results.sent++;
          
          // Update last used
          await this.supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);

        } catch (error) {
          results.failed++;
          results.errors.push(`Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // If subscription is invalid, deactivate it
          if (error instanceof Error && (error.message.includes('410') || error.message.includes('expired'))) {
            await this.supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }
        }
      }

      // Log notification
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'push',
        status: results.sent > 0 ? 'sent' : 'failed',
        error_message: results.errors.length > 0 ? results.errors.join('; ') : undefined,
        template_id: template.id,
        sent_at: results.sent > 0 ? new Date().toISOString() : undefined
      });

      return results;

    } catch (error) {
      console.error('[Push] Send failed:', error);
      return { 
        success: false, 
        sent: 0, 
        failed: 1, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // ============================================
  // IN-APP NOTIFICATIONS
  // ============================================
  async sendInApp(
    userId: string,
    type: NotificationType,
    variables: Record<string, any>,
    options: {
      appointmentId?: string;
      businessId?: string;
      priority?: NotificationPriority;
      actionUrl?: string;
      actionLabel?: string;
      expiresInHours?: number;
    } = {}
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Check preferences
      const canSend = await this.checkUserPreferences(userId, type, 'in_app');
      if (!canSend) {
        return { success: false, error: 'User disabled in-app notifications for this type' };
      }

      // Get template
      const template = await this.getTemplate(type, 'in_app', options.businessId);
      if (!template) {
        return { success: false, error: 'In-app template not found' };
      }

      // Render notification
      const title = this.renderTemplate(template.subject_template, variables);
      const message = this.renderTemplate(template.content_template, variables);

      const expiresAt = options.expiresInHours 
        ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()
        : undefined;

      // Create in-app notification
      const { data, error } = await this.supabase
        .from('in_app_notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          priority: options.priority || 'medium',
          action_url: options.actionUrl,
          action_label: options.actionLabel,
          metadata: {
            appointment_id: options.appointmentId,
            template_id: template.id,
            variables
          },
          expires_at: expiresAt
        }])
        .select()
        .single();

      if (error) {
        console.error('[In-App] Create failed:', error);
        return { success: false, error: error.message };
      }

      // Log notification
      await this.logNotification({
        user_id: userId,
        appointment_id: options.appointmentId,
        notification_type: type,
        channel: 'in_app',
        status: 'sent',
        template_id: template.id,
        sent_at: new Date().toISOString()
      });

      return { success: true, notificationId: data.id };

    } catch (error) {
      console.error('[In-App] Send failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================
  // MULTI-CHANNEL SEND
  // ============================================
  async sendMultiChannel(
    userId: string,
    type: NotificationType,
    variables: Record<string, any>,
    channels: NotificationChannel[],
    options: {
      appointmentId?: string;
      businessId?: string;
      priority?: NotificationPriority;
      actionUrl?: string;
      actionLabel?: string;
    } = {}
  ): Promise<Partial<Record<NotificationChannel, any>>> {
    const results: Partial<Record<NotificationChannel, any>> = {};

    // Send to each channel
    const promises = channels.map(async (channel) => {
      switch (channel) {
        case 'email':
          results[channel] = await this.sendEmail(userId, type, variables, options);
          break;
        case 'sms':
          results[channel] = await this.sendSMS(userId, type, variables, options);
          break;
        case 'push':
          results[channel] = await this.sendPush(userId, type, variables, options);
          break;
        case 'in_app':
          results[channel] = await this.sendInApp(userId, type, variables, {
            ...options,
            actionLabel: options.actionLabel
          });
          break;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
export const notificationService = new NotificationService();
export default notificationService;
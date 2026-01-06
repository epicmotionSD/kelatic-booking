# KeLatic Notification System

A comprehensive notification system supporting multiple channels: Email, SMS, Push, and In-App notifications.

## Features

### 🔔 Multi-Channel Support
- **Email**: Branded emails via SendGrid with rich templates
- **SMS**: Text message alerts via Twilio
- **Push**: Web push notifications with service worker
- **In-App**: Real-time dashboard notifications

### 🎯 Smart Targeting
- User preference management
- Global and per-type notification controls
- Channel fallbacks and priority handling
- Template-based content with dynamic data

### ⚡ Real-Time Updates
- Live notification feed in admin dashboard
- Auto-refresh with polling
- Mark as read functionality
- Priority indicators and categorization

### 📊 Analytics & Tracking
- Delivery status tracking
- Click-through metrics
- Failed delivery logging
- Performance analytics

## Setup Guide

### 1. Database Migration
```bash
# Apply the notification system schema
npx supabase db push
```

### 2. Environment Variables
Copy `.env.template` to `.env.local` and configure:

```bash
# Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# Add keys to .env.local
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@domain.com
```

### 3. Service Worker
The service worker is automatically registered at `/sw.js` for push notifications.

### 4. SendGrid Templates
Configure email templates in SendGrid:
- `booking_confirmation`
- `booking_cancellation` 
- `reminder_24hr`
- `reminder_2hr`
- `payment_received`
- `review_request`

## Usage

### Sending Notifications

```typescript
import { NotificationService } from '@/lib/notifications/enhanced-service';

const notificationService = new NotificationService();

// Send a booking confirmation
await notificationService.send({
  type: 'booking_confirmation',
  userId: 'user-id',
  appointmentId: 'appointment-id',
  data: {
    clientName: 'John Doe',
    serviceName: 'Haircut',
    appointmentDate: '2024-01-15',
    appointmentTime: '2:00 PM',
    stylistName: 'Sarah Johnson'
  }
});
```

### Multi-Channel Dispatch

```typescript
// Send to all enabled channels
await notificationService.sendMultiChannel({
  type: 'reminder_24hr',
  userId: 'user-id',
  appointmentId: 'appointment-id',
  channels: ['email', 'sms', 'push'],
  data: { /* template data */ }
});
```

### Managing User Preferences

```typescript
// Update user notification preferences
await fetch('/api/notifications/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    global: {
      email: true,
      sms: false,
      push: true,
      in_app: true
    },
    preferences: {
      booking_confirmation: {
        email: true,
        sms: true,
        push: true,
        in_app: true
      }
    }
  })
});
```

### Push Notifications

```typescript
import { usePushNotifications } from '@/lib/push-notifications/client';

const pushNotifications = usePushNotifications();

// Subscribe user to push notifications
await pushNotifications.subscribe();

// Send test notification
await pushNotifications.showLocalNotification({
  title: 'Test Notification',
  body: 'This is a test notification',
  data: { url: '/admin' }
});
```

## API Endpoints

### Notification Management
- `GET /api/notifications/in-app` - Get user notifications
- `POST /api/notifications/in-app` - Create notification
- `PUT /api/notifications/in-app/[id]/read` - Mark as read
- `PUT /api/notifications/in-app/mark-all-read` - Mark all as read

### Preferences
- `GET /api/notifications/preferences` - Get user preferences
- `POST /api/notifications/preferences` - Update preferences

### Push Notifications
- `GET /api/notifications/vapid-key` - Get VAPID public key
- `POST /api/notifications/push/subscribe` - Subscribe to push
- `DELETE /api/notifications/push/subscribe` - Unsubscribe
- `POST /api/notifications/track` - Track notification interactions

## Components

### Admin Dashboard
- `NotificationBell` - Real-time notification indicator
- `PushPreferences` - Push notification management

### Settings Page
- Global notification channel toggles
- Per-type preference controls
- Push notification setup and testing

## Database Schema

The system uses 6 main tables:

1. **notification_templates** - Email/SMS templates
2. **in_app_notifications** - Dashboard notifications  
3. **notification_logs** - Delivery tracking
4. **notification_preferences** - User preferences
5. **push_subscriptions** - Web push subscriptions
6. **notification_queue** - Async processing queue

## Monitoring

### Performance Metrics
- Delivery rates by channel
- Average response times
- Failed delivery analysis
- User engagement tracking

### Error Handling
- Automatic retry logic
- Fallback channel support
- Detailed error logging
- Alert escalation

## Security

### Data Protection
- User preferences are user-scoped with RLS
- Push subscriptions are encrypted
- Sensitive data is hashed in logs
- GDPR-compliant data retention

### Rate Limiting
- Per-user sending limits
- Anti-spam protection
- Queue throttling
- Resource protection

## Troubleshooting

### Push Notifications Not Working
1. Check VAPID keys are configured
2. Verify service worker registration
3. Ensure HTTPS (required for push)
4. Check browser permission status

### Email Delivery Issues  
1. Verify SendGrid API key
2. Check template IDs exist
3. Review bounce/spam reports
4. Validate sender authentication

### SMS Not Sending
1. Confirm Twilio credentials
2. Check phone number formatting
3. Verify account balance
4. Review delivery logs

## Development

### Testing
```bash
# Test email templates
npm run test:email

# Test push notifications
npm run test:push

# Test full notification flow
npm run test:notifications
```

### Local Development
Use the Cosmos DB emulator or local Supabase for development without cloud costs.

---

For more details, see the API documentation in `/docs/API.md`.
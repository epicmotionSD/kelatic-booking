// Push notification preferences component
// components/notifications/push-preferences.tsx

'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/push-notifications/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PushPreferencesProps {
  userId?: string;
  className?: string;
}

export function PushPreferences({ userId, className }: PushPreferencesProps) {
  const pushNotifications = usePushNotifications();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);

  // Check initial subscription status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setPermission(Notification.permission);
        const subscribed = await pushNotifications.isSubscribed();
        setIsSubscribed(subscribed);
      } catch (error) {
        console.error('Error checking push notification status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pushNotifications.isSupported) {
      checkStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleTogglePushNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed) {
        // Unsubscribe
        await pushNotifications.unsubscribe();
        setIsSubscribed(false);
        toast.success('Push notifications disabled');
      } else {
        // Subscribe
        if (permission === 'denied') {
          toast.error('Notifications are blocked. Please enable them in your browser settings.');
          return;
        }

        await pushNotifications.subscribe();
        setIsSubscribed(true);
        setPermission('granted');
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to update push notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationLoading(true);
    
    try {
      await pushNotifications.showLocalNotification({
        title: 'Test Notification 🎉',
        body: 'This is a test push notification from KeLatic',
        icon: '/icon-192x192.png',
        data: { type: 'test', url: '/admin' }
      });
      toast.success('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTestNotificationLoading(false);
    }
  };

  if (!pushNotifications.isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Please use a modern browser that supports push notifications
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription>
          Receive instant notifications on your device for appointments, confirmations, and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-2">
            {getPermissionIcon()}
            <div>
              <p className="text-sm font-medium">Browser Permission</p>
              <p className="text-xs text-muted-foreground">
                {permission === 'granted' && 'Notifications are allowed'}
                {permission === 'denied' && 'Notifications are blocked'}
                {permission === 'default' && 'Permission not requested'}
              </p>
            </div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              Get real-time alerts for important events
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleTogglePushNotifications}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {/* Test Notification Button */}
        {isSubscribed && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            disabled={testNotificationLoading}
            className="w-full"
          >
            {testNotificationLoading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        )}

        {/* Help Text */}
        {permission === 'denied' && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Notifications Blocked:</strong> To enable push notifications, 
              click the lock icon in your browser's address bar and allow notifications, 
              then refresh this page.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Active:</strong> You'll receive push notifications for appointment 
              confirmations, reminders, and important updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// Push notification utilities for the client-side
// lib/push-notifications/client.ts

export interface PushNotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

class PushNotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  // Initialize service worker
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.swRegistration);

      // Handle service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, refreshing...');
              window.location.reload();
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Check if push notifications are supported
  public isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permissions are denied');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<PushNotificationSubscription> {
    try {
      await this.requestPermission();

      if (!this.swRegistration) {
        throw new Error('Service worker not registered');
      }

      // Check if already subscribed
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Get VAPID public key from environment or server
        const response = await fetch('/api/notifications/vapid-key');
        const { publicKey } = await response.json();

        // Subscribe to push manager
        this.subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlB64ToUint8Array(publicKey),
        });
      }

      // Convert to our format
      const subscriptionData: PushNotificationSubscription = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
        },
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData);

      return subscriptionData;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        this.subscription = await this.swRegistration?.pushManager.getSubscription() || null;
      }

      if (this.subscription) {
        // Unsubscribe from push manager
        await this.subscription.unsubscribe();
        
        // Remove subscription from server
        await this.removeSubscriptionFromServer();
        
        this.subscription = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  // Check if currently subscribed
  public async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    this.subscription = await this.swRegistration.pushManager.getSubscription();
    return !!this.subscription;
  }

  // Get current subscription
  public async getSubscription(): Promise<PushNotificationSubscription | null> {
    if (!this.swRegistration) {
      return null;
    }

    this.subscription = await this.swRegistration.pushManager.getSubscription();
    
    if (!this.subscription) {
      return null;
    }

    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
      },
    };
  }

  // Show local notification (for testing)
  public async showLocalNotification(options: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    await this.swRegistration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      data: options.data,
      actions: options.actions,
      requireInteraction: options.requireInteraction,
      vibrate: [200, 100, 200],
      tag: options.data?.type || 'local',
      renotify: true,
      timestamp: Date.now(),
    });
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushNotificationSubscription): Promise<void> {
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription to server');
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from server');
    }
  }

  // Utility functions
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }
}

// Create and export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// React hook for using push notifications
export function usePushNotifications() {
  return {
    isSupported: pushNotificationManager.isSupported(),
    requestPermission: () => pushNotificationManager.requestPermission(),
    subscribe: () => pushNotificationManager.subscribe(),
    unsubscribe: () => pushNotificationManager.unsubscribe(),
    isSubscribed: () => pushNotificationManager.isSubscribed(),
    getSubscription: () => pushNotificationManager.getSubscription(),
    showLocalNotification: (options: NotificationOptions) => 
      pushNotificationManager.showLocalNotification(options),
  };
}
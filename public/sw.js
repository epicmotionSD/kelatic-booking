// Service Worker for Push Notifications
// This file should be placed in the public directory as sw.js

const CACHE_NAME = 'kelatic-notifications-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    data = {
      title: 'New Notification',
      body: 'You have a new notification from KeLatic'
    };
  }

  const {
    title = 'KeLatic Notification',
    body = 'You have a new notification',
    icon = '/icon-192x192.png',
    badge = '/badge-72x72.png',
    data: notificationData = {},
    actions = [],
    requireInteraction = false
  } = data;

  const options = {
    body,
    icon,
    badge,
    data: notificationData,
    actions,
    requireInteraction,
    vibrate: [200, 100, 200],
    tag: notificationData.type || 'general',
    renotify: true,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  const { notification } = event;
  const { data } = notification;
  
  // Close the notification
  notification.close();

  // Determine the URL to open
  let urlToOpen = '/';
  
  if (event.action) {
    // Handle action buttons
    switch (event.action) {
      case 'view':
        urlToOpen = data.url || '/admin';
        break;
      case 'dismiss':
        return; // Just close, don't open anything
    }
  } else if (data.url) {
    // Handle notification click
    urlToOpen = data.url;
  } else if (data.appointmentId) {
    urlToOpen = `/admin/appointments/${data.appointmentId}`;
  }

  // Open or focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with the target URL
      for (const client of clientList) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // No existing window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );

  // Track the click event
  if (data.type && data.appointmentId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: data.type,
        appointmentId: data.appointmentId,
        action: 'clicked'
      })
    }).catch((error) => {
      console.error('[SW] Error tracking notification click:', error);
    });
  }
});

// Notification close event - handle when user dismisses notification
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const { notification } = event;
  const { data } = notification;
  
  // Track the dismiss event (optional)
  if (data.type && data.appointmentId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: data.type,
        appointmentId: data.appointmentId,
        action: 'dismissed'
      })
    }).catch((error) => {
      console.error('[SW] Error tracking notification dismiss:', error);
    });
  }
});

// Background sync for failed notifications (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-notifications') {
    event.waitUntil(
      // Retry failed notification operations
      retryFailedNotifications()
    );
  }
});

async function retryFailedNotifications() {
  try {
    // This could check IndexedDB for failed notification sends
    // and retry them when connectivity is restored
    console.log('[SW] Retrying failed notifications...');
  } catch (error) {
    console.error('[SW] Error retrying notifications:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
    case 'CACHE_BUST':
      // Clear caches if needed
      caches.delete(CACHE_NAME);
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded and ready!');
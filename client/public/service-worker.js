/**
 * Service Worker for Push Notifications
 * Handles push events and notification interactions
 */

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    const notificationOptions = {
      body: body || 'Order update',
      icon: icon || '/logo.png',
      badge: badge || '/badge.png',
      tag: tag || 'order-update',
      requireInteraction: true,
      data: notificationData || {},
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Order Update', notificationOptions)
    );
  } catch (error) {
    console.error('Failed to handle push event:', error);
    // Fallback for non-JSON push data
    event.waitUntil(
      self.registration.showNotification('Order Update', {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/badge.png',
      })
    );
  }
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const { action, data } = event;
  const { orderId, url } = data || {};

  if (action === 'close') {
    return;
  }

  // Open the order tracking page or specified URL
  const targetUrl = url || `/track-order/${orderId || ''}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

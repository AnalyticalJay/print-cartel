/**
 * Push Notification Service
 * Handles browser push notifications for order status updates
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
}

/**
 * Check if browser supports push notifications
 */
export const isPushNotificationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
};

/**
 * Get the service worker registration
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error('Service worker not registered');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
};

/**
 * Get current push subscription
 */
export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return null;
    }

    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
};

/**
 * Send a local notification (for testing/fallback)
 */
export const sendLocalNotification = async (
  options: PushNotificationOptions
): Promise<void> => {
  if (!isPushNotificationSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (registration) {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: options.badge || '/badge.png',
        tag: options.tag || 'order-update',
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      };
      await registration.showNotification(options.title, notificationOptions);
    }
  } catch (error) {
    console.error('Failed to send local notification:', error);
  }
};

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Send order status update notification
 */
export const sendOrderStatusNotification = async (
  orderId: number,
  status: string
): Promise<void> => {
  const statusMessages: Record<string, { title: string; body: string }> = {
    pending: {
      title: 'Order Received',
      body: `Your order #${orderId} has been received and is being reviewed.`,
    },
    quoted: {
      title: 'Quote Ready',
      body: `We've prepared a quote for your order #${orderId}. Please review it.`,
    },
    approved: {
      title: 'Order Approved',
      body: `Your order #${orderId} has been approved and is queued for production.`,
    },
    'in-production': {
      title: 'In Production',
      body: `Your custom design for order #${orderId} is being printed now!`,
    },
    completed: {
      title: 'Ready to Ship',
      body: `Your order #${orderId} is complete and ready for shipment.`,
    },
    shipped: {
      title: 'Order Shipped',
      body: `Your order #${orderId} has been shipped and is on its way to you!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      body: `Your order #${orderId} has been cancelled.`,
    },
  };

  const message = statusMessages[status] || {
    title: 'Order Update',
    body: `Your order #${orderId} status has been updated to ${status}.`,
  };

  await sendLocalNotification({
    title: message.title,
    body: message.body,
    icon: '/logo.png',
    badge: '/badge.png',
    tag: `order-${orderId}`,
    requireInteraction: true,
    data: {
      orderId,
      status,
      url: `/track-order/${orderId}`,
    },
  });
};

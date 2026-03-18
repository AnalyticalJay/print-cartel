/**
 * Notification Preferences Management
 * Handles user preferences for which order status updates trigger notifications
 */

export type OrderStatus = 'pending' | 'quoted' | 'approved' | 'in-production' | 'completed' | 'shipped' | 'cancelled';

export interface NotificationPreferences {
  enabled: boolean;
  statuses: Record<OrderStatus, boolean>;
  soundEnabled: boolean;
  emailEnabled: boolean;
  lastUpdated: number;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  statuses: {
    pending: true,
    quoted: true,
    approved: true,
    'in-production': true,
    completed: true,
    shipped: true,
    cancelled: false,
  },
  soundEnabled: true,
  emailEnabled: false,
  lastUpdated: Date.now(),
};

const STORAGE_KEY = 'notification-preferences';

/**
 * Get user's notification preferences from localStorage
 */
export const getNotificationPreferences = (): NotificationPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        statuses: {
          ...DEFAULT_PREFERENCES.statuses,
          ...parsed.statuses,
        },
      };
    }
  } catch (error) {
    console.error('Failed to parse notification preferences:', error);
  }

  return DEFAULT_PREFERENCES;
};

/**
 * Save user's notification preferences to localStorage
 */
export const saveNotificationPreferences = (preferences: NotificationPreferences): void => {
  try {
    const toSave = {
      ...preferences,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
  }
};

/**
 * Check if notifications are enabled for a specific status
 */
export const isNotificationEnabledForStatus = (
  status: OrderStatus,
  preferences?: NotificationPreferences
): boolean => {
  const prefs = preferences || getNotificationPreferences();
  return prefs.enabled && prefs.statuses[status];
};

/**
 * Update a single status preference
 */
export const updateStatusPreference = (status: OrderStatus, enabled: boolean): NotificationPreferences => {
  const preferences = getNotificationPreferences();
  preferences.statuses[status] = enabled;
  saveNotificationPreferences(preferences);
  return preferences;
};

/**
 * Enable all notifications
 */
export const enableAllNotifications = (): NotificationPreferences => {
  const preferences = getNotificationPreferences();
  preferences.enabled = true;
  Object.keys(preferences.statuses).forEach((status) => {
    preferences.statuses[status as OrderStatus] = true;
  });
  saveNotificationPreferences(preferences);
  return preferences;
};

/**
 * Disable all notifications
 */
export const disableAllNotifications = (): NotificationPreferences => {
  const preferences = getNotificationPreferences();
  preferences.enabled = false;
  saveNotificationPreferences(preferences);
  return preferences;
};

/**
 * Reset to default preferences
 */
export const resetToDefaultPreferences = (): NotificationPreferences => {
  saveNotificationPreferences(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
};

/**
 * Get status display name
 */
export const getStatusDisplayName = (status: OrderStatus): string => {
  const names: Record<OrderStatus, string> = {
    pending: 'Order Received',
    quoted: 'Quote Ready',
    approved: 'Order Approved',
    'in-production': 'In Production',
    completed: 'Ready to Ship',
    shipped: 'Order Shipped',
    cancelled: 'Order Cancelled',
  };
  return names[status];
};

/**
 * Get status description
 */
export const getStatusDescription = (status: OrderStatus): string => {
  const descriptions: Record<OrderStatus, string> = {
    pending: 'Your order has been received and is being reviewed',
    quoted: "We've prepared a quote for your order",
    approved: 'Your order has been approved and queued for production',
    'in-production': 'Your custom design is being printed',
    completed: 'Your order is complete and ready for shipment',
    shipped: 'Your order is on its way to you',
    cancelled: 'Your order has been cancelled',
  };
  return descriptions[status];
};

/**
 * Get all order statuses
 */
export const getAllOrderStatuses = (): OrderStatus[] => {
  return ['pending', 'quoted', 'approved', 'in-production', 'completed', 'shipped', 'cancelled'];
};

/**
 * Export preferences as JSON for backup
 */
export const exportPreferences = (): string => {
  const preferences = getNotificationPreferences();
  return JSON.stringify(preferences, null, 2);
};

/**
 * Import preferences from JSON
 */
export const importPreferences = (json: string): NotificationPreferences | null => {
  try {
    const parsed = JSON.parse(json);
    if (parsed.statuses && typeof parsed.enabled === 'boolean') {
      saveNotificationPreferences(parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to import preferences:', error);
  }
  return null;
};

import { useState, useEffect } from "react";

export interface NotificationPreferences {
  enableOrderNotifications: boolean;
  enableDesignNotifications: boolean;
  enableChatNotifications: boolean;
  enableSoundNotifications: boolean;
  enableBrowserNotifications: boolean;
  notificationFrequency: "immediate" | "batched" | "daily";
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableOrderNotifications: true,
  enableDesignNotifications: true,
  enableChatNotifications: true,
  enableSoundNotifications: true,
  enableBrowserNotifications: false, // Requires user permission
  notificationFrequency: "immediate",
};

const STORAGE_KEY = "print-cartel-notification-preferences";

/**
 * Hook for managing user notification preferences
 * Persists preferences to localStorage
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to reset notification preferences:", error);
    }
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
}

/**
 * Check if a specific notification type should be shown
 */
export function shouldShowNotification(
  type: "order" | "design" | "chat",
  preferences: NotificationPreferences
): boolean {
  switch (type) {
    case "order":
      return preferences.enableOrderNotifications;
    case "design":
      return preferences.enableDesignNotifications;
    case "chat":
      return preferences.enableChatNotifications;
    default:
      return false;
  }
}

/**
 * Request browser notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }

  return false;
}

/**
 * Send a browser notification
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  try {
    return new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (error) {
    console.error("Failed to send browser notification:", error);
    return null;
  }
}

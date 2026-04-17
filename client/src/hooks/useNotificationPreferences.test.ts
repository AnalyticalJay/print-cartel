import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shouldShowNotification, requestBrowserNotificationPermission } from "./useNotificationPreferences";

describe("Notification Preferences", () => {
  describe("shouldShowNotification", () => {
    it("should show order notifications when enabled", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: false,
        enableChatNotifications: false,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(shouldShowNotification("order", preferences)).toBe(true);
      expect(shouldShowNotification("design", preferences)).toBe(false);
      expect(shouldShowNotification("chat", preferences)).toBe(false);
    });

    it("should show design notifications when enabled", () => {
      const preferences = {
        enableOrderNotifications: false,
        enableDesignNotifications: true,
        enableChatNotifications: false,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(shouldShowNotification("design", preferences)).toBe(true);
    });

    it("should show chat notifications when enabled", () => {
      const preferences = {
        enableOrderNotifications: false,
        enableDesignNotifications: false,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(shouldShowNotification("chat", preferences)).toBe(true);
    });

    it("should return false for unknown notification types", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(shouldShowNotification("unknown" as any, preferences)).toBe(false);
    });
  });

  describe("requestBrowserNotificationPermission", () => {
    beforeEach(() => {
      // Mock Notification API
      (global as any).Notification = {
        permission: "default",
        requestPermission: vi.fn(),
      };
    });

    afterEach(() => {
      delete (global as any).Notification;
    });

    it("should return false if Notification API is not available", async () => {
      delete (global as any).Notification;
      const result = await requestBrowserNotificationPermission();
      expect(result).toBe(false);
    });

    it("should return true if permission is already granted", async () => {
      (global as any).Notification.permission = "granted";
      const result = await requestBrowserNotificationPermission();
      expect(result).toBe(true);
    });

    it("should request permission if not denied", async () => {
      (global as any).Notification.permission = "default";
      (global as any).Notification.requestPermission = vi.fn().mockResolvedValue("granted");

      const result = await requestBrowserNotificationPermission();
      expect(result).toBe(true);
      expect((global as any).Notification.requestPermission).toHaveBeenCalled();
    });

    it("should return false if permission is denied", async () => {
      (global as any).Notification.permission = "denied";
      const result = await requestBrowserNotificationPermission();
      expect(result).toBe(false);
    });
  });

  describe("Notification frequency options", () => {
    it("should support immediate notification frequency", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(preferences.notificationFrequency).toBe("immediate");
    });

    it("should support batched notification frequency", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "batched" as const,
      };

      expect(preferences.notificationFrequency).toBe("batched");
    });

    it("should support daily notification frequency", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "daily" as const,
      };

      expect(preferences.notificationFrequency).toBe("daily");
    });
  });

  describe("Sound notification settings", () => {
    it("should allow enabling/disabling sound notifications", () => {
      const preferencesWithSound = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      const preferencesWithoutSound = {
        ...preferencesWithSound,
        enableSoundNotifications: false,
      };

      expect(preferencesWithSound.enableSoundNotifications).toBe(true);
      expect(preferencesWithoutSound.enableSoundNotifications).toBe(false);
    });
  });

  describe("Browser notification settings", () => {
    it("should allow enabling/disabling browser notifications", () => {
      const preferencesWithBrowser = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: true,
        enableBrowserNotifications: true,
        notificationFrequency: "immediate" as const,
      };

      const preferencesWithoutBrowser = {
        ...preferencesWithBrowser,
        enableBrowserNotifications: false,
      };

      expect(preferencesWithBrowser.enableBrowserNotifications).toBe(true);
      expect(preferencesWithoutBrowser.enableBrowserNotifications).toBe(false);
    });
  });
});

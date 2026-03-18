import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateStatusPreference,
  enableAllNotifications,
  disableAllNotifications,
  resetToDefaultPreferences,
  isNotificationEnabledForStatus,
  getStatusDisplayName,
  getStatusDescription,
  getAllOrderStatuses,
  exportPreferences,
  importPreferences,
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type OrderStatus,
} from './notificationPreferences';

describe('Notification Preferences', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Default Preferences', () => {
    it('should have correct default preferences', () => {
      expect(DEFAULT_PREFERENCES.enabled).toBe(true);
      expect(DEFAULT_PREFERENCES.soundEnabled).toBe(true);
      expect(DEFAULT_PREFERENCES.emailEnabled).toBe(false);
    });

    it('should enable most statuses by default', () => {
      const enabledCount = Object.values(DEFAULT_PREFERENCES.statuses).filter(Boolean).length;
      expect(enabledCount).toBeGreaterThan(5);
    });

    it('should disable cancelled status by default', () => {
      expect(DEFAULT_PREFERENCES.statuses.cancelled).toBe(false);
    });
  });

  describe('Get Preferences', () => {
    it('should return default preferences when none saved', () => {
      const prefs = getNotificationPreferences();
      expect(prefs.enabled).toBe(DEFAULT_PREFERENCES.enabled);
      expect(prefs.soundEnabled).toBe(DEFAULT_PREFERENCES.soundEnabled);
    });

    it('should return saved preferences', () => {
      const custom: NotificationPreferences = {
        enabled: false,
        statuses: { ...DEFAULT_PREFERENCES.statuses, pending: false },
        soundEnabled: false,
        emailEnabled: true,
        lastUpdated: Date.now(),
      };
      saveNotificationPreferences(custom);

      const retrieved = getNotificationPreferences();
      expect(retrieved.enabled).toBe(false);
      expect(retrieved.soundEnabled).toBe(false);
      expect(retrieved.emailEnabled).toBe(true);
      expect(retrieved.statuses.pending).toBe(false);
    });

    it('should merge saved preferences with defaults', () => {
      const partial = {
        enabled: false,
        statuses: { pending: false } as any,
        soundEnabled: true,
        emailEnabled: false,
        lastUpdated: Date.now(),
      };
      localStorage.setItem('notification-preferences', JSON.stringify(partial));

      const retrieved = getNotificationPreferences();
      expect(retrieved.enabled).toBe(false);
      expect(retrieved.statuses.pending).toBe(false);
      expect(retrieved.statuses.shipped).toBe(DEFAULT_PREFERENCES.statuses.shipped);
    });
  });

  describe('Save Preferences', () => {
    it('should save preferences to localStorage', () => {
      const prefs: NotificationPreferences = {
        enabled: false,
        statuses: { ...DEFAULT_PREFERENCES.statuses },
        soundEnabled: false,
        emailEnabled: true,
        lastUpdated: Date.now(),
      };

      saveNotificationPreferences(prefs);

      const stored = localStorage.getItem('notification-preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.enabled).toBe(false);
      expect(parsed.emailEnabled).toBe(true);
    });

    it('should update lastUpdated timestamp', () => {
      const before = Date.now();
      const prefs = getNotificationPreferences();
      saveNotificationPreferences(prefs);
      const after = Date.now();

      const stored = JSON.parse(localStorage.getItem('notification-preferences')!);
      expect(stored.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(stored.lastUpdated).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('Status Preferences', () => {
    it('should toggle status preference', () => {
      const updated = updateStatusPreference('pending', false);
      expect(updated.statuses.pending).toBe(false);

      const updated2 = updateStatusPreference('pending', true);
      expect(updated2.statuses.pending).toBe(true);
    });

    it('should persist toggled preferences', () => {
      updateStatusPreference('quoted', false);
      const retrieved = getNotificationPreferences();
      expect(retrieved.statuses.quoted).toBe(false);
    });

    it('should check if notification is enabled for status', () => {
      const prefs = getNotificationPreferences();
      expect(isNotificationEnabledForStatus('pending', prefs)).toBe(true);

      const disabled = updateStatusPreference('pending', false);
      expect(isNotificationEnabledForStatus('pending', disabled)).toBe(false);
    });

    it('should respect global enable flag', () => {
      const prefs = getNotificationPreferences();
      prefs.enabled = false;
      expect(isNotificationEnabledForStatus('pending', prefs)).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('should enable all notifications', () => {
      const updated = enableAllNotifications();
      expect(updated.enabled).toBe(true);
      Object.values(updated.statuses).forEach((enabled) => {
        expect(enabled).toBe(true);
      });
    });

    it('should disable all notifications', () => {
      const updated = disableAllNotifications();
      expect(updated.enabled).toBe(false);
    });

    it('should reset to default preferences', () => {
      updateStatusPreference('pending', false);
      const reset = resetToDefaultPreferences();
      expect(reset.statuses.pending).toBe(DEFAULT_PREFERENCES.statuses.pending);
    });
  });

  describe('Status Display', () => {
    it('should return display names for all statuses', () => {
      const statuses = getAllOrderStatuses();
      statuses.forEach((status) => {
        const name = getStatusDisplayName(status);
        expect(name.length).toBeGreaterThan(0);
        expect(typeof name).toBe('string');
      });
    });

    it('should return descriptions for all statuses', () => {
      const statuses = getAllOrderStatuses();
      statuses.forEach((status) => {
        const desc = getStatusDescription(status);
        expect(desc.length).toBeGreaterThan(0);
        expect(typeof desc).toBe('string');
      });
    });

    it('should have correct display names', () => {
      expect(getStatusDisplayName('pending')).toBe('Order Received');
      expect(getStatusDisplayName('shipped')).toBe('Order Shipped');
      expect(getStatusDisplayName('in-production')).toBe('In Production');
    });
  });

  describe('All Order Statuses', () => {
    it('should return all 7 order statuses', () => {
      const statuses = getAllOrderStatuses();
      expect(statuses.length).toBe(7);
    });

    it('should include all expected statuses', () => {
      const statuses = getAllOrderStatuses();
      expect(statuses).toContain('pending');
      expect(statuses).toContain('quoted');
      expect(statuses).toContain('approved');
      expect(statuses).toContain('in-production');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('shipped');
      expect(statuses).toContain('cancelled');
    });
  });

  describe('Export/Import', () => {
    it('should export preferences as JSON', () => {
      const json = exportPreferences();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.enabled).toBeDefined();
      expect(parsed.statuses).toBeDefined();
    });

    it('should import preferences from JSON', () => {
      const original = getNotificationPreferences();
      original.soundEnabled = false;
      original.emailEnabled = true;
      const json = JSON.stringify(original);

      const imported = importPreferences(json);
      expect(imported).toBeTruthy();
      expect(imported?.soundEnabled).toBe(false);
      expect(imported?.emailEnabled).toBe(true);
    });

    it('should return null for invalid JSON', () => {
      const result = importPreferences('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for invalid preference structure', () => {
      const result = importPreferences(JSON.stringify({ invalid: 'structure' }));
      expect(result).toBeNull();
    });

    it('should round-trip preferences through export/import', () => {
      const original = getNotificationPreferences();
      original.soundEnabled = false;
      original.statuses.pending = false;
      original.statuses.shipped = true;

      const exported = exportPreferences();
      localStorage.clear();

      const imported = importPreferences(exported);
      expect(imported?.soundEnabled).toBe(false);
      expect(imported?.statuses.pending).toBe(false);
      expect(imported?.statuses.shipped).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('notification-preferences', 'corrupted data');
      const prefs = getNotificationPreferences();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('should handle missing statuses in saved preferences', () => {
      const partial = {
        enabled: true,
        soundEnabled: true,
        emailEnabled: false,
        lastUpdated: Date.now(),
      };
      localStorage.setItem('notification-preferences', JSON.stringify(partial));

      const prefs = getNotificationPreferences();
      expect(prefs.statuses.pending).toBeDefined();
      expect(prefs.statuses.shipped).toBeDefined();
    });

    it('should handle rapid preference changes', () => {
      for (let i = 0; i < 10; i++) {
        updateStatusPreference('pending', i % 2 === 0);
      }

      const final = getNotificationPreferences();
      expect(final.statuses.pending).toBe(false);
    });
  });

  describe('Preference Persistence', () => {
    it('should persist preferences across function calls', () => {
      updateStatusPreference('pending', false);
      updateStatusPreference('quoted', false);

      const prefs1 = getNotificationPreferences();
      const prefs2 = getNotificationPreferences();

      expect(prefs1.statuses.pending).toBe(prefs2.statuses.pending);
      expect(prefs1.statuses.quoted).toBe(prefs2.statuses.quoted);
    });

    it('should maintain consistency after bulk operations', () => {
      enableAllNotifications();
      let prefs = getNotificationPreferences();
      expect(Object.values(prefs.statuses).every(Boolean)).toBe(true);

      disableAllNotifications();
      prefs = getNotificationPreferences();
      expect(prefs.enabled).toBe(false);
    });
  });
});

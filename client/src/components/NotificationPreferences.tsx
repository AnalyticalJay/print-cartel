import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, RotateCcw, Check } from 'lucide-react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateStatusPreference,
  enableAllNotifications,
  disableAllNotifications,
  resetToDefaultPreferences,
  getAllOrderStatuses,
  getStatusDisplayName,
  getStatusDescription,
  type NotificationPreferences as NotificationPrefs,
  type OrderStatus,
} from '@/lib/notificationPreferences';
import { toast } from 'sonner';

interface NotificationPreferencesComponentProps {
  onPreferencesChange?: (preferences: NotificationPrefs) => void;
}

export const NotificationPreferencesPanel = ({ onPreferencesChange }: NotificationPreferencesComponentProps) => {
  const [preferences, setPreferences] = useState<NotificationPrefs>(getNotificationPreferences());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load preferences on mount
    const loaded = getNotificationPreferences();
    setPreferences(loaded);
  }, []);

  const handleStatusToggle = (status: OrderStatus) => {
    const updated = { ...preferences };
    updated.statuses[status] = !updated.statuses[status];
    setPreferences(updated);
    setHasChanges(true);
  };

  const handleEnableAll = () => {
    const updated = enableAllNotifications();
    setPreferences(updated);
    setHasChanges(false);
      onPreferencesChange?.(updated);
    toast.success('All notifications enabled');
  };

  const handleDisableAll = () => {
    const updated = disableAllNotifications();
    setPreferences(updated);
    setHasChanges(false);
    onPreferencesChange?.(updated);
    toast.success('All notifications disabled');
  };

  const handleReset = () => {
    const updated = resetToDefaultPreferences();
    setPreferences(updated);
    setHasChanges(false);
    onPreferencesChange?.(updated);
    toast.success('Preferences reset to defaults');
  };

  const handleSave = () => {
    saveNotificationPreferences(preferences);
    setHasChanges(false);
    onPreferencesChange?.(preferences);
    toast.success('Notification preferences saved');
  };

  const enabledCount = Object.values(preferences.statuses).filter(Boolean).length;
  const totalCount = getAllOrderStatuses().length;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400">
                Choose which order status updates trigger notifications
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-gray-300 border-gray-600">
            {enabledCount}/{totalCount} enabled
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleEnableAll}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            Enable All
          </Button>
          <Button
            onClick={handleDisableAll}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            Disable All
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
        </div>

        {/* Status Toggles */}
        <div className="space-y-3">
          <Label className="text-gray-300 font-semibold">Order Status Updates</Label>
          <div className="grid gap-3">
            {getAllOrderStatuses().map((status) => (
              <div
                key={status}
                className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition"
              >
                <input
                  type="checkbox"
                  id={`status-${status}`}
                  checked={preferences.statuses[status]}
                  onChange={() => handleStatusToggle(status)}
                  className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`status-${status}`}
                    className="text-gray-200 font-medium cursor-pointer block"
                  >
                    {getStatusDisplayName(status)}
                  </label>
                  <p className="text-gray-400 text-sm mt-1">{getStatusDescription(status)}</p>
                </div>
                {preferences.statuses[status] && (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3 pt-4 border-t border-gray-600">
          <Label className="text-gray-300 font-semibold">Notification Options</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="sound-enabled"
                checked={preferences.soundEnabled}
                onChange={(e) => {
                  const updated = { ...preferences, soundEnabled: e.target.checked };
                  setPreferences(updated);
                  setHasChanges(true);
                }}
                className="w-5 h-5 cursor-pointer accent-blue-500"
              />
              <label htmlFor="sound-enabled" className="text-gray-200 cursor-pointer flex-1">
                Play sound with notifications
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="email-enabled"
                checked={preferences.emailEnabled}
                onChange={(e) => {
                  const updated = { ...preferences, emailEnabled: e.target.checked };
                  setPreferences(updated);
                  setHasChanges(true);
                }}
                className="w-5 h-5 cursor-pointer accent-blue-500"
              />
              <label htmlFor="email-enabled" className="text-gray-200 cursor-pointer flex-1">
                Also send email notifications
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex gap-2 pt-4 border-t border-gray-600">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Preferences
            </Button>
            <Button
              onClick={() => {
                setPreferences(getNotificationPreferences());
                setHasChanges(false);
              }}
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        )}

        {!hasChanges && (
          <div className="flex items-center gap-2 p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-200 text-sm">Preferences saved</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bell, Download, Upload } from 'lucide-react';
import { useLocation } from 'wouter';
import { NotificationPreferencesPanel } from '@/components/NotificationPreferences';
import { exportPreferences, importPreferences, type NotificationPreferences } from '@/lib/notificationPreferences';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPreferences = () => {
    try {
      setIsExporting(true);
      const json = exportPreferences();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notification-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Preferences exported');
    } catch (error) {
      console.error('Failed to export preferences:', error);
      toast.error('Failed to export preferences');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPreferences = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const result = importPreferences(json);
          if (result) {
            toast.success('Preferences imported successfully');
            // Reload to show updated preferences
            window.location.reload();
          } else {
            toast.error('Invalid preferences file');
          }
        } catch (error) {
          console.error('Failed to import preferences:', error);
          toast.error('Failed to import preferences');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation('/track-order')}
            variant="ghost"
            className="text-gray-200 hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order Tracking
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Notification Settings</h1>
          </div>
          <p className="text-gray-200">
            Customize how you receive order status updates and notifications
          </p>
        </div>

        {/* Main Preferences Panel */}
        <NotificationPreferencesPanel />

        {/* Export/Import Section */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Backup & Restore</CardTitle>
            <CardDescription className="text-gray-200">
              Export your preferences to backup or import them on another device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleExportPreferences}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                onClick={handleImportPreferences}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
            <p className="text-gray-200 text-sm">
              Your preferences are automatically saved to your browser. Use export/import to sync across devices.
            </p>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">How Notifications Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Push Notifications</h4>
              <p className="text-sm">
                Real-time alerts delivered to your browser when order statuses change. Requires permission to be granted.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Sound Alerts</h4>
              <p className="text-sm">
                Optional audio notification that plays when a push notification is received.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Email Notifications</h4>
              <p className="text-sm">
                Email confirmations sent to your registered email address (coming soon).
              </p>
            </div>
            <div className="pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-200">
                💡 Tip: Enable notifications for critical statuses like "In Production" and "Order Shipped" to stay
                updated on your orders.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

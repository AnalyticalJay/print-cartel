import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from '@/lib/pushNotifications';
import { toast } from 'sonner';

interface PushNotificationPromptProps {
  vapidPublicKey: string;
  onSubscribed?: (subscription: PushSubscription) => void;
}

export const PushNotificationPrompt = ({
  vapidPublicKey,
  onSubscribed,
}: PushNotificationPromptProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(isPushNotificationSupported());

    // Check if already dismissed
    const dismissed = localStorage.getItem('push-notification-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check if already subscribed
    const checkSubscription = async () => {
      if (!isPushNotificationSupported()) return;

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const subscription = await subscribeToPushNotifications(vapidPublicKey);
        if (subscription) {
          setIsSubscribed(true);
          onSubscribed?.(subscription);
          toast.success('Push notifications enabled! You will receive order updates.');
          localStorage.setItem('push-notification-subscribed', 'true');
        } else {
          toast.error('Failed to enable push notifications');
        }
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  if (!isSupported || isDismissed || isSubscribed) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Get Order Updates</h3>
              <p className="text-sm text-blue-800 mb-3">
                Enable push notifications to receive real-time alerts when your order status changes.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isLoading ? 'Enabling...' : 'Enable Notifications'}
                </Button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

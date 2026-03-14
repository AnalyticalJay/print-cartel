import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function PushNotificationManager() {
  const { user } = useAuth();
  const subscribeMutation = trpc.notifications.subscribeToPush.useMutation();

  useEffect(() => {
    if (!user) return;

    // Check if browser supports service workers and push notifications
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return;
    }

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          registerPushNotification();
        }
      });
    } else if (Notification.permission === "granted") {
      registerPushNotification();
    }
  }, [user]);

  const registerPushNotification = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Subscribe to push notifications
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      // Skip if VAPID key is not configured
      if (!vapidKey) {
        console.log("Push notifications not configured - VAPID key missing");
        return;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      if (subscription) {
        const { endpoint, keys } = subscription.toJSON();
        if (endpoint && keys) {
          // Send subscription to server
          subscribeMutation.mutate({
            endpoint,
            auth: keys.auth || "",
            p256dh: keys.p256dh || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to register push notifications:", error);
    }
  };

  return null; // This component doesn't render anything
}

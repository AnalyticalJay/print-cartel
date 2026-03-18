import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function PushNotificationManager() {
  const { user } = useAuth();
  const subscribeMutation = trpc.notifications.subscribeToPush.useMutation();

  useEffect(() => {
    if (!user) return;

    // Check if browser supports service workers and push notifications
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    // Check if VAPID key is available
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      // VAPID key not configured - skip push notifications silently
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
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      });
      
      // Convert VAPID key from base64 to Uint8Array
      let applicationServerKey: BufferSource;
      try {
        // If it's already a base64 string, decode it
        const binaryString = atob(vapidKey);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        applicationServerKey = bytes;
      } catch (error) {
        console.error("Invalid VAPID key format. Expected base64 encoded string.", error);
        return;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      if (subscription) {
        const { endpoint, keys } = subscription.toJSON();
        if (endpoint && keys) {
          subscribeMutation.mutate({
            endpoint,
            auth: keys.auth || "",
            p256dh: keys.p256dh || "",
          });
        }
      }
    } catch (error) {
      // Silently fail - push notifications are optional
    }
  };

  return null; // This component doesn't render anything
}

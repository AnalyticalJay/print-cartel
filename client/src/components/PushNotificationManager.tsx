import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function PushNotificationManager() {
  const { user } = useAuth();
  const [vapidConfigured, setVapidConfigured] = useState(true);
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
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      });

      // Subscribe to push notifications
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      // Skip if VAPID key is not configured
      if (!vapidKey) {
        console.warn("Push notifications not configured - VAPID key missing. Set VITE_VAPID_PUBLIC_KEY in environment.");
        setVapidConfigured(false);
        // Silently fail - don't show error to user, just skip push notifications
        return;
      }
      
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
          // Send subscription to server
          subscribeMutation.mutate({
            endpoint,
            auth: keys.auth || "",
            p256dh: keys.p256dh || "",
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("Push notification registration failed (this is optional):", errorMessage);
      setVapidConfigured(false);
      
      // Log helpful debugging info for developers
      if (errorMessage.includes("applicationServerKey")) {
        console.error("VAPID key configuration issue detected.");
        console.error("To enable push notifications, generate keys with: node generate-vapid-keys.mjs");
        console.error("Then set VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment.");
      }
      
      // Don't show error to user - push notifications are optional
    }
  };

  return null; // This component doesn't render anything
}

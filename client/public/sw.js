// Service Worker for Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push notification received but no data");
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: data.tag || "notification",
      requireInteraction: data.requireInteraction || false,
    };

    if (data.image) {
      options.image = data.image;
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "Print Cartel", options)
    );
  } catch (error) {
    console.error("Error handling push notification:", error);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

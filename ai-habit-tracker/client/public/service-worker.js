// client/public/service-worker.js
/* eslint-disable no-restricted-globals */

// Cache name
const CACHE_NAME = "habitai-cache-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received", event);

  let data = {
    title: "HabitAI Reminder",
    body: "You have a habit deadline approaching!",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "habit-reminder",
    requireInteraction: true,
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    data: data.data || {},
    actions: [
      {
        action: "open",
        title: "View Challenge",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event);

  event.notification.close();

  if (event.action === "open" || event.action === "") {
    event.waitUntil(clients.openWindow("/challenge"));
  }
});

// Background sync event (for offline support)
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event);

  if (event.tag === "sync-challenge-data") {
    event.waitUntil(
      // Sync challenge data when back online
      fetch("/api/challenge/current")
        .then(() => console.log("Challenge data synced"))
        .catch(() => console.log("Sync failed"))
    );
  }
});

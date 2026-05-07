// Minimal service worker. We don't cache the menu (prices/dishes change live),
// just the offline fallback page so a reconnect prompt is always available.
// A fetch handler is required for Chrome's PWA install criteria.
//
// Bump CACHE_NAME on every deploy that changes /offline.html so the new copy
// activates instead of clients sticking to a stale one.

const CACHE_NAME = "shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      // New SW takes over without waiting for all tabs to close.
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      // Claim uncontrolled clients so they use the new SW immediately.
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only intercept top-level navigations. Everything else (API, assets,
  // Supabase, Clerk) hits the network directly — no chance of stale data.
  if (req.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached ?? new Response("Offline", { status: 503 });
      }
    })()
  );
});

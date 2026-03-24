World Words Hub — Service Worker
// Version bump this string to force cache refresh after updates
const CACHE_NAME = 'wwh-cache-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for external APIs (Datamuse, Dictionary API, etc.)
  if (
    url.hostname.includes('datamuse.com') ||
    url.hostname.includes('dictionaryapi.dev') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('urbandictionary.com')
  ) {
    return; // Let browser handle it normally
  }

  // Cache-first for same-origin assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful GET responses for same-origin
        if (
          response.ok &&
          event.request.method === 'GET' &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

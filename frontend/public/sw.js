
const CACHE_NAME = 'nexacare-v3-static';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap'
];

// Security: Patterns that MUST NEVER be cached to ensure medical data freshness
const EXCLUDED_PATTERNS = [
  '/api/',
  'gemini',
  'process.env'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy: Network Only for data/API/AI requests
  if (EXCLUDED_PATTERNS.some(pattern => url.pathname.includes(pattern) || url.hostname.includes(pattern))) {
    return;
  }

  // Strategy: Cache-First, then Network for UI Assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid responses (200 OK or 0 for opaque responses)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Avoid caching large binary or dynamic JSON data here
          if (!url.pathname.includes('/api/')) {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Essential for PWA offline requirement: fallback to index.html for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Update Management
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  console.log('[NexaCare PWA] Background sync triggered:', event.tag);
  if (event.tag === 'sync-vitals') {
    // Add logic here to sync deferred vitals from IndexedDB when online
  } else if (event.tag === 'sync-tasks') {
    // Add logic here to sync tasks
  }
});

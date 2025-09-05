const CACHE_NAME = 'certgen-cache-v3';
// Scope-aware asset URLs for GitHub Pages subpath deployments
const SCOPE = self.registration?.scope || '/';
const ASSETS = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Skip non-http(s) schemes (e.g., chrome-extension) which Cache API doesn't support
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Optionally restrict to same-origin to avoid caching third-party assets
  const sameOrigin = url.origin === self.location.origin;

  // Network-first for navigations/HTML to prevent stale blank pages after deploys
  const accept = request.headers.get('accept') || '';
  const isHTML = request.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return resp;
        })
        .catch(async () => (await caches.match(request)) || caches.match(SCOPE + 'index.html'))
    );
    return;
  }

  // For other GETs: cache-first, then network fallback + populate cache
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request)
        .then((resp) => {
          // Only cache successful same-origin responses
          if (sameOrigin && resp && resp.ok) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
          }
          return resp;
        })
        .catch(() => cached)
    )
  );
});

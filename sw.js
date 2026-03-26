const CACHE = 'walk-check-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS.map(function(url) {
        return new Request(url, { mode: 'no-cors' });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        // Cache successful responses for same-origin and fonts
        if (resp && resp.status === 200) {
          var url = e.request.url;
          if (url.startsWith(self.location.origin) || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
            var clone = resp.clone();
            caches.open(CACHE).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
        }
        return resp;
      }).catch(function() {
        // Offline fallback: return cached index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

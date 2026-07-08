const CACHE_NAME = 'jingyan-v1';
const urlsToCache = [
  '/smoking-cessation.html',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;430;500;590;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
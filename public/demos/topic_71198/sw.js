// ===== 导路 - Service Worker =====

const CACHE_NAME = 'daolu-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/data.js',
  './js/api.js',
  './js/charts.js',
  './js/utils.js',
  './js/main.js',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).catch(function(err) {
      console.error('[SW] 缓存失败:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        return cached;
      }
      return fetch(e.request).then(function(response) {
        // 只缓存同源静态资源
        var url = new URL(e.request.url);
        if (url.origin === self.location.origin && e.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        if (e.request.mode === 'navigate' || e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

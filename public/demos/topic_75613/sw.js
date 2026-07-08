// 政策通 Service Worker - 离线缓存
const CACHE_NAME = 'policymate-v3';
const CACHE_URLS = [
  './',
  './css/style.css',
  './js/data.js',
  './js/store.js',
  './js/matcher.js',
  './js/accessibility.js',
  './js/router.js',
  './js/app.js',
  './data/policies.json',
  './data/scenes.json',
  './manifest.json',
  './icons/icon.svg'
];

// Install: 缓存核心资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first 策略
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // 动态缓存新请求
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      // 离线降级：返回首页缓存
      if (event.request.mode === 'navigate') {
        return caches.match('./');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

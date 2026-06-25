// 药明白 · Service Worker
const CACHE_NAME = 'yao-mingbai-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './assets/hero_bg_1280x720.jpg',
  './assets/family_care_1152x864.jpg',
  './assets/voice_dialect_1152x864.jpg',
  './assets/elderly_phone_1152x864.jpg'
];

// 安装：缓存所有静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 拦截请求：缓存优先，离线可用
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            // 只缓存同源的成功响应
            if (response.ok && event.request.url.startsWith(self.location.origin)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match('./index.html'));
      })
  );
});

const CACHE_NAME = 'nutritionist-ai-v7';
const STATIC_ASSETS = [
  '/nutritionist-ai.html',
  '/manifest.json',
  '/lib/vue.global.js',
  '/lib/tailwindcss.js',
  '/prompts/professional.txt',
  '/prompts/fun.txt',
  '/prompts/coach.txt',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  
  if (STATIC_ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return response;
      }).catch(() => {
        return new Response('<h1 style="text-align:center;margin-top:40vh;font-family:sans-serif;">⚠️ 离线状态<br><small>请连接网络后重试</small></h1>', {
          headers: { 'Content-Type': 'text/html' }
        });
      });
      
      return cached || fetchPromise;
    })
  );
});
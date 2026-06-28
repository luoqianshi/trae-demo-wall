// HeartShare Service Worker - 离线缓存
const CACHE = 'heartshare-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './images/hero-1.svg',
  './images/hero-2.svg',
  './images/hero-3.svg',
  './images/me.svg',
  './images/cover-1.svg',
  './images/cover-2.svg',
  './images/cover-3.svg',
  './images/cover-4.svg',
  './images/cover-5.svg',
  './images/cover-6.svg',
  './images/cover-7.svg',
  './images/cover-8.svg',
  './images/avatar-1.svg',
  './images/avatar-2.svg',
  './images/avatar-3.svg',
  './images/avatar-4.svg',
  './images/avatar-5.svg',
  './images/seed-cover-1.svg',
  './images/seed-cover-2.svg',
  './images/seed-cover-3.svg',
  './images/seed-cover-4.svg',
  './images/seed-cover-5.svg',
  './images/seed-cover-6.svg',
  './images/seed-cover-7.svg',
  './images/seed-cover-8.svg',
  './images/seed-cover-1-2.svg',
  './images/seed-cover-1-3.svg',
  './images/seed-cover-2-2.svg',
  './images/seed-cover-3-2.svg',
  './images/seed-cover-3-3.svg',
  './images/seed-cover-4-2.svg',
  './images/seed-cover-5-2.svg',
  './images/seed-cover-6-2.svg',
  './images/seed-cover-7-2.svg',
  './images/seed-avatar-1.svg',
  './images/seed-avatar-2.svg',
  './images/seed-avatar-3.svg',
  './images/seed-avatar-4.svg',
  './images/seed-avatar-5.svg',
  './images/seed-avatar-6.svg',
  './images/seed-avatar-7.svg',
  './images/seed-avatar-8.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // 同源资源动态缓存
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

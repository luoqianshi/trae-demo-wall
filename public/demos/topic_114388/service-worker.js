// service-worker.js - 简单的离线缓存
const CACHE_NAME = 'study-plan-v4';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './assets/icon.svg',
    './js/app.js',
    './js/storage.js',
    './js/scheduler.js',
    './js/reminder.js',
    './js/utils.js',
    './js/dashboard.js',
    './js/ai-assistant.js',
    './js/focus-mode.js',
    './js/particles.js',
    './js/demo-data.js',
    './js/time-grid.js',
    './js/points-generator.js',
    './js/extractor.js',
    './js/points-picker.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            // 只缓存同源资源
            if (res && e.request.url.startsWith(self.location.origin)) {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return res;
        }).catch(() => cached))
    );
});

var CACHE_NAME = 'laohuangli-v1';
var ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/icons.js',
    './js/calendar.js',
    './js/voice.js',
    './js/settings.js',
    './js/ui.js',
    './js/app.js',
    './lib/lunar.js',
    './manifest.json'
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(r) {
            return r || fetch(e.request);
        })
    );
});

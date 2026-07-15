var CACHE_NAME = 'jc-firstaid-v1';
var ASSETS = [
    './',
    './急救教练：院前急救技能AI训练平台.html',
    './css/main.css',
    './js/data.js',
    './js/api.js',
    './js/main.js',
    './js/features.js'
];

self.addEventListener('install', function(e) {
    e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
        return cache.addAll(ASSETS);
    }));
});

self.addEventListener('fetch', function(e) {
    e.respondWith(caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(response) {
            return caches.open(CACHE_NAME).then(function(cache) {
                cache.put(e.request, response.clone());
                return response;
            });
        });
    }).catch(function() {
        return caches.match('./急救教练：院前急救技能AI训练平台.html');
    }));
});

self.addEventListener('activate', function(e) {
    e.waitUntil(caches.keys().then(function(keys) {
        return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }));
});
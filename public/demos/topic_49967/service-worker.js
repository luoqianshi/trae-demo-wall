// 拾光 Service Worker - 预缓存核心资源，离线可用
const CACHE = "shiguang-v1";
const PRECACHE = [
    "./",
    "index.html",
    "css/themes.css",
    "css/fonts.css",
    "data/quotes.json",
    "data/fun-facts.json",
    "js/storage.js",
    "js/online.js",
    "stickers/smile.svg",
    "stickers/heart.svg",
    "stickers/hug.svg",
    "stickers/star.svg",
    "stickers/moon.svg",
    "stickers/flower.svg",
    "stickers/coffee.svg",
    "stickers/book.svg",
    "_framework/blazor.webassembly.js"
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
            .then(() => self.clients.claim())
            .then(() => self.registration.unregister())
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
            if (resp.ok) {
                const copy = resp.clone();
                caches.open(CACHE).then(c => c.put(e.request, copy));
            }
            return resp;
        }).catch(() => caches.match("index.html")))
    );
});

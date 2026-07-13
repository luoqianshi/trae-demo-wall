/* ============================================ */
/* sw.js - Service Worker                      */
/* 作用：PWA 离线缓存，让App断网也能用          */
/* 注意：需要通过 http/https 协议访问才生效      */
/* 直接双击打开 file:// 协议下不生效            */
/* ============================================ */

const CACHE_NAME = 'traveleasy-v14';

// 需要缓存的文件列表
const CACHE_FILES = [
    './',
    './index.html',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/tabs.css',
    './js/utils.js',
    './js/storage.js',
    './js/data.js',
    './js/journey.js',
    './js/app.js',
    './js/home.js',
    './js/food.js',
    './js/travel.js',
    './js/trip.js',
    './js/ai.js',
    './js/guide.js',
    './js/badges.js',
    './js/settings.js',
    './manifest.json'
];

// 安装：缓存所有文件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求：优先从缓存读取，缓存没有再从网络请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;  // 缓存命中，直接返回
                }
                return fetch(event.request);  // 缓存没有，从网络请求
            })
    );
});

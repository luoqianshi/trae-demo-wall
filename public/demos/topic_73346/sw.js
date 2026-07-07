// 回声·人生剧场 Service Worker
// 缓存策略：App Shell 使用 Cache First，其他资源使用 Network First

const CACHE_VERSION = 'echo-v1';
const CACHE_NAME = `echo-cache-${CACHE_VERSION}`;

// 需要预缓存的 App Shell 资源
const APP_SHELL = [
  './',
  './index.html',
];

// 安装事件：预缓存 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('echo-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过 chrome-extension 和 API 请求
  const url = new URL(request.url);
  if (url.protocol === 'chrome-extension:') return;

  // 对于静态资源（JS/CSS/字体/图片），使用 Cache First 策略
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 对于导航请求，使用 Network First 策略
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // 其他请求使用 Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
/**
 * PrivateCoach Service Worker
 * 对应 T6 体验打磨：PWA 离线支持
 *
 * 策略：
 * - 静态资源（JS/CSS/图片/字体）：缓存优先（Cache First）
 * - HTML 导航请求：网络优先，失败时回退到缓存
 * - API 请求（fetch 到外部域名）：直接透传，不缓存
 *
 * 缓存版本管理：
 * - 通过 CACHE_VERSION 控制缓存版本
 * - activate 时清理旧版本缓存
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `pc-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pc-runtime-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

/* -------------------------------------------------------------------------- */
/*                            Install：预缓存静态资源                           */
/* -------------------------------------------------------------------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('SW precache failed:', err);
      }),
  );
});

/* -------------------------------------------------------------------------- */
/*                            Activate：清理旧缓存                              */
/* -------------------------------------------------------------------------- */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* -------------------------------------------------------------------------- */
/*                            Fetch：缓存策略                                   */
/* -------------------------------------------------------------------------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跳过跨域请求（API 调用等），直接透传
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML 导航请求：网络优先，失败时回退到缓存
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功时缓存一份
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // 网络失败时从缓存中查找
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        }),
    );
    return;
  }

  // 静态资源（JS/CSS/图片/字体等）：缓存优先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // 后台更新缓存（stale-while-revalidate）
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            }
          })
          .catch(() => {
            // 后台更新失败，静默忽略
          });
        return cached;
      }

      // 缓存未命中，从网络获取
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // 网络也失败，返回 undefined（浏览器处理）
          return undefined;
        });
    }),
  );
});

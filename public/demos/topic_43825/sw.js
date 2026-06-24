// Service Worker - 离线缓存策略
const CACHE_NAME = 'knowledge-v1';
const RUNTIME_CACHE = 'knowledge-runtime';

// 构建时预缓存的静态资源 URL 模式
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// 安装阶段：预缓存核心静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] 清理旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：Cache First + Network Fallback 策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过 chrome-extension 和非 GET 请求
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // 对于静态资源（JS/CSS/字体/图片），使用 Cache First 策略
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|jpeg|gif|ico)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 对于导航请求和 API，使用 Network First 策略
  event.respondWith(networkFirst(request));
});

// Cache First：优先从缓存取，缓存未命中时走网络并缓存
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 离线时返回离线页面（如果请求的是 HTML）
    if (request.headers.get('accept')?.includes('text/html')) {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    return new Response('离线状态，该资源未缓存', { status: 503 });
  }
}

// Network First：优先走网络，网络失败时回退到缓存
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // 导航请求回退到 index.html（SPA 路由支持）
    if (request.mode === 'navigate') {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    return new Response('网络不可用', { status: 503 });
  }
}
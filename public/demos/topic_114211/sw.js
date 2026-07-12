// Service Worker - PWA 离线缓存
const CACHE_NAME = 'ai-game-helper-v1'
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('SW cache failed:', err))
  )
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
  // 仅处理 GET 请求
  if (event.request.method !== 'GET') return

  // 跳过 Chrome 扩展和 HMR WebSocket
  if (event.request.url.includes('chrome-extension') || 
      event.request.url.includes('/@vite/') ||
      event.request.url.startsWith('ws://')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 缓存命中：返回缓存
        if (cachedResponse) {
          return cachedResponse
        }

        // 缓存未命中：从网络获取
        return fetch(event.request)
          .then(response => {
            // 检查是否为有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 克隆响应并缓存
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // 网络失败时返回缓存的 index.html 作为离线回退
            if (event.request.destination === 'document') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

// 接收主线程消息，触发更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
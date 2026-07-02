const CACHE_NAME = 'ember-night-v1';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './scripts/app.js',
  './scripts/AudioEngine.js',
  './scripts/SensorManager.js',
  './scripts/DecayEngine.js',
  './scripts/WakeLockManager.js',
  './scripts/texts.js',
  './scripts/StateManager.js',
  './scripts/scenes/Opening.js',
  './scripts/scenes/Window.js',
  './scripts/scenes/Choice.js',
  './scripts/scenes/Pier.js',
  './scripts/scenes/Room.js',
  './scripts/scenes/Breathing.js',
  './scripts/scenes/Silence.js',
  './audio/env_night.mp3',
  './audio/env_ocean.mp3',
  './audio/env_rain.mp3',
  './audio/sfx_water.mp3',
  './audio/sfx_wood.mp3',
  './audio/sfx_cloth.mp3',
  './audio/sfx_chime.mp3',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

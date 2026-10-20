const CACHE_NAME = 'simulacro-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './lib/maplibre-gl.js',
  './lib/maplibre-gl.css',
  './lib/pmtiles.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Para peticiones HTTP normales de la app
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

const CACHE_NAME = 'simulacro-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './lib/maplibre-gl.js',
  './lib/maplibre-gl.css',
  './lib/pmtiles.js',
  './lib/turf.min.js',
  './sprite/sprite.png',
  './sprite/sprite.json',
  './sprite/sprite@2x.png',
  './sprite/sprite@2x.json'
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

// Cache dinámico: guarda los glifos (.pbf) de las etiquetas para que funcionen en Modo Avión
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).then((networkResponse) => {
        if (e.request.url.includes('.pbf') || e.request.url.includes('font')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
const CACHE_NAME = 'simulacro-v18';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './instituciones_matricula.geojson',
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
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // A) Para navegación y HTML: NETWORK-FIRST con respaldo offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // B) Soporte offline para PMTiles (Range Requests): Si falla la red (Modo Avión), buscar en caché local
  if (e.request.headers.has('range') || url.pathname.endsWith('.pmtiles')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Si el servidor responde correctamente, clonamos la respuesta para cachear fragmentos
          if (res.status === 200 || res.status === 206) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // C) Cache-First con guardado dinámico para librerías, glifos de fuentes (.pbf) y sprites
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        if (url.pathname.includes('.pbf') || url.pathname.includes('/fonts/') || url.origin === location.origin) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }

        return networkResponse;
      });
    })
  );
});
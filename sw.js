const CACHE_NAME = 'simulacro-v14'; // Versión actualizada para forzar purga

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

// 1. Instalación: precarga assets esenciales y toma el control inmediato
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activación: elimina cualquier versión vieja de caché (v8, v9, etc.) y reclama clientes
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de peticiones
self.addEventListener('fetch', (e) => {
  // Ignorar peticiones que no sean GET
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // NO interceptar peticiones de PMTiles ni con cabecera Range (dejar que el navegador maneje los bytes nativamente)
  if (e.request.headers.has('range') || url.pathname.endsWith('.pmtiles')) {
    return;
  }

  // A) Para navegación y HTML (index.html): NETWORK-FIRST con respaldo offline
  // Si hay red, descarga la última versión y refresca la caché. Si no hay conexión, usa la caché.
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

  // B) Para el resto de recursos (librerías, sprites, iconos, glifos .pbf): CACHE-FIRST con guardado dinámico
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cachear glifos de fuentes (.pbf) o recursos locales estáticos para offline
        if (url.pathname.includes('.pbf') || url.pathname.includes('/fonts/') || url.origin === location.origin) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }

        return networkResponse;
      });
    })
  );
});
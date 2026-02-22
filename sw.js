const CACHE_NAME = 'cs-inventory-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/images/icon.svg',
  '/assets/images/tattoo-pattern.svg',
  '/src/css/reset.css',
  '/src/css/variables.css',
  '/src/css/base.css',
  '/src/css/modules/layout.css',
  '/src/css/modules/card.css',
  '/src/css/modules/form.css',
  '/src/css/modules/nav.css',
  '/src/css/modules/table.css',
  '/src/css/modules/modal.css',
  '/src/css/modules/dashboard.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rye&display=swap',
  'https://unpkg.com/dexie@3.2.4/dist/dexie.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Regresa el cache si existe, o haz el fetch
      return response || fetch(event.request).catch(() => {
        // En caso de estar offline y no tener el archivo en cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

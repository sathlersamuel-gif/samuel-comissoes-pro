const CACHE_NAME = 'samuel-comissoes-pro-v15';
const APP_SHELL = [
  './',
  './index.html',
  './style.css?v=4',
  './pwa-enhancements.js?v=4',
  './phone-mask.js?v=3',
  './script.js?v=4',
  './import-backup.js?v=2',
  './app-upgrades.js?v=1',
  './app-features.js?v=2',
  './premium-ui.js?v=1',
  './pdf-viewer-fix.js?v=1',
  './report-options-fix.js?v=5',
  './firebase-integration.js?v=7',
  './admin-controls.js?v=2',
  './install-guide.js?v=1',
  './admin-nav-fix.js?v=1',
  './profile-settings.js?v=5',
  './requirements-fix.js?v=2',
  './observacao-historico.js?v=2',
  './manifest.json?v=7',
  './icon-192.png?v=4',
  './icon-512.png?v=4',
  './apple-touch-icon.png?v=4'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
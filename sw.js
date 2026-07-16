const CACHE_NAME = 'samuel-comissoes-pro-v18';
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
  './pdf-viewer-fix.js?v=2',
  './report-options-fix.js?v=7',
  './firebase-integration.js?v=7',
  './admin-controls.js?v=2',
  './install-guide.js?v=1',
  './admin-nav-fix.js?v=1',
  './profile-settings.js?v=5',
  './requirements-fix.js?v=2',
  './observacao-historico.js?v=2',
  './dashboard-v2.js?v=4',
  './security-update.js?v=2',
  './version.json',
  './manifest.json?v=13',
  './app-icon.svg?v=13'
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

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
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
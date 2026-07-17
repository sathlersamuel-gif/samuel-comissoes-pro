const CACHE_NAME = 'samuel-comissoes-pro-v39';
const APP_SHELL = [
  './',
  './index.html',
  './style.css?v=4',
  './dashboard-v2.css?v=7',
  './home-four-columns-fix.css?v=2',
  './visual-match.css?v=3',
  './bottom-layout-fix.css?v=1',
  './brand-cleanup.css?v=1',
  './responsive-layout.css?v=3',
  './tipo-numeros-mobile.js?v=3',
  './analise-vendas.css?v=1',
  './mobile-alignment-fix.css?v=1',
  './analise-vendas.js?v=1',
  './pwa-enhancements.js?v=9',
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
  './dashboard-v2.js?v=9',
  './security-update.js?v=4',
  './gear-position-fix.js?v=1',
  './responsive-layout.js?v=1',
  './version.json',
  './manifest.json?v=13',
  './app-icon.svg?v=13'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>
      Promise.allSettled(APP_SHELL.map(url=>cache.add(url)))
    )
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='ACTIVATE_TESTED_VERSION') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
          }
          return response;
        })
        .catch(()=>caches.match('./index.html').then(cached=>cached||caches.match('./')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
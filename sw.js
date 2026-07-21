const CACHE_NAME='samuel-comissoes-pro-v83';
const APP_SHELL=['./','./index.html','./style.css?v=4','./dashboard-v2.css?v=7','./pwa-enhancements.js?v=14','./user-management-unified.js?v=1','./firebase-integration.js?v=7','./script.js?v=4','./dashboard-v2.js?v=9','./manifest.json?v=14','./app-icon.svg?v=13'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>Promise.allSettled(APP_SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE_NAME).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE_TESTED_VERSION')self.skipWaiting()});
function rede(req){return fetch(req,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE_NAME).then(c=>c.put(req,cp))}return r}).catch(()=>caches.match(req))}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(e.request.mode==='navigate'){e.respondWith(rede(e.request).catch(()=>caches.match('./index.html')));return}if(u.origin===self.location.origin){e.respondWith(/\.(js|json|html)$/.test(u.pathname)?rede(e.request):caches.match(e.request).then(c=>c||rede(e.request)));return}e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))) });

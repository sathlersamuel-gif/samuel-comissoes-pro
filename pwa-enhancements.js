(function(){
  'use strict';
  const HOTFIX='2026.07.21.3';

  function carregarScript(src,id){
    if(id&&document.getElementById(id))return;
    const script=document.createElement('script');
    if(id)script.id=id;
    script.src=src;
    script.defer=true;
    document.head.appendChild(script);
  }

  carregarScript('tipo-numeros-mobile.js?v=3','scpTipoNumerosLoader');
  carregarScript('ai-performance-accelerator.js?v=1','scpPerformanceLoader');
  carregarScript('edit-sale-definitive-fix.js?v=4','scpEditSaleLoader');

  // Estes dois arquivos também são carregados aqui para alcançar instalações
  // antigas cujo index.html ficou preso no cache do iPhone.
  carregarScript(`admin-access-settings-fix.js?v=${HOTFIX}`,'scpAdminAccessHotfix');
  carregarScript(`user-management-modern-v2.js?v=${HOTFIX}`,'scpUserManagementHotfix');

  function instalado(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
  }

  function criarSplash(){
    if(document.getElementById('appSplash'))return;
    const splash=document.createElement('div');
    splash.id='appSplash';
    splash.innerHTML='<div class="splash-logo">S</div><h1>Samuel Comissões PRO</h1><p>Carregando seu painel...</p>';
    const style=document.createElement('style');
    style.textContent='#appSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(160deg,#061326,#0b2a5a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;transition:opacity .35s ease}.splash-logo{width:96px;height:96px;border-radius:28px;background:#d90429;display:grid;place-items:center;font-size:54px;font-weight:800;box-shadow:0 18px 45px rgba(0,0,0,.35)}#appSplash h1{font-size:25px;margin:22px 0 8px;text-align:center}#appSplash p{opacity:.72}body.app-standalone{padding-top:env(safe-area-inset-top);padding-bottom:calc(74px + env(safe-area-inset-bottom))}body.app-standalone .bottom{padding-bottom:env(safe-area-inset-bottom)}';
    document.head.appendChild(style);
    document.body.appendChild(splash);
    const remover=()=>{if(!splash.isConnected)return;splash.style.opacity='0';setTimeout(()=>splash.remove(),380)};
    setTimeout(remover,700);
    setTimeout(remover,2500);
  }

  if(instalado())document.body.classList.add('app-standalone');
  criarSplash();

  async function limparCachesAntigos(){
    const chave='scp-cache-hotfix-20260721-3';
    if(localStorage.getItem(chave))return false;
    try{
      const nomes=await caches.keys();
      await Promise.all(nomes.filter(nome=>nome.startsWith('samuel-comissoes-pro-')).map(nome=>caches.delete(nome)));
      localStorage.setItem(chave,'1');
      return true;
    }catch(_){
      return false;
    }
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const limpou=await limparCachesAntigos();
        const registration=await navigator.serviceWorker.register('./sw.js?v=47',{updateViaCache:'none'});
        await registration.update().catch(()=>{});
        if(registration.waiting)registration.waiting.postMessage({type:'ACTIVATE_TESTED_VERSION'});
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          if(!sessionStorage.getItem('scpAtualizacaoAplicadaV13')){
            sessionStorage.setItem('scpAtualizacaoAplicadaV13','1');
            location.reload();
          }
        });
        if(limpou&&!navigator.serviceWorker.controller&&!sessionStorage.getItem('scpHotfixReloadV13')){
          sessionStorage.setItem('scpHotfixReloadV13','1');
          setTimeout(()=>location.reload(),250);
        }
      }catch(error){
        console.error('Falha ao atualizar o modo offline:',error);
      }
    });
  }

  window.__SCP_PWA_HOTFIX__=HOTFIX;
})();
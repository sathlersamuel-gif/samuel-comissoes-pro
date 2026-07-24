(function(){
  'use strict';
  const HOTFIX='2026.07.24.4';

  function carregarScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id))return resolve();
      if(src.includes('ai-performance-accelerator')&&window.__SCP_ACCELERATOR_LOADING__)return resolve();
      const script=document.createElement('script');
      if(id)script.id=id;
      script.src=src;
      script.async=false;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  carregarScript('tipo-numeros-mobile.js?v=3','scpTipoNumerosLoader').catch(console.error);
  carregarScript('ai-performance-accelerator.js?v=2','scpPerformanceLoader').catch(console.error);
  carregarScript('edit-sale-definitive-fix.js?v=4','scpEditSaleLoader').catch(console.error);
  carregarScript('user-management-unified.js?v=7','scpUserManagementUnified').catch(console.error);

  const modulosGuardia=[
    ['guardian-admin-only.js?v=3','scpGuardianAdminOnly'],
    ['guardian-firestore-bridge.js?v=1','scpGuardianFirestoreBridge'],
    ['guardian-gear-integration.js?v=3','scpGuardianGearIntegration'],
    ['guardian-audit-upgrade.js?v=2','scpGuardianAuditUpgrade'],
    ['guardian-offline-filter.js?v=1','scpGuardianOfflineFilter'],
    ['safari-indexeddb-transaction-fix.js?v=1','scpSafariIndexedDbFix'],
    ['guardian-deep-audit.js?v=3','scpGuardianDeepAudit'],
    ['guardian-autofix.js?v=3','scpGuardianAutofix'],
    ['guardian-retention.js?v=1','scpGuardianRetention'],
    ['guardian-occurrences-safe.js?v=2','scpGuardianOccurrencesSafe'],
    ['guardian-actions-organizer.js?v=1','scpGuardianActionsOrganizer'],
    ['guardian-repository-knowledge.js?v=1','scpGuardianRepositoryKnowledge'],
    ['guardian-actions-functional.js?v=1','scpGuardianActionsFunctional']
  ];

  modulosGuardia.reduce(
    (fila,[src,id])=>fila.then(()=>carregarScript(src,id)),
    Promise.resolve()
  ).then(()=>{
    window.dispatchEvent(new CustomEvent('scp-guardian-modules-ready'));
  }).catch(error=>{
    console.error('Falha ao carregar a auditoria completa da IA Guardiã:',error);
    window.SCPMonitor?.registrar?.('guardian-loader',error.message,{arquivo:error.stack||''});
  });

  function instalado(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}

  function restaurarTelaInicial(){
    if(document.getElementById('scpStandaloneLayout'))return;
    const style=document.createElement('style');style.id='scpStandaloneLayout';
    style.textContent=`#appSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(160deg,#061326,#0b2a5a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;transition:opacity .18s ease;transform:translateZ(0)}.splash-logo{width:96px;height:96px;border-radius:28px;background:#d90429;display:grid;place-items:center;font-size:54px;font-weight:800;box-shadow:0 18px 45px rgba(0,0,0,.28)}#appSplash h1{font-size:25px;margin:22px 0 8px;text-align:center}#appSplash p{opacity:.72}body.app-standalone{padding-top:env(safe-area-inset-top);padding-bottom:calc(74px + env(safe-area-inset-bottom))}body.app-standalone .bottom{padding-bottom:env(safe-area-inset-bottom)}`;
    document.head.appendChild(style);
    if(instalado())document.body.classList.add('app-standalone');
  }

  function criarSplash(){
    if(document.getElementById('appSplash'))return;
    const splash=document.createElement('div');splash.id='appSplash';
    splash.innerHTML='<div class="splash-logo">S</div><h1>Samuel Comissões PRO</h1><p>Carregando seu painel...</p>';
    document.body.appendChild(splash);
    const remover=()=>{if(!splash.isConnected)return;splash.style.opacity='0';splash.style.pointerEvents='none';setTimeout(()=>splash.remove(),200)};
    requestAnimationFrame(()=>setTimeout(remover,420));
    setTimeout(remover,1800);
  }

  restaurarTelaInicial();
  criarSplash();

  async function limparCachesAntigos(){
    const chave=`scp-cache-hotfix-${HOTFIX}`;
    if(localStorage.getItem(chave))return;
    try{
      const nomes=await caches.keys();
      await Promise.all(nomes.filter(nome=>nome.startsWith('samuel-comissoes-pro-')||nome.startsWith('scp-ai-warm-')).map(nome=>caches.delete(nome)));
      localStorage.setItem(chave,'1');
    }catch(_){}
  }

  if('serviceWorker'in navigator){
    window.addEventListener('load',async()=>{
      try{
        await limparCachesAntigos();
        const registration=await navigator.serviceWorker.register('./sw.js?v=114',{updateViaCache:'none'});
        await registration.update().catch(()=>{});
        if(registration.waiting)registration.waiting.postMessage({type:'ACTIVATE_TESTED_VERSION'});
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          sessionStorage.setItem('scpAtualizacaoDisponivelV114','1');
        });
      }catch(error){console.error('Falha ao atualizar o modo offline:',error);}
    },{once:true});
  }

  window.__SCP_PWA_HOTFIX__=HOTFIX;
})();
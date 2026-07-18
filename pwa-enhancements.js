(function(){
  const ajusteDireto=document.createElement('script');
  ajusteDireto.src='tipo-numeros-mobile.js?v=3';
  ajusteDireto.defer=true;
  document.head.appendChild(ajusteDireto);

  const acelerador=document.createElement('script');
  acelerador.src='ai-performance-accelerator.js?v=1';
  acelerador.defer=true;
  document.head.appendChild(acelerador);

  const gestaoUsuarios=document.createElement('script');
  gestaoUsuarios.src='user-management-core.js?v=1';
  gestaoUsuarios.defer=true;
  document.head.appendChild(gestaoUsuarios);

  function instalado(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function criarSplash(){
    if(document.getElementById('appSplash')) return;
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

  if(instalado()) document.body.classList.add('app-standalone');
  criarSplash();

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js?v=34',{updateViaCache:'none'});
        await registration.update().catch(()=>{});
        if(registration.waiting) registration.waiting.postMessage({type:'ACTIVATE_TESTED_VERSION'});
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          if(!sessionStorage.getItem('scpAtualizacaoAplicada')){
            sessionStorage.setItem('scpAtualizacaoAplicada','1');
            location.reload();
          }
        });
      }catch(error){
        console.error('Falha ao registrar o modo offline:',error);
      }
    });
  }
})();

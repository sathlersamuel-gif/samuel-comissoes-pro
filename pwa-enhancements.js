(function(){
  const ajusteDireto=document.createElement('script');
  ajusteDireto.src='tipo-numeros-mobile.js?v=3';
  ajusteDireto.defer=true;
  document.head.appendChild(ajusteDireto);

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
    setTimeout(remover,900);
    setTimeout(remover,3000);
  }

  if(instalado()) document.body.classList.add('app-standalone');
  criarSplash();

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js?v=29',{updateViaCache:'none'});
        registration.update().catch(()=>{});
      }catch(error){
        console.error('Falha ao registrar o modo offline:',error);
      }
    });
  }
})();
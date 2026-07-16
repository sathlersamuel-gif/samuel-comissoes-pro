(function(){
  'use strict';

  const ENABLED_KEY='scp_faceid_enabled';
  const CREDENTIAL_KEY='scp_faceid_credential';
  const USER_KEY='scp_faceid_user';
  const encoder=new TextEncoder();

  function bytesToBase64Url(bytes){
    let binary='';
    new Uint8Array(bytes).forEach(byte=>binary+=String.fromCharCode(byte));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function base64UrlToBytes(value){
    const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
    const padded=normalized+'='.repeat((4-normalized.length%4)%4);
    const binary=atob(padded);
    return Uint8Array.from(binary,char=>char.charCodeAt(0));
  }

  function randomBytes(size=32){
    const bytes=new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function suportado(){
    return window.isSecureContext && 'PublicKeyCredential' in window && navigator.credentials;
  }

  async function autenticadorDisponivel(){
    if(!suportado()) return false;
    try{
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }catch{return false;}
  }

  function criarEstilo(){
    if(document.getElementById('scpSecurityStyle')) return;
    const style=document.createElement('style');
    style.id='scpSecurityStyle';
    style.textContent=`
      .scp-security-tools{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:8500;display:flex;flex-direction:column;gap:9px}
      .scp-security-button{width:48px;height:48px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:#0b2a5a;color:#fff;box-shadow:0 9px 24px rgba(0,0,0,.28);font-size:21px;display:grid;place-items:center;padding:0}
      .scp-security-panel{position:fixed;inset:0;z-index:19000;background:rgba(1,9,22,.78);backdrop-filter:blur(10px);display:grid;place-items:end center;padding:18px 14px calc(20px + env(safe-area-inset-bottom))}
      .scp-security-card{width:min(100%,430px);background:#0a1d35;border:1px solid #234b79;border-radius:24px;padding:20px;color:#fff;box-shadow:0 22px 55px rgba(0,0,0,.48)}
      .scp-security-card h2{margin:0 0 8px;font-size:21px}.scp-security-card p{margin:0 0 16px;color:#aec0d8;line-height:1.45}
      .scp-security-card button{width:100%;margin-top:9px}.scp-security-card .secundario{background:#172b45;color:#fff}.scp-security-card .perigo{background:#7f1d2d;color:#fff}
      .scp-lock{position:fixed;inset:0;z-index:25000;background:linear-gradient(160deg,#061326,#0b2a5a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:28px}
      .scp-lock-icon{width:94px;height:94px;border-radius:28px;background:#d90429;display:grid;place-items:center;font-size:45px;box-shadow:0 18px 45px rgba(0,0,0,.35)}
      .scp-lock h1{font-size:24px;margin:20px 0 8px}.scp-lock p{color:#b9c9dc;max-width:320px;margin:0 0 18px}.scp-lock button{max-width:320px;width:100%}
    `;
    document.head.appendChild(style);
  }

  function fecharPainel(){document.getElementById('scpSecurityPanel')?.remove();}

  async function cadastrarFaceId(){
    if(!(await autenticadorDisponivel())){
      alert('O Face ID não está disponível neste navegador ou aparelho. Abra o aplicativo instalado pela Tela de Início do iPhone.');
      return false;
    }
    try{
      let userId=localStorage.getItem(USER_KEY);
      if(!userId){userId=bytesToBase64Url(randomBytes(16));localStorage.setItem(USER_KEY,userId);}
      const credential=await navigator.credentials.create({publicKey:{
        challenge:randomBytes(32),
        rp:{name:'Samuel Comissões PRO',id:location.hostname},
        user:{id:base64UrlToBytes(userId),name:'samuel-comissoes',displayName:'Samuel Comissões PRO'},
        pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
        authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},
        timeout:60000,
        attestation:'none'
      }});
      if(!credential) return false;
      localStorage.setItem(CREDENTIAL_KEY,bytesToBase64Url(credential.rawId));
      localStorage.setItem(ENABLED_KEY,'1');
      alert('Face ID ativado com sucesso!');
      return true;
    }catch(error){
      if(error?.name!=='NotAllowedError') console.error(error);
      alert('Não foi possível ativar o Face ID. Tente novamente.');
      return false;
    }
  }

  async function autenticar(){
    const credentialId=localStorage.getItem(CREDENTIAL_KEY);
    if(!credentialId) return cadastrarFaceId();
    try{
      const assertion=await navigator.credentials.get({publicKey:{
        challenge:randomBytes(32),
        rpId:location.hostname,
        allowCredentials:[{type:'public-key',id:base64UrlToBytes(credentialId),transports:['internal']}],
        userVerification:'required',
        timeout:60000
      }});
      return Boolean(assertion);
    }catch(error){
      if(error?.name!=='NotAllowedError') console.error(error);
      return false;
    }
  }

  function mostrarBloqueio(){
    if(document.getElementById('scpFaceLock')) return;
    const lock=document.createElement('div');
    lock.id='scpFaceLock';lock.className='scp-lock';
    lock.innerHTML='<div class="scp-lock-icon">🔒</div><h1>Samuel Comissões PRO</h1><p>Use o Face ID para acessar suas vendas e comissões.</p><button type="button" id="scpUnlockButton">Desbloquear com Face ID</button>';
    document.body.appendChild(lock);
    const desbloquear=async()=>{const button=document.getElementById('scpUnlockButton');if(button){button.disabled=true;button.textContent='Verificando...';}const ok=await autenticar();if(ok)lock.remove();else if(button){button.disabled=false;button.textContent='Tentar novamente';}};
    document.getElementById('scpUnlockButton')?.addEventListener('click',desbloquear);
    setTimeout(desbloquear,350);
  }

  async function atualizarAplicativo(){
    const confirmou=confirm('Buscar e instalar a versão mais recente? Suas vendas e comissões não serão apagadas.');
    if(!confirmou) return;
    try{
      const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];
      await Promise.all(registrations.map(async registration=>{try{await registration.update();registration.waiting?.postMessage?.({type:'SKIP_WAITING'});}catch{}}));
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
      const url=new URL(location.href);url.searchParams.set('_atualizar',Date.now().toString());
      location.replace(url.toString());
    }catch(error){
      console.error(error);location.reload();
    }
  }

  function abrirPainel(){
    fecharPainel();
    const enabled=localStorage.getItem(ENABLED_KEY)==='1';
    const panel=document.createElement('div');panel.id='scpSecurityPanel';panel.className='scp-security-panel';
    panel.innerHTML=`<div class="scp-security-card"><h2>Segurança e atualização</h2><p>O Face ID protege o acesso no seu iPhone. A atualização mantém todas as vendas e comissões salvas.</p><button type="button" id="scpToggleFace">${enabled?'Desativar Face ID':'Ativar Face ID'}</button><button type="button" id="scpUpdateApp" class="secundario">🔄 Atualizar aplicativo</button><button type="button" id="scpCloseSecurity" class="secundario">Fechar</button></div>`;
    document.body.appendChild(panel);
    panel.addEventListener('click',event=>{if(event.target===panel)fecharPainel();});
    document.getElementById('scpCloseSecurity')?.addEventListener('click',fecharPainel);
    document.getElementById('scpUpdateApp')?.addEventListener('click',atualizarAplicativo);
    document.getElementById('scpToggleFace')?.addEventListener('click',async()=>{
      if(localStorage.getItem(ENABLED_KEY)==='1'){
        if(confirm('Desativar o bloqueio por Face ID?')){localStorage.removeItem(ENABLED_KEY);localStorage.removeItem(CREDENTIAL_KEY);alert('Face ID desativado.');fecharPainel();}
      }else if(await cadastrarFaceId()){fecharPainel();}
    });
  }

  function criarBotao(){
    if(document.getElementById('scpSecurityTools')) return;
    const tools=document.createElement('div');tools.id='scpSecurityTools';tools.className='scp-security-tools';
    tools.innerHTML='<button type="button" class="scp-security-button" id="scpSecurityButton" aria-label="Segurança e atualização" title="Segurança e atualização">⚙️</button>';
    document.body.appendChild(tools);
    document.getElementById('scpSecurityButton')?.addEventListener('click',abrirPainel);
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&localStorage.getItem(ENABLED_KEY)==='1') mostrarBloqueio();
  });

  document.addEventListener('DOMContentLoaded',()=>{
    criarEstilo();criarBotao();
    if(localStorage.getItem(ENABLED_KEY)==='1') mostrarBloqueio();
  });
})();
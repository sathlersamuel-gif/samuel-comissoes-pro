(function(){
  'use strict';

  const CURRENT_VERSION='1.1.0';
  const ENABLED_KEY='scp_faceid_enabled';
  const CREDENTIAL_KEY='scp_faceid_credential';
  const USER_KEY='scp_faceid_user';
  const MODO_KEY='controle_vendas_modo_tela';
  const MODOS=['automatico','celular','computador'];

  function bytesToBase64Url(bytes){let binary='';new Uint8Array(bytes).forEach(byte=>binary+=String.fromCharCode(byte));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function base64UrlToBytes(value){const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');const padded=normalized+'='.repeat((4-normalized.length%4)%4);const binary=atob(padded);return Uint8Array.from(binary,char=>char.charCodeAt(0));}
  function randomBytes(size=32){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytes;}
  function suportado(){return window.isSecureContext&&'PublicKeyCredential'in window&&navigator.credentials;}
  async function autenticadorDisponivel(){if(!suportado())return false;try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch{return false;}}
  function modoAtual(){const modo=window.SCPModoVisualizacao?.obter?.()||localStorage.getItem(MODO_KEY);return MODOS.includes(modo)?modo:'automatico';}
  function aplicarModo(modo){if(!MODOS.includes(modo))return;if(window.SCPModoVisualizacao?.aplicar)window.SCPModoVisualizacao.aplicar(modo);else{localStorage.setItem(MODO_KEY,modo);document.body.classList.remove('modo-automatico','modo-celular','modo-computador');document.body.classList.add('modo-'+modo);document.documentElement.dataset.modoTela=modo;}}

  function compararVersoes(a,b){const pa=String(a).split('.').map(Number),pb=String(b).split('.').map(Number);for(let i=0;i<Math.max(pa.length,pb.length);i++){const x=pa[i]||0,y=pb[i]||0;if(x>y)return 1;if(x<y)return-1;}return 0;}

  function criarEstilo(){
    if(document.getElementById('scpSecurityStyle'))return;
    const style=document.createElement('style');style.id='scpSecurityStyle';
    style.textContent=`#firebaseUserBar #btnSairFirebase{margin-left:auto}.scp-security-tools{position:static;flex:0 0 auto;display:flex;align-items:center}.scp-security-button{width:48px;height:48px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:#0b2a5a;color:#fff;box-shadow:0 9px 24px rgba(0,0,0,.28);font-size:21px;display:grid;place-items:center;padding:0}.scp-security-panel{position:fixed;inset:0;z-index:19000;background:rgba(1,9,22,.78);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom));overflow:hidden}.scp-security-card{box-sizing:border-box;width:min(100%,430px);max-width:430px;max-height:calc(100dvh - max(24px,env(safe-area-inset-top)) - max(24px,env(safe-area-inset-bottom)));overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#0a1d35;border:1px solid #234b79;border-radius:24px;padding:18px;color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.45)}.scp-security-card h2{margin:0 0 6px;font-size:21px}.scp-security-card p{margin:0 0 13px;color:#aec0d8;line-height:1.35;font-size:14px}.scp-security-card button{box-sizing:border-box;width:100%;min-height:46px;margin-top:8px}.scp-security-card .secundario{background:#172b45;color:#fff}.scp-config-section{margin:15px 0 12px;padding-top:14px;border-top:1px solid rgba(174,192,216,.2)}.scp-config-section h3{margin:0 0 9px;font-size:16px}.scp-view-options{display:grid;gap:7px}.scp-view-option{box-sizing:border-box;width:100%;min-width:0;display:flex;align-items:center;gap:10px;border:1px solid #31577f;border-radius:14px;padding:10px 12px;background:#102945;color:#fff;cursor:pointer}.scp-view-option:has(input:checked){border-color:#2d8cff;background:#123965;box-shadow:0 0 0 1px rgba(45,140,255,.22)}.scp-view-option input{flex:0 0 18px;width:18px;height:18px;margin:0;accent-color:#2d8cff}.scp-view-option span{min-width:0;font-weight:700;font-size:14px;line-height:1.25}.scp-lock{position:fixed;inset:0;z-index:25000;background:linear-gradient(160deg,#061326,#0b2a5a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:28px}.scp-lock-icon{width:94px;height:94px;border-radius:28px;background:#d90429;display:grid;place-items:center;font-size:45px}.scp-lock button{max-width:320px;width:100%}@media(max-width:480px){.scp-security-panel{padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))}.scp-security-card{width:100%;max-height:calc(100dvh - max(20px,env(safe-area-inset-top)) - max(20px,env(safe-area-inset-bottom)));border-radius:20px;padding:15px}.scp-security-card h2{font-size:19px}.scp-security-card p{font-size:13px;margin-bottom:10px}.scp-security-card button{min-height:42px;margin-top:7px}.scp-config-section{margin:12px 0 10px;padding-top:11px}.scp-view-option{padding:9px 10px}.scp-view-option span{font-size:13px}}@media(max-height:700px){.scp-security-card{padding:13px}.scp-security-card p{margin-bottom:8px;line-height:1.25}.scp-config-section{margin:10px 0 8px;padding-top:9px}.scp-view-options{gap:5px}.scp-view-option{padding:8px 10px}.scp-security-card button{min-height:40px;margin-top:6px}}`;
    document.head.appendChild(style);
  }

  async function cadastrarFaceId(){
    if(!(await autenticadorDisponivel())){alert('O Face ID não está disponível neste navegador ou aparelho. Abra o aplicativo instalado pela Tela de Início do iPhone.');return false;}
    try{
      let userId=localStorage.getItem(USER_KEY);if(!userId){userId=bytesToBase64Url(randomBytes(16));localStorage.setItem(USER_KEY,userId);}
      const credential=await navigator.credentials.create({publicKey:{challenge:randomBytes(32),rp:{name:'Samuel Comissões PRO',id:location.hostname},user:{id:base64UrlToBytes(userId),name:'samuel-comissoes',displayName:'Samuel Comissões PRO'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},timeout:60000,attestation:'none'}});
      if(!credential)return false;localStorage.setItem(CREDENTIAL_KEY,bytesToBase64Url(credential.rawId));localStorage.setItem(ENABLED_KEY,'1');alert('Face ID ativado com sucesso!');return true;
    }catch(error){if(error?.name!=='NotAllowedError')console.error(error);alert('Não foi possível ativar o Face ID. Tente novamente.');return false;}
  }

  async function autenticar(){
    const credentialId=localStorage.getItem(CREDENTIAL_KEY);if(!credentialId)return cadastrarFaceId();
    try{const assertion=await navigator.credentials.get({publicKey:{challenge:randomBytes(32),rpId:location.hostname,allowCredentials:[{type:'public-key',id:base64UrlToBytes(credentialId),transports:['internal']}],userVerification:'required',timeout:60000}});return Boolean(assertion);}catch(error){if(error?.name!=='NotAllowedError')console.error(error);return false;}
  }

  function mostrarBloqueio(){
    if(document.getElementById('scpFaceLock'))return;
    const lock=document.createElement('div');lock.id='scpFaceLock';lock.className='scp-lock';lock.innerHTML='<div class="scp-lock-icon">🔒</div><h1>Samuel Comissões PRO</h1><p>Use o Face ID para acessar suas vendas e comissões.</p><button type="button" id="scpUnlockButton">Desbloquear com Face ID</button>';document.body.appendChild(lock);
    const desbloquear=async()=>{const button=document.getElementById('scpUnlockButton');if(button){button.disabled=true;button.textContent='Verificando...';}const ok=await autenticar();if(ok)lock.remove();else if(button){button.disabled=false;button.textContent='Tentar novamente';}};
    document.getElementById('scpUnlockButton')?.addEventListener('click',desbloquear);setTimeout(desbloquear,350);
  }

  async function verificarAtualizacao(){
    const botao=document.getElementById('scpUpdateApp');if(botao){botao.disabled=true;botao.textContent='Verificando nova versão...';}
    try{
      const resposta=await fetch(`version.json?t=${Date.now()}`,{cache:'no-store'});if(!resposta.ok)throw new Error('Versão indisponível');
      const info=await resposta.json();const nova=String(info.version||'');
      if(!nova||compararVersoes(nova,CURRENT_VERSION)<=0){alert(`Você já está usando a versão mais recente (${CURRENT_VERSION}).`);return;}
      if(!confirm(`Nova versão ${nova} disponível. Atualizar agora?\n\nSuas vendas e comissões serão mantidas.`))return;
      const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];
      await Promise.all(registrations.map(reg=>reg.update().catch(()=>{})));
      const controllerChange=new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve();};navigator.serviceWorker?.addEventListener?.('controllerchange',finish,{once:true});setTimeout(finish,2500);});
      registrations.forEach(reg=>reg.waiting?.postMessage?.({type:'SKIP_WAITING'}));
      await controllerChange;
      location.replace(`${location.pathname}?v=${encodeURIComponent(nova)}&t=${Date.now()}`);
    }catch(error){console.error(error);alert('Não foi possível verificar atualizações agora. Confira sua internet e tente novamente.');}
    finally{if(botao){botao.disabled=false;botao.textContent='🔄 Verificar nova versão';}}
  }

  function fecharPainel(){document.getElementById('scpSecurityPanel')?.remove();}
  function abrirPainel(){
    fecharPainel();const enabled=localStorage.getItem(ENABLED_KEY)==='1';const selecionado=modoAtual();const panel=document.createElement('div');panel.id='scpSecurityPanel';panel.className='scp-security-panel';panel.innerHTML=`<div class="scp-security-card"><h2>Segurança</h2><p>Use o Face ID para proteger o acesso às suas vendas e comissões.</p><button type="button" id="scpToggleFace">${enabled?'Desativar Face ID':'Ativar Face ID'}</button><section class="scp-config-section" aria-labelledby="scpViewTitle"><h3 id="scpViewTitle">Modo de visualização</h3><div class="scp-view-options"><label class="scp-view-option"><input type="radio" name="scpModoVisualizacao" value="automatico" ${selecionado==='automatico'?'checked':''}><span>Automático (Recomendado)</span></label><label class="scp-view-option"><input type="radio" name="scpModoVisualizacao" value="celular" ${selecionado==='celular'?'checked':''}><span>Celular</span></label><label class="scp-view-option"><input type="radio" name="scpModoVisualizacao" value="computador" ${selecionado==='computador'?'checked':''}><span>Computador</span></label></div></section><button type="button" id="scpCloseSecurity" class="secundario">Fechar</button></div>`;document.body.appendChild(panel);
    panel.addEventListener('click',event=>{if(event.target===panel)fecharPainel();});document.getElementById('scpCloseSecurity')?.addEventListener('click',fecharPainel);
    panel.querySelectorAll('input[name="scpModoVisualizacao"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)aplicarModo(input.value);}));
    document.getElementById('scpToggleFace')?.addEventListener('click',async()=>{if(localStorage.getItem(ENABLED_KEY)==='1'){if(confirm('Desativar o bloqueio por Face ID?')){localStorage.removeItem(ENABLED_KEY);localStorage.removeItem(CREDENTIAL_KEY);alert('Face ID desativado.');fecharPainel();}}else if(await cadastrarFaceId())fecharPainel();});
  }

  function criarBotao(){
    if(document.getElementById('scpSecurityTools'))return;
    const barra=document.getElementById('firebaseUserBar');
    if(!barra){setTimeout(criarBotao,100);return;}
    const tools=document.createElement('div');tools.id='scpSecurityTools';tools.className='scp-security-tools';tools.innerHTML='<button type="button" class="scp-security-button" id="scpSecurityButton" aria-label="Segurança" title="Segurança">⚙️</button>';
    barra.appendChild(tools);
    document.getElementById('scpSecurityButton')?.addEventListener('click',abrirPainel);
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&localStorage.getItem(ENABLED_KEY)==='1')mostrarBloqueio();});
  document.addEventListener('DOMContentLoaded',()=>{criarEstilo();criarBotao();if(localStorage.getItem(ENABLED_KEY)==='1')mostrarBloqueio();});
})();
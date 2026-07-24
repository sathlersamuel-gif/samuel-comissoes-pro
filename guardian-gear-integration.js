(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  const ACTIVE_KEY='scp_guardian_active_cache';
  const DEVICE_KEY='scp_guardian_device_id';
  let observer=null;
  let alterando=false;
  let sincronizacaoPendente=false;

  function firebaseAtual(){
    return window.firebase||null;
  }

  function usuarioAtual(){
    const fb=firebaseAtual();
    return window.SCPAuth?.getUser?.()||fb?.auth?.()?.currentUser||null;
  }

  function usuarioAdmin(){
    return String(usuarioAtual()?.email||'').toLowerCase()===ADMIN;
  }

  function limparAtalhosAntigos(){
    document.querySelectorAll('.guardia-nav-btn,.guardia-lancador').forEach(el=>el.remove());
  }

  function estadoAtual(){
    return localStorage.getItem(ACTIVE_KEY)==='1'||Boolean(window.SCPGuardian?.active);
  }

  function definirEstadoLocal(ativo){
    localStorage.setItem(ACTIVE_KEY,ativo?'1':'0');
    window.SCPGuardianEnabled=Boolean(ativo);
    const toggleInterno=document.getElementById('guardiaToggle');
    if(toggleInterno)toggleInterno.checked=Boolean(ativo);
  }

  function atualizarVisual(){
    const input=document.getElementById('scpGuardianGearToggle');
    const status=document.getElementById('scpGuardianGearStatus');
    const ativo=estadoAtual();
    if(input){
      input.checked=ativo;
      input.disabled=!usuarioAdmin()||alterando;
    }
    if(status){
      status.textContent=alterando
        ?'Aplicando alteração...'
        :ativo
          ?(sincronizacaoPendente?'Monitoramento ativo neste aparelho • sincronização pendente':'Monitoramento ativo')
          :'Monitoramento desativado';
    }
  }

  function idAparelho(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      id=(window.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function infoAparelho(){
    const ua=navigator.userAgent||'';
    return {
      sistema:/iPhone|iPad|iPod/i.test(ua)?'iOS':/Android/i.test(ua)?'Android':/Windows/i.test(ua)?'Windows':/Macintosh/i.test(ua)?'macOS':'Outro',
      largura:window.innerWidth||0,
      altura:window.innerHeight||0,
      online:navigator.onLine,
      userAgent:ua.slice(0,500)
    };
  }

  async function enviarSinal(){
    if(!estadoAtual()||!navigator.onLine)return false;
    const fb=firebaseAtual();
    const user=usuarioAtual();
    if(!fb?.apps?.length||!user)return false;
    try{
      const db=fb.firestore();
      const serverTime=fb.firestore.FieldValue.serverTimestamp();
      await db.collection('monitor_dispositivos').doc(idAparelho()).set({
        deviceId:idAparelho(),
        nome:localStorage.getItem('scp_guardian_device_name')||'iPhone de Samuel',
        uid:user.uid,
        email:user.email||'',
        ativo:true,
        online:true,
        visivel:document.visibilityState==='visible',
        info:infoAparelho(),
        pagina:location.pathname,
        versao:'guardia-1.1.0',
        ultimoSinalLocal:new Date().toISOString(),
        ultimoSinal:serverTime,
        atualizadoEm:serverTime
      },{merge:true});
      return true;
    }catch(error){
      console.warn('IA Guardiã: sinal será reenviado depois.',error);
      return false;
    }
  }

  async function salvarNoServidor(ativo){
    const fb=firebaseAtual();
    const user=usuarioAtual();
    if(!navigator.onLine||!fb?.apps?.length||!user)return false;
    try{
      await fb.firestore().collection('configuracoes').doc('ia_guardia').set({
        ativa:Boolean(ativo),
        alteradoPor:user.email||ADMIN,
        alteradoEm:fb.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      if(ativo)await enviarSinal();
      return true;
    }catch(error){
      console.warn('IA Guardiã: configuração mantida localmente.',error);
      return false;
    }
  }

  async function alternarGuardia(desejado){
    if(alterando)return;
    alterando=true;
    definirEstadoLocal(Boolean(desejado));
    atualizarVisual();

    const salvou=await salvarNoServidor(Boolean(desejado));
    sincronizacaoPendente=!salvou;
    alterando=false;
    atualizarVisual();

    if(desejado){
      enviarSinal();
      window.SCPGuardian?.diagnostic?.(false)?.catch?.(()=>{});
    }
  }

  async function tentarSincronizar(){
    if(!sincronizacaoPendente||alterando||!navigator.onLine)return;
    const salvou=await salvarNoServidor(estadoAtual());
    if(salvou){
      sincronizacaoPendente=false;
      atualizarVisual();
    }
  }

  function abrirRelatorios(){
    document.getElementById('scpSecurityPanel')?.remove();
    if(window.SCPGuardian?.open)window.SCPGuardian.open();
    else alert('Os relatórios da IA ainda estão carregando. Tente novamente em alguns segundos.');
  }

  function inserirNoPainel(){
    limparAtalhosAntigos();
    const card=document.querySelector('#scpSecurityPanel .scp-security-card');
    if(!card||document.getElementById('scpGuardianGearSection'))return;
    const fechar=document.getElementById('scpCloseSecurity');
    const section=document.createElement('section');
    section.id='scpGuardianGearSection';
    section.className='scp-config-section';
    section.style.cssText='width:100%;min-width:0;box-sizing:border-box;overflow:hidden';
    section.innerHTML=`
      <h3>IA Guardiã 24h</h3>
      <p id="scpGuardianGearStatus" style="margin:0 0 10px;line-height:1.35">Monitoramento desativado</p>
      <label class="scp-view-option" style="display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important">
        <span style="display:block!important;flex:1 1 auto!important;width:auto!important;min-width:0!important;max-width:none!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;line-height:1.35!important;text-align:left!important">Ativar monitoramento dos aparelhos</span>
        <input id="scpGuardianGearToggle" type="checkbox" style="display:block!important;flex:0 0 24px!important;width:24px!important;height:24px!important;min-width:24px!important;margin:0!important">
      </label>
      <button type="button" id="scpGuardianGearReports" class="secundario">✦ Abrir relatórios da IA</button>
    `;
    if(fechar)card.insertBefore(section,fechar);else card.appendChild(section);
    document.getElementById('scpGuardianGearToggle')?.addEventListener('change',event=>{
      if(!usuarioAdmin()){
        event.target.checked=estadoAtual();
        alert('Somente o administrador pode ativar ou desativar a IA Guardiã.');
        return;
      }
      alternarGuardia(event.target.checked);
    });
    document.getElementById('scpGuardianGearReports')?.addEventListener('click',abrirRelatorios);
    atualizarVisual();
  }

  function iniciar(){
    limparAtalhosAntigos();
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#scpSecurityButton'))setTimeout(inserirNoPainel,0);
    },true);
    observer=new MutationObserver(()=>{
      limparAtalhosAntigos();
      if(document.getElementById('scpSecurityPanel'))inserirNoPainel();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('online',()=>{tentarSincronizar();enviarSinal();});
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible'){tentarSincronizar();enviarSinal();}
    });
    setInterval(()=>{
      limparAtalhosAntigos();
      atualizarVisual();
      tentarSincronizar();
      enviarSinal();
    },3*60*1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
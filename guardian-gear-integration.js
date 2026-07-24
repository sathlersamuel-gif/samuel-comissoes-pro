(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  let observer=null;
  let alterando=false;

  function firebaseAtual(){
    return window.firebase||null;
  }

  function usuarioAdmin(){
    const fb=firebaseAtual();
    const email=String(window.SCPAuth?.getUser?.()?.email||fb?.auth?.()?.currentUser?.email||'').toLowerCase();
    return email===ADMIN;
  }

  function limparAtalhosAntigos(){
    document.querySelectorAll('.guardia-nav-btn,.guardia-lancador').forEach(el=>el.remove());
  }

  function estadoAtual(){
    return Boolean(window.SCPGuardian?.active||localStorage.getItem('scp_guardian_active_cache')==='1');
  }

  function atualizarVisual(){
    const input=document.getElementById('scpGuardianGearToggle');
    const status=document.getElementById('scpGuardianGearStatus');
    const ativo=estadoAtual();
    if(input){input.checked=ativo;input.disabled=!usuarioAdmin()||alterando;}
    if(status)status.textContent=alterando?'Aplicando alteração...':ativo?'Monitoramento ativo':'Monitoramento desativado';
  }

  function aguardarModuloPronto(limiteMs=12000){
    return new Promise(resolve=>{
      const inicio=Date.now();
      const verificar=()=>{
        const fb=firebaseAtual();
        const toggle=document.getElementById('guardiaToggle');
        const pronto=Boolean(toggle&&window.SCPGuardian&&fb?.apps?.length&&fb?.auth?.()?.currentUser);
        if(pronto)return resolve(toggle);
        if(Date.now()-inicio>=limiteMs)return resolve(null);
        setTimeout(verificar,250);
      };
      verificar();
    });
  }

  async function alternarPeloModulo(desejado){
    if(alterando)return;
    alterando=true;
    atualizarVisual();
    const toggle=await aguardarModuloPronto();
    if(!toggle){
      alterando=false;
      atualizarVisual();
      alert('A IA Guardiã ainda está carregando. Aguarde alguns segundos e tente novamente.');
      return;
    }
    toggle.checked=Boolean(desejado);
    toggle.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(()=>{
      alterando=false;
      atualizarVisual();
    },1200);
  }

  function abrirRelatorios(){
    document.getElementById('scpSecurityPanel')?.remove();
    if(window.SCPGuardian?.open) window.SCPGuardian.open();
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
    section.innerHTML=`
      <h3>IA Guardiã 24h</h3>
      <p id="scpGuardianGearStatus" style="margin:0 0 10px">Monitoramento desativado</p>
      <label class="scp-view-option" style="display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;gap:14px;width:100%;justify-content:initial">
        <span style="min-width:0;white-space:normal;word-break:normal;overflow-wrap:normal;line-height:1.35">Ativar monitoramento dos aparelhos</span>
        <input id="scpGuardianGearToggle" type="checkbox" style="width:22px;height:22px;margin:0;justify-self:end;flex:none">
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
      alternarPeloModulo(event.target.checked);
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
    window.addEventListener('scp-security-tools-ready',limparAtalhosAntigos);
    setInterval(()=>{limparAtalhosAntigos();atualizarVisual();},3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
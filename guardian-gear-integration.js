(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  let observer=null;

  function usuarioAdmin(){
    const email=String(window.SCPAuth?.getUser?.()?.email||firebase?.auth?.()?.currentUser?.email||'').toLowerCase();
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
    if(input){input.checked=ativo;input.disabled=!usuarioAdmin();}
    if(status)status.textContent=ativo?'Monitoramento ativo':'Monitoramento desativado';
  }

  function alternarPeloModulo(desejado){
    const toggle=document.getElementById('guardiaToggle');
    if(!toggle){
      alert('A IA Guardiã ainda está carregando. Feche a engrenagem e tente novamente em alguns segundos.');
      atualizarVisual();
      return;
    }
    toggle.checked=Boolean(desejado);
    toggle.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(atualizarVisual,500);
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
      <label class="scp-view-option" style="justify-content:space-between">
        <span>Ativar monitoramento dos aparelhos</span>
        <input id="scpGuardianGearToggle" type="checkbox" style="width:22px;height:22px">
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
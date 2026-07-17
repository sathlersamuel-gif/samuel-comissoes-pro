(function(){
  'use strict';
  const KEY='scp_tema_visual';
  const VALIDOS=['escuro','claro'];

  function temaAtual(){
    const salvo=localStorage.getItem(KEY);
    return VALIDOS.includes(salvo)?salvo:'escuro';
  }

  function aplicarTema(tema){
    const escolhido=VALIDOS.includes(tema)?tema:'escuro';
    localStorage.setItem(KEY,escolhido);
    document.documentElement.dataset.scpTheme=escolhido;
    document.body?.setAttribute('data-scp-theme',escolhido);
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',escolhido==='claro'?'#f3f6fb':'#061326');
    document.querySelectorAll('input[name="scpTemaVisual"]').forEach(input=>{input.checked=input.value===escolhido;});
  }

  function criarEstilos(){
    if(document.getElementById('scpThemeSettingsStyle')) return;
    const style=document.createElement('style');
    style.id='scpThemeSettingsStyle';
    style.textContent=`
      html,body{transition:background-color .2s ease,color .2s ease}
      #painelUsuarios{background:#061326!important;color:#fff!important}
      #painelUsuarios .painel-topo{background:rgba(6,19,38,.96)!important}
      #painelUsuarios .painel-topo h2{color:#fff!important}
      #painelUsuarios .usuario-card.moderno,#painelUsuarios .usuarios-resumo-card{background:#0a1d35!important;border-color:#234b79!important;box-shadow:0 10px 28px rgba(0,0,0,.28)!important}
      #painelUsuarios .usuario-email,#painelUsuarios .usuarios-resumo-card strong,#painelUsuarios .usuario-info strong{color:#fff!important}
      #painelUsuarios .usuario-subtexto,#painelUsuarios .usuarios-resumo-card span,#painelUsuarios .usuario-info span,#painelUsuarios .usuario-progresso-topo{color:#aec0d8!important}
      #painelUsuarios .usuario-info{background:#102945!important}
      #painelUsuarios .usuarios-filtro{background:#102945!important;border-color:#31577f!important;color:#dce9f8!important}
      #painelUsuarios .usuarios-filtro.ativo{background:#0877ff!important;border-color:#0877ff!important;color:#fff!important}
      #painelUsuarios .usuario-progresso-barra{background:#203a5b!important}
      #modalPrazoUsuario .modal-card{background:#0a1d35!important;border:1px solid #234b79!important;color:#fff!important}
      #modalPrazoUsuario h3,#modalPrazoUsuario .modal-campo label{color:#fff!important}
      #modalPrazoUsuario .modal-email{color:#aec0d8!important}
      #modalPrazoUsuario input,#modalPrazoUsuario select{background:#102945!important;border-color:#31577f!important;color:#fff!important}

      body[data-scp-theme="claro"]{background:#f3f6fb!important;color:#172b4d!important}
      body[data-scp-theme="claro"] main,body[data-scp-theme="claro"] .tela{background:#f3f6fb!important;color:#172b4d!important}
      body[data-scp-theme="claro"] .topo,body[data-scp-theme="claro"] .bottom,body[data-scp-theme="claro"] #firebaseUserBar{background:#fff!important;color:#172b4d!important;border-color:#dce5f1!important}
      body[data-scp-theme="claro"] .card,body[data-scp-theme="claro"] .tipo-card,body[data-scp-theme="claro"] .menu button,body[data-scp-theme="claro"] form,body[data-scp-theme="claro"] #resultadoRelatorio,body[data-scp-theme="claro"] #listaMeses>*,body[data-scp-theme="claro"] #listaVendasMes>*{background:#fff!important;color:#172b4d!important;border-color:#dce5f1!important;box-shadow:0 8px 24px rgba(18,49,93,.08)!important}
      body[data-scp-theme="claro"] h1,body[data-scp-theme="claro"] h2,body[data-scp-theme="claro"] h3,body[data-scp-theme="claro"] strong,body[data-scp-theme="claro"] label{color:#172b4d!important}
      body[data-scp-theme="claro"] p,body[data-scp-theme="claro"] small,body[data-scp-theme="claro"] .texto-apoio{color:#65748a!important}
      body[data-scp-theme="claro"] input,body[data-scp-theme="claro"] select,body[data-scp-theme="claro"] textarea{background:#fff!important;color:#172b4d!important;border-color:#cfd9e7!important}
      body[data-scp-theme="claro"] .scp-security-panel{background:rgba(18,35,58,.45)!important}
      body[data-scp-theme="claro"] .scp-security-card{background:#fff!important;border-color:#d8e2ef!important;color:#172b4d!important}
      body[data-scp-theme="claro"] .scp-security-card h2,body[data-scp-theme="claro"] .scp-security-card h3{color:#172b4d!important}
      body[data-scp-theme="claro"] .scp-security-card p{color:#65748a!important}
      body[data-scp-theme="claro"] .scp-view-option{background:#f4f7fb!important;border-color:#cfd9e7!important;color:#172b4d!important}
      body[data-scp-theme="claro"] .scp-view-option:has(input:checked){background:#e8f1ff!important;border-color:#2d8cff!important}
      body[data-scp-theme="claro"] #painelUsuarios{background:#f3f6fb!important;color:#172b4d!important}
      body[data-scp-theme="claro"] #painelUsuarios .painel-topo{background:rgba(243,246,251,.96)!important}
      body[data-scp-theme="claro"] #painelUsuarios .painel-topo h2{color:#172b4d!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-card.moderno,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card{background:#fff!important;border-color:#e0e8f3!important;box-shadow:0 10px 28px rgba(18,49,93,.08)!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-email,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card strong,body[data-scp-theme="claro"] #painelUsuarios .usuario-info strong{color:#172b4d!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-subtexto,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card span,body[data-scp-theme="claro"] #painelUsuarios .usuario-info span,body[data-scp-theme="claro"] #painelUsuarios .usuario-progresso-topo{color:#65748a!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-info{background:#f4f7fb!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuarios-filtro{background:#fff!important;border-color:#d8e1ef!important;color:#41506a!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuarios-filtro.ativo{background:#083b82!important;border-color:#083b82!important;color:#fff!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario .modal-card{background:#fff!important;border-color:#d8e2ef!important;color:#172b4d!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario h3,body[data-scp-theme="claro"] #modalPrazoUsuario .modal-campo label{color:#172b4d!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario .modal-email{color:#65748a!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario input,body[data-scp-theme="claro"] #modalPrazoUsuario select{background:#fff!important;border-color:#cfd9e7!important;color:#172b4d!important}
    `;
    document.head.appendChild(style);
  }

  function inserirOpcaoTema(){
    const card=document.querySelector('#scpSecurityPanel .scp-security-card');
    if(!card||card.querySelector('#scpThemeSection')) return;
    const fechar=card.querySelector('#scpCloseSecurity');
    const tema=temaAtual();
    const section=document.createElement('section');
    section.id='scpThemeSection';
    section.className='scp-config-section';
    section.innerHTML=`<h3>Tema do aplicativo</h3><div class="scp-view-options"><label class="scp-view-option"><input type="radio" name="scpTemaVisual" value="escuro" ${tema==='escuro'?'checked':''}><span>Escuro</span></label><label class="scp-view-option"><input type="radio" name="scpTemaVisual" value="claro" ${tema==='claro'?'checked':''}><span>Claro</span></label></div>`;
    card.insertBefore(section,fechar||null);
    section.querySelectorAll('input[name="scpTemaVisual"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked) aplicarTema(input.value);}));
  }

  function iniciar(){
    criarEstilos();
    aplicarTema(temaAtual());
    const observer=new MutationObserver(inserirOpcaoTema);
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',event=>{if(event.target.closest?.('#scpSecurityButton')) setTimeout(inserirOpcaoTema,50);},true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
(function(){
  'use strict';
  const KEY='scp_tema_visual';
  const VALIDOS=['escuro','claro'];
  const temaAtual=()=>VALIDOS.includes(localStorage.getItem(KEY))?localStorage.getItem(KEY):'escuro';

  function aplicarTema(tema){
    const escolhido=VALIDOS.includes(tema)?tema:'escuro';
    localStorage.setItem(KEY,escolhido);
    document.documentElement.dataset.scpTheme=escolhido;
    document.body?.setAttribute('data-scp-theme',escolhido);
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',escolhido==='claro'?'#f6f8fc':'#061326');
    document.querySelectorAll('input[name="scpTemaVisual"]').forEach(i=>i.checked=i.value===escolhido);
  }

  function criarEstilos(){
    if(document.getElementById('scpThemeSettingsStyle'))return;
    const style=document.createElement('style');
    style.id='scpThemeSettingsStyle';
    style.textContent=`
      html,body{transition:background-color .2s ease,color .2s ease}

      #painelUsuarios{background:#061326!important;color:#fff!important}
      #painelUsuarios .painel-topo{background:rgba(6,19,38,.96)!important}
      #painelUsuarios .painel-topo h2{color:#fff!important}
      #painelUsuarios .usuario-card.moderno,#painelUsuarios .usuarios-resumo-card,#painelUsuarios .usage-card,#painelUsuarios .usage-kpi{background:#0a1d35!important;border-color:#234b79!important;box-shadow:0 10px 28px rgba(0,0,0,.28)!important}
      #painelUsuarios .usuario-email,#painelUsuarios .usuarios-resumo-card strong,#painelUsuarios .usuario-info strong,#painelUsuarios .usage-email,#painelUsuarios .usage-kpi strong,#painelUsuarios .usage-info strong{color:#fff!important}
      #painelUsuarios .usuario-subtexto,#painelUsuarios .usuarios-resumo-card span,#painelUsuarios .usuario-info span,#painelUsuarios .usuario-progresso-topo,#painelUsuarios .usage-card small,#painelUsuarios .usage-kpi span,#painelUsuarios .usage-info span,#painelUsuarios .usage-line{color:#aec0d8!important}
      #painelUsuarios .usuario-info,#painelUsuarios .usage-info{background:#102945!important}
      #painelUsuarios .usuarios-filtro{background:#102945!important;border-color:#31577f!important;color:#dce9f8!important}
      #painelUsuarios .usuarios-filtro.ativo{background:#0877ff!important;border-color:#0877ff!important;color:#fff!important}
      #modalPrazoUsuario .modal-card{background:#0a1d35!important;border:1px solid #234b79!important;color:#fff!important}
      #modalPrazoUsuario h3,#modalPrazoUsuario .modal-campo label{color:#fff!important}
      #modalPrazoUsuario .modal-email{color:#aec0d8!important}
      #modalPrazoUsuario input,#modalPrazoUsuario select{background:#102945!important;border-color:#31577f!important;color:#fff!important}

      body[data-scp-theme="claro"]{background:#f6f8fc!important;color:#172033!important}
      body[data-scp-theme="claro"] main,body[data-scp-theme="claro"] .tela{background:#f6f8fc!important;color:#172033!important}
      body[data-scp-theme="claro"] #dashboard{background:#f6f8fc!important;color:#172033!important}
      body[data-scp-theme="claro"] .topo,body[data-scp-theme="claro"] .bottom,body[data-scp-theme="claro"] #firebaseUserBar{background:rgba(255,255,255,.97)!important;color:#172033!important;border-color:#dce4ef!important;box-shadow:0 6px 22px rgba(30,55,90,.08)!important}
      body[data-scp-theme="claro"] #firebaseUserBar{border:1px solid #dce4ef!important}
      body[data-scp-theme="claro"] #firebaseUserBar *:not(button){color:#172033!important}
      body[data-scp-theme="claro"] .bottom button{color:#68758a!important;background:transparent!important}
      body[data-scp-theme="claro"] .bottom button:first-child{color:#176ff2!important}

      body[data-scp-theme="claro"] .perfil-topo,body[data-scp-theme="claro"] .perfil-boas-vindas{background:#fff!important;border-color:#dce4ef!important;box-shadow:0 8px 24px rgba(30,55,90,.08)!important}
      body[data-scp-theme="claro"] .nome-editavel,body[data-scp-theme="claro"] .nome-editavel h1,body[data-scp-theme="claro"] .nome-editavel strong,body[data-scp-theme="claro"] #nomePerfil{color:#172033!important}
      body[data-scp-theme="claro"] .perfil-topo small,body[data-scp-theme="claro"] .perfil-textos p{color:#66758b!important}
      body[data-scp-theme="claro"] .perfil-boas-vindas .data-hoje{background:#eef5ff!important;border-color:#c8dcff!important;color:#176ff2!important}
      body[data-scp-theme="claro"] .marca-dashboard h1{color:#121a2a!important}
      body[data-scp-theme="claro"] .marca-dashboard p{color:#176ff2!important}

      body[data-scp-theme="claro"] .painel-card,body[data-scp-theme="claro"] .card,body[data-scp-theme="claro"] form,body[data-scp-theme="claro"] #resultadoRelatorio,body[data-scp-theme="claro"] #listaMeses>*,body[data-scp-theme="claro"] #listaVendasMes>*{background:#fff!important;color:#172033!important;border-color:#dce4ef!important;box-shadow:0 8px 24px rgba(30,55,90,.08)!important}
      body[data-scp-theme="claro"] h1,body[data-scp-theme="claro"] h2,body[data-scp-theme="claro"] h3,body[data-scp-theme="claro"] strong,body[data-scp-theme="claro"] label{color:#172033!important}
      body[data-scp-theme="claro"] p,body[data-scp-theme="claro"] small,body[data-scp-theme="claro"] .texto-apoio{color:#66758b!important}
      body[data-scp-theme="claro"] input,body[data-scp-theme="claro"] select,body[data-scp-theme="claro"] textarea{background:#fff!important;color:#172033!important;border-color:#cfd9e7!important}
      body[data-scp-theme="claro"] input::placeholder,body[data-scp-theme="claro"] textarea::placeholder{color:#8b97a8!important}

      body[data-scp-theme="claro"] .resumo-item{box-shadow:none!important}
      body[data-scp-theme="claro"] .resumo-item small{color:#445168!important}
      body[data-scp-theme="claro"] .azul-card{background:#f4f8ff!important;border-color:#77b3ff!important;color:#126fe8!important}
      body[data-scp-theme="claro"] .verde-card{background:#f2fbf5!important;border-color:#72d695!important;color:#159447!important}
      body[data-scp-theme="claro"] .roxo-card{background:#faf5ff!important;border-color:#c894f0!important;color:#9849d9!important}
      body[data-scp-theme="claro"] .roxo-card button{background:#fff!important;border-color:#c9a7e6!important;color:#176ff2!important}
      body[data-scp-theme="claro"] .resumo-item strong{color:inherit!important}
      body[data-scp-theme="claro"] .media-box{border-color:#dce4ef!important}
      body[data-scp-theme="claro"] .media-box small,body[data-scp-theme="claro"] .media-box span{color:#5e6d82!important}
      body[data-scp-theme="claro"] .positivo{background:#e5f8eb!important;color:#168944!important}
      body[data-scp-theme="claro"] .negativo{background:#ffebee!important;color:#c52a3a!important}
      body[data-scp-theme="claro"] .g-grade{stroke:#dfe6ef!important}
      body[data-scp-theme="claro"] .g-linha{stroke:#176ff2!important}
      body[data-scp-theme="claro"] .g-ponto{fill:#fff!important;stroke:#176ff2!important}
      body[data-scp-theme="claro"] .g-num{fill:#273449!important}
      body[data-scp-theme="claro"] .g-mes{fill:#65748a!important}

      body[data-scp-theme="claro"] .tipo-card{background:#f7faff!important;border-color:#77b3ff!important;color:#126fe8!important;box-shadow:none!important}
      body[data-scp-theme="claro"] .tipo-card.financiamento{background:#f3fbf5!important;border-color:#72d695!important;color:#159447!important}
      body[data-scp-theme="claro"] .tipo-card.avista{background:#fff8f2!important;border-color:#f4ad70!important;color:#e96b12!important}
      body[data-scp-theme="claro"] .tipo-card.cartao{background:#fffcef!important;border-color:#e4c94f!important;color:#b89400!important}
      body[data-scp-theme="claro"] .tipo-card .qtd{color:#172033!important}
      body[data-scp-theme="claro"] .tipo-card small{color:#5f6d80!important}
      body[data-scp-theme="claro"] .tipo-icone{background:rgba(255,255,255,.8)!important}
      body[data-scp-theme="claro"] .tipo-imprimir{background:#fff!important}

      body[data-scp-theme="claro"] .acoes-grid button,body[data-scp-theme="claro"] .menu button{background:#fff!important;color:#172033!important;border-color:#dce4ef!important;box-shadow:0 5px 16px rgba(30,55,90,.06)!important}
      body[data-scp-theme="claro"] .acoes-grid button small{color:#7b8798!important}
      body[data-scp-theme="claro"] .nova-venda-flutuante{background:linear-gradient(#268cff,#0d5fdf)!important;border-color:#79b8ff!important;box-shadow:0 10px 24px rgba(25,105,225,.28)!important}
      body[data-scp-theme="claro"] .nova-venda-flutuante small{color:#176ff2!important}

      body[data-scp-theme="claro"] .scp-security-panel{background:rgba(35,48,70,.32)!important}
      body[data-scp-theme="claro"] .scp-security-card{background:#fff!important;border-color:#d8e2ef!important;color:#172033!important}
      body[data-scp-theme="claro"] .scp-security-card h2,body[data-scp-theme="claro"] .scp-security-card h3{color:#172033!important}
      body[data-scp-theme="claro"] .scp-security-card p{color:#66758b!important}
      body[data-scp-theme="claro"] .scp-view-option{background:#f7f9fc!important;border-color:#d5deea!important;color:#172033!important}
      body[data-scp-theme="claro"] .scp-view-option:has(input:checked){background:#edf4ff!important;border-color:#2d8cff!important}

      body[data-scp-theme="claro"] #painelUsuarios{background:#f6f8fc!important;color:#172033!important}
      body[data-scp-theme="claro"] #painelUsuarios .painel-topo{background:rgba(246,248,252,.97)!important}
      body[data-scp-theme="claro"] #painelUsuarios .painel-topo h2{color:#172033!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-card.moderno,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card,body[data-scp-theme="claro"] #painelUsuarios .usage-card,body[data-scp-theme="claro"] #painelUsuarios .usage-kpi{background:#fff!important;border-color:#dfe6ef!important;box-shadow:0 8px 24px rgba(30,55,90,.08)!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-email,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card strong,body[data-scp-theme="claro"] #painelUsuarios .usuario-info strong,body[data-scp-theme="claro"] #painelUsuarios .usage-email,body[data-scp-theme="claro"] #painelUsuarios .usage-kpi strong,body[data-scp-theme="claro"] #painelUsuarios .usage-info strong{color:#172033!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-subtexto,body[data-scp-theme="claro"] #painelUsuarios .usuarios-resumo-card span,body[data-scp-theme="claro"] #painelUsuarios .usuario-info span,body[data-scp-theme="claro"] #painelUsuarios .usuario-progresso-topo,body[data-scp-theme="claro"] #painelUsuarios .usage-card small,body[data-scp-theme="claro"] #painelUsuarios .usage-kpi span,body[data-scp-theme="claro"] #painelUsuarios .usage-info span,body[data-scp-theme="claro"] #painelUsuarios .usage-line{color:#66758b!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuario-info,body[data-scp-theme="claro"] #painelUsuarios .usage-info{background:#f5f7fa!important}
      body[data-scp-theme="claro"] #painelUsuarios .usage-bar,body[data-scp-theme="claro"] #painelUsuarios .usuario-progresso-barra{background:#e7ecf3!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuarios-filtro{background:#fff!important;border-color:#d8e1ef!important;color:#41506a!important}
      body[data-scp-theme="claro"] #painelUsuarios .usuarios-filtro.ativo{background:#176ff2!important;border-color:#176ff2!important;color:#fff!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario .modal-card{background:#fff!important;border-color:#d8e2ef!important;color:#172033!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario h3,body[data-scp-theme="claro"] #modalPrazoUsuario .modal-campo label{color:#172033!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario .modal-email{color:#66758b!important}
      body[data-scp-theme="claro"] #modalPrazoUsuario input,body[data-scp-theme="claro"] #modalPrazoUsuario select{background:#fff!important;border-color:#cfd9e7!important;color:#172033!important}

      @media(min-width:700px){
        body[data-scp-theme="claro"] #dashboard{box-shadow:0 0 0 1px #e2e8f0,0 16px 50px rgba(30,55,90,.08)!important}
      }
    `;
    document.head.appendChild(style);
  }

  function inserirOpcaoTema(){
    const card=document.querySelector('#scpSecurityPanel .scp-security-card');
    if(!card||card.querySelector('#scpThemeSection'))return;
    const fechar=card.querySelector('#scpCloseSecurity');
    const tema=temaAtual();
    const section=document.createElement('section');
    section.id='scpThemeSection';
    section.className='scp-config-section';
    section.innerHTML=`<h3>Tema do aplicativo</h3><div class="scp-view-options"><label class="scp-view-option"><input type="radio" name="scpTemaVisual" value="escuro" ${tema==='escuro'?'checked':''}><span>Escuro</span></label><label class="scp-view-option"><input type="radio" name="scpTemaVisual" value="claro" ${tema==='claro'?'checked':''}><span>Claro</span></label></div>`;
    card.insertBefore(section,fechar||null);
    section.querySelectorAll('input[name="scpTemaVisual"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)aplicarTema(input.value);}));
  }

  function iniciar(){
    criarEstilos();
    aplicarTema(temaAtual());
    const observer=new MutationObserver(inserirOpcaoTema);
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest?.('#scpSecurityButton'))setTimeout(inserirOpcaoTema,50);},true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
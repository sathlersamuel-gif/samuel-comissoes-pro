(function(){
  'use strict';

  const VERSION='2026.07.21.6';
  let termo='';
  let status='todos';
  let aplicando=false;

  function instalarEstilos(){
    if(document.getElementById('scpGestaoModernaV2Styles'))return;
    const style=document.createElement('style');
    style.id='scpGestaoModernaV2Styles';
    style.textContent=`
      #painelUsuarios{background:#061326!important}
      #painelUsuarios .painel-conteudo{max-width:980px!important;padding:18px 16px 40px!important}
      #painelUsuarios .painel-topo{position:sticky;top:0;z-index:5;background:rgba(6,19,38,.94)!important;backdrop-filter:blur(16px);padding:8px 0 14px!important}
      #painelUsuarios .painel-topo h2{color:#fff!important;font-size:clamp(25px,6vw,34px)!important}
      #gestaoUsuariosVersao{color:#7586a2!important}
      .usuarios-resumo{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;margin:10px 0 14px!important}
      .usuarios-resumo-card{background:#0b213d!important;border:1px solid #244d76!important;border-radius:18px!important;padding:14px!important;box-shadow:none!important}
      .usuarios-resumo-card span{color:#9fb1cb!important;font-size:11px!important}
      .usuarios-resumo-card strong{color:#fff!important;font-size:28px!important}
      .scp-gestao-toolbar{display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:10px;margin:0 0 12px}
      .scp-gestao-busca,.scp-gestao-status{width:100%;height:48px;border:1px solid #274d73;border-radius:14px;background:#0b213d;color:#fff;padding:0 15px;font-size:16px;outline:none}
      .scp-gestao-busca::placeholder{color:#8294ae}
      .scp-gestao-busca:focus,.scp-gestao-status:focus{border-color:#2f8cff;box-shadow:0 0 0 3px rgba(47,140,255,.16)}
      .usuarios-filtros{display:none!important}
      .usuario-card.moderno{background:#0a1d35!important;border:1px solid #244d76!important;border-radius:20px!important;padding:16px!important;margin:0 0 12px!important;box-shadow:none!important}
      .usuario-card.moderno::before{width:4px!important}
      .usuario-cabecalho{align-items:center!important;margin-bottom:12px!important}
      .usuario-email{color:#fff!important;font-size:17px!important;line-height:1.25!important}
      .usuario-subtexto{color:#9fb1cb!important}
      .status-chip{flex:0 0 auto;border-radius:999px!important;padding:7px 11px!important;font-size:12px!important;font-weight:900!important}
      .usuario-grade{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin:10px 0!important}
      .usuario-info{background:#102b4a!important;border:1px solid rgba(255,255,255,.04);border-radius:13px!important;padding:10px!important}
      .usuario-info span{color:#91a6c3!important;font-size:10px!important}
      .usuario-info strong{color:#fff!important;font-size:13px!important}
      .usuario-progresso-topo{color:#a8b8ce!important}
      .usuario-progresso-barra{background:#dce5f1!important}
      .usuario-acoes.modernas{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important;margin-top:13px!important}
      .usuario-acoes.modernas button{min-height:42px!important;border:0!important;border-radius:12px!important;padding:8px!important;font-size:12px!important;font-weight:900!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent}
      .usuario-acoes.modernas button:active{transform:scale(.97)!important}
      .scp-sem-resultados{padding:28px 16px;text-align:center;color:#a8b8ce;background:#0a1d35;border:1px solid #244d76;border-radius:18px}
      @media(max-width:720px){
        #painelUsuarios .painel-conteudo{padding:14px 12px 32px!important}
        .usuarios-resumo{grid-template-columns:repeat(2,1fr)!important}
        .scp-gestao-toolbar{grid-template-columns:1fr!important}
        .usuario-cabecalho{align-items:flex-start!important}
        .usuario-email{font-size:15px!important;max-width:72vw}
        .usuario-grade{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .usuario-info[style*="grid-column"]{grid-column:1/-1!important}
        .usuario-acoes.modernas{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .usuario-acoes.modernas .btn-excluir-novo{grid-column:1/-1!important}
      }
    `;
    document.head.appendChild(style);
  }

  function textoStatus(card){
    return String(card.querySelector('.status-chip')?.textContent||'').trim().toLowerCase();
  }

  function aplicarFiltro(){
    const lista=document.getElementById('listaUsuarios');
    if(!lista)return;
    const cards=[...lista.querySelectorAll('.usuario-card.moderno')];
    let visiveis=0;
    cards.forEach(card=>{
      const email=String(card.querySelector('.usuario-email')?.textContent||'').toLowerCase();
      const st=textoStatus(card);
      const bateTermo=!termo||email.includes(termo);
      const bateStatus=status==='todos'||st.includes(status);
      const mostrar=bateTermo&&bateStatus;
      card.style.display=mostrar?'':'none';
      if(mostrar)visiveis++;
    });
    let vazio=lista.querySelector('.scp-sem-resultados');
    if(!visiveis&&cards.length){
      if(!vazio){vazio=document.createElement('div');vazio.className='scp-sem-resultados';vazio.textContent='Nenhum usuário encontrado.';lista.appendChild(vazio);}
      vazio.style.display='block';
    }else if(vazio){vazio.style.display='none';}
  }

  function garantirToolbar(){
    const lista=document.getElementById('listaUsuarios');
    if(!lista||lista.querySelector('.scp-gestao-toolbar'))return;
    const resumo=lista.querySelector('.usuarios-resumo');
    if(!resumo)return;
    const barra=document.createElement('div');
    barra.className='scp-gestao-toolbar';
    barra.innerHTML=`<input class="scp-gestao-busca" type="search" inputmode="search" autocomplete="off" placeholder="Buscar usuário por e-mail..." aria-label="Buscar usuário por e-mail"><select class="scp-gestao-status" aria-label="Filtrar por status"><option value="todos">Todos os status</option><option value="ativo">Ativo</option><option value="teste">Em teste</option><option value="pendente">Pendente</option><option value="expirando">Expirando</option><option value="vencido">Vencido</option><option value="bloqueado">Bloqueado</option></select>`;
    resumo.insertAdjacentElement('afterend',barra);
    const busca=barra.querySelector('.scp-gestao-busca');
    const seletor=barra.querySelector('.scp-gestao-status');
    busca.value=termo;
    seletor.value=status;
    busca.addEventListener('input',()=>{termo=busca.value.trim().toLowerCase();aplicarFiltro();},{passive:true});
    seletor.addEventListener('change',()=>{status=seletor.value;aplicarFiltro();});
  }

  function organizar(){
    if(aplicando)return;
    aplicando=true;
    requestAnimationFrame(()=>{
      garantirToolbar();
      aplicarFiltro();
      document.querySelectorAll('#listaUsuarios [data-acao]').forEach(btn=>{
        btn.setAttribute('type','button');
        btn.style.touchAction='manipulation';
      });
      aplicando=false;
    });
  }

  function observar(){
    const lista=document.getElementById('listaUsuarios');
    if(!lista)return setTimeout(observar,250);
    new MutationObserver(organizar).observe(lista,{childList:true,subtree:true});
    organizar();
  }

  instalarEstilos();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar,{once:true});else observar();
  window.__SCP_USER_MANAGEMENT_MODERN__=VERSION;
})();
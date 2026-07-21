(function(){
  'use strict';
  if(window.__SCP_USER_MANAGEMENT_LOADER__)return;
  window.__SCP_USER_MANAGEMENT_LOADER__=true;
  function garantirBotaoInterno(){
    if(document.getElementById('adminUsuariosBtn'))return;
    const botao=document.createElement('button');
    botao.type='button';botao.id='adminUsuariosBtn';botao.hidden=true;botao.setAttribute('aria-hidden','true');document.body.appendChild(botao);
  }
  function garantirEstilo(){
    let link=document.getElementById('scpUserManagementReferenceCss');
    if(link)link.remove();
    link=document.createElement('link');
    link.id='scpUserManagementReferenceCss';
    link.rel='stylesheet';
    link.href='user-management-reference.css?v=1';
    document.head.appendChild(link);
  }
  function carregar(){
    garantirBotaoInterno();
    garantirEstilo();
    if(window.__SCP_USER_MANAGEMENT_UNIFIED__)return;
    if(document.querySelector('script[data-scp-user-management="1"]'))return;
    const script=document.createElement('script');
    script.src='user-management-unified.js?v=6';
    script.async=false;script.dataset.scpUserManagement='1';
    script.onerror=function(){const conteudo=document.getElementById('listaUsuarios')||document.getElementById('umConteudo');if(conteudo)conteudo.innerHTML='<p>Não foi possível carregar o Gerenciamento de Usuários.</p>'};
    document.body.appendChild(script);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',carregar,{once:true});else carregar();
})();
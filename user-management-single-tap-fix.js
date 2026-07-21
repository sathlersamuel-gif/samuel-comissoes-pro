(function(){
  'use strict';
  const VERSION='2026.07.21.12';
  const seletor='#painelUsuarios button,#painelUsuarios [role="button"],#modalPrazoUsuario button,#scpTentarUsuarios';

  function preparar(){
    document.querySelectorAll(seletor).forEach(botao=>{
      botao.style.touchAction='manipulation';
      botao.style.webkitTapHighlightColor='transparent';
      botao.style.pointerEvents='auto';
      botao.style.userSelect='none';
      botao.style.webkitUserSelect='none';
      if(!botao.getAttribute('type'))botao.setAttribute('type','button');
    });
  }

  function iniciar(){
    preparar();
    const observer=new MutationObserver(preparar);
    observer.observe(document.body,{childList:true,subtree:true});
    window.__SCP_USER_MANAGEMENT_SINGLE_TAP__=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
(function(){
  'use strict';
  const VERSION='2026.07.21.13';
  const SELETOR='#listaUsuarios button,#modalPrazoUsuario button,#fecharPainelUsuarios,#scpTentarUsuarios';
  const ultimoAcionamento=new WeakMap();

  function botaoDoAlvo(alvo){
    const botao=alvo?.closest?.(SELETOR);
    if(!botao||botao.disabled)return null;
    return botao;
  }

  function executarDireto(botao){
    const agora=Date.now();
    if(agora-(ultimoAcionamento.get(botao)||0)<700)return;
    ultimoAcionamento.set(botao,agora);

    if(botao.matches('[data-acao="excluir"]')&&typeof window.excluirUsuarioSCP==='function'){
      window.excluirUsuarioSCP(botao);
      return;
    }

    if(typeof botao.onclick==='function'){
      botao.onclick.call(botao,new MouseEvent('click',{bubbles:false,cancelable:true,view:window}));
      return;
    }

    const evento=new MouseEvent('click',{bubbles:true,cancelable:true,view:window});
    botao.dispatchEvent(evento);
  }

  document.addEventListener('touchend',evento=>{
    const botao=botaoDoAlvo(evento.target);
    if(!botao||evento.changedTouches.length!==1)return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    executarDireto(botao);
  },{capture:true,passive:false});

  document.addEventListener('click',evento=>{
    const botao=botaoDoAlvo(evento.target);
    if(!botao)return;
    const ultimo=ultimoAcionamento.get(botao)||0;
    if(Date.now()-ultimo<700){
      evento.preventDefault();
      evento.stopPropagation();
      evento.stopImmediatePropagation();
    }
  },true);

  function preparar(){
    document.querySelectorAll(SELETOR).forEach(botao=>{
      botao.style.touchAction='manipulation';
      botao.style.webkitTapHighlightColor='transparent';
      if(botao.tagName==='BUTTON'&&!botao.getAttribute('type'))botao.type='button';
    });
  }

  const observer=new MutationObserver(preparar);
  const iniciar=()=>{
    preparar();
    observer.observe(document.body,{childList:true,subtree:true});
    window.__SCP_USER_MANAGEMENT_DIRECT_TOUCH__=VERSION;
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
(function(){
  'use strict';
  const VERSION='2026.07.21.11';
  const seletor='#painelUsuarios button,#painelUsuarios [role="button"],#modalPrazoUsuario button,#scpTentarUsuarios';
  const inicioToque=new WeakMap();
  const cliquesGerados=new WeakSet();
  let ultimoToque=0;

  function botaoDoAlvo(alvo){
    const botao=alvo?.closest?.(seletor);
    if(!botao||botao.disabled)return null;
    return botao;
  }

  document.addEventListener('touchstart',evento=>{
    const botao=botaoDoAlvo(evento.target);
    if(!botao||evento.touches.length!==1)return;
    const toque=evento.touches[0];
    inicioToque.set(botao,{x:toque.clientX,y:toque.clientY,t:Date.now()});
    botao.style.webkitTapHighlightColor='transparent';
    botao.style.touchAction='manipulation';
  },{capture:true,passive:true});

  document.addEventListener('touchend',evento=>{
    const botao=botaoDoAlvo(evento.target);
    if(!botao)return;
    const inicio=inicioToque.get(botao);
    inicioToque.delete(botao);
    if(!inicio||!evento.changedTouches.length)return;
    const toque=evento.changedTouches[0];
    const movimento=Math.hypot(toque.clientX-inicio.x,toque.clientY-inicio.y);
    const duracao=Date.now()-inicio.t;
    if(movimento>14||duracao>900)return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    ultimoToque=Date.now();
    cliquesGerados.add(botao);
    requestAnimationFrame(()=>botao.click());
  },{capture:true,passive:false});

  document.addEventListener('click',evento=>{
    const botao=botaoDoAlvo(evento.target);
    if(!botao)return;
    if(cliquesGerados.has(botao)){
      cliquesGerados.delete(botao);
      return;
    }
    if(Date.now()-ultimoToque<750){
      evento.preventDefault();
      evento.stopPropagation();
      evento.stopImmediatePropagation();
    }
  },true);

  function preparar(){
    document.querySelectorAll(seletor).forEach(botao=>{
      botao.style.touchAction='manipulation';
      botao.style.webkitTapHighlightColor='transparent';
      botao.setAttribute('type',botao.getAttribute('type')||'button');
    });
  }

  const observer=new MutationObserver(preparar);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      preparar();
      observer.observe(document.body,{childList:true,subtree:true});
    },{once:true});
  }else{
    preparar();
    observer.observe(document.body,{childList:true,subtree:true});
  }

  window.__SCP_USER_MANAGEMENT_SINGLE_TAP__=VERSION;
})();
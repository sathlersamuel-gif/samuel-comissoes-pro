(function(){
  'use strict';

  const MOBILE_MAX=899;
  const CARD_PROPS=['min-height','height','display','flex-direction','align-items','justify-content','overflow'];
  const VALOR_PROPS=['display','align-items','justify-content','width','max-width','min-height','margin','font-size','line-height','letter-spacing','text-align','white-space','overflow','text-overflow'];

  function modoPermitido(){
    return document.body.classList.contains('modo-automatico') ||
           document.body.classList.contains('modo-celular');
  }

  function restaurarCardsNegociacao(){
    document.querySelectorAll('#dashboard .tipos-v2 .tipo-card').forEach(card=>{
      const numero=card.querySelector('.qtd');
      card.style.setProperty('min-height','0','important');
      card.style.setProperty('display','block','important');
      ['height','flex-direction','align-items','justify-content','overflow'].forEach(p=>card.style.removeProperty(p));
      if(numero){
        numero.style.setProperty('display','block','important');
        numero.style.setProperty('width','auto','important');
        numero.style.setProperty('min-height','0','important');
        numero.style.setProperty('margin','0','important');
        numero.style.setProperty('font-size','24px','important');
        numero.style.setProperty('line-height','normal','important');
        numero.style.setProperty('letter-spacing','normal','important');
        numero.style.setProperty('text-align','center','important');
        ['align-items','justify-content','flex','white-space','overflow','text-overflow','max-width'].forEach(p=>numero.style.removeProperty(p));
      }
    });
  }

  function restaurarCardResumo(card,valor){
    CARD_PROPS.forEach(p=>card.style.removeProperty(p));
    VALOR_PROPS.forEach(p=>valor.style.removeProperty(p));
  }

  function ajustarValor(valor){
    valor.style.setProperty('display','block','important');
    valor.style.setProperty('width','100%','important');
    valor.style.setProperty('max-width','100%','important');
    valor.style.setProperty('white-space','nowrap','important');
    valor.style.setProperty('overflow','visible','important');
    valor.style.setProperty('text-overflow','clip','important');
    valor.style.setProperty('text-align','center','important');
    valor.style.setProperty('line-height','1.1','important');
    valor.style.setProperty('letter-spacing','0','important');

    let tamanho=18;
    valor.style.setProperty('font-size',tamanho+'px','important');
    while(valor.scrollWidth>valor.clientWidth && tamanho>10){
      tamanho-=0.5;
      valor.style.setProperty('font-size',tamanho+'px','important');
    }
  }

  function aplicar(){
    restaurarCardsNegociacao();
    const ativo=window.innerWidth<=MOBILE_MAX && modoPermitido();

    document.querySelectorAll('#dashboard .resumo-v2 .resumo-item').forEach(card=>{
      const valor=card.querySelector('strong');
      if(!valor) return;
      restaurarCardResumo(card,valor);
      if(ativo) ajustarValor(valor);
    });
  }

  function iniciar(){
    aplicar();
    const dashboard=document.getElementById('dashboard');
    if(dashboard) new MutationObserver(aplicar).observe(dashboard,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',aplicar,{passive:true});
    document.addEventListener('scp:modo-visualizacao-alterado',aplicar);
    setTimeout(aplicar,100);
    setTimeout(aplicar,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
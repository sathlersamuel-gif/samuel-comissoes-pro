(function(){
  'use strict';

  const MOBILE_MAX=899;
  const PROPRIEDADES_ITEM=['min-height','display','flex-direction','align-items','justify-content'];
  const PROPRIEDADES_VALOR=['display','align-items','justify-content','width','min-height','margin','font-size','line-height','letter-spacing','text-align','white-space'];

  function modoPermitido(){
    return document.body.classList.contains('modo-automatico') ||
           document.body.classList.contains('modo-celular');
  }

  function restaurarCardsNegociacao(){
    document.querySelectorAll('#dashboard .tipos-v2 .tipo-card').forEach(card=>{
      const numero=card.querySelector('.qtd');
      card.style.setProperty('min-height','0','important');
      card.style.setProperty('display','block','important');
      card.style.removeProperty('flex-direction');
      card.style.removeProperty('align-items');
      card.style.removeProperty('justify-content');
      if(numero){
        numero.style.setProperty('display','block','important');
        numero.style.setProperty('width','auto','important');
        numero.style.setProperty('min-height','0','important');
        numero.style.setProperty('margin','0','important');
        numero.style.setProperty('font-size','24px','important');
        numero.style.setProperty('line-height','normal','important');
        numero.style.setProperty('letter-spacing','normal','important');
        numero.style.setProperty('text-align','center','important');
        numero.style.removeProperty('align-items');
        numero.style.removeProperty('justify-content');
        numero.style.removeProperty('flex');
        numero.style.removeProperty('white-space');
      }
    });
  }

  function aplicar(){
    restaurarCardsNegociacao();
    const ativo=window.innerWidth<=MOBILE_MAX && modoPermitido();

    document.querySelectorAll('#dashboard .resumo-v2 .resumo-item').forEach(card=>{
      const valor=card.querySelector('strong');
      if(!valor) return;

      if(ativo){
        card.style.setProperty('min-height','190px','important');
        card.style.setProperty('display','flex','important');
        card.style.setProperty('flex-direction','column','important');
        card.style.setProperty('align-items','center','important');
        card.style.setProperty('justify-content','center','important');

        valor.style.setProperty('display','flex','important');
        valor.style.setProperty('align-items','center','important');
        valor.style.setProperty('justify-content','center','important');
        valor.style.setProperty('width','100%','important');
        valor.style.setProperty('min-height','62px','important');
        valor.style.setProperty('margin','4px 0','important');
        valor.style.setProperty('font-size','clamp(22px,6.8vw,34px)','important');
        valor.style.setProperty('line-height','1.05','important');
        valor.style.setProperty('letter-spacing','-1px','important');
        valor.style.setProperty('text-align','center','important');
        valor.style.setProperty('white-space','nowrap','important');
      }else{
        PROPRIEDADES_ITEM.forEach(p=>card.style.removeProperty(p));
        PROPRIEDADES_VALOR.forEach(p=>valor.style.removeProperty(p));
      }
    });
  }

  function iniciar(){
    aplicar();
    const dashboard=document.getElementById('dashboard');
    if(dashboard) new MutationObserver(aplicar).observe(dashboard,{childList:true,subtree:true});
    window.addEventListener('resize',aplicar,{passive:true});
    document.addEventListener('scp:modo-visualizacao-alterado',aplicar);
    setTimeout(aplicar,100);
    setTimeout(aplicar,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
(function(){
  'use strict';

  const MOBILE_MAX=899;

  function modoPermitido(){
    return document.body.classList.contains('modo-automatico') ||
           document.body.classList.contains('modo-celular');
  }

  function aplicar(){
    const ativo=window.innerWidth<=MOBILE_MAX && modoPermitido();
    document.querySelectorAll('#dashboard .tipos-v2 .tipo-card').forEach(card=>{
      const numero=card.querySelector('.qtd');
      if(!numero) return;

      if(ativo){
        card.style.setProperty('min-height','246px','important');
        card.style.setProperty('display','flex','important');
        card.style.setProperty('flex-direction','column','important');
        card.style.setProperty('align-items','center','important');

        numero.style.setProperty('display','flex','important');
        numero.style.setProperty('align-items','center','important');
        numero.style.setProperty('justify-content','center','important');
        numero.style.setProperty('width','100%','important');
        numero.style.setProperty('min-height','88px','important');
        numero.style.setProperty('flex','1 1 88px','important');
        numero.style.setProperty('margin','2px 0 6px','important');
        numero.style.setProperty('font-size','clamp(54px,18vw,82px)','important');
        numero.style.setProperty('line-height','.9','important');
        numero.style.setProperty('letter-spacing','-3px','important');
        numero.style.setProperty('text-align','center','important');
      }else{
        ['min-height','display','flex-direction','align-items'].forEach(p=>card.style.removeProperty(p));
        ['display','align-items','justify-content','width','min-height','flex','margin','font-size','line-height','letter-spacing','text-align'].forEach(p=>numero.style.removeProperty(p));
      }
    });
  }

  function iniciar(){
    aplicar();
    const dashboard=document.getElementById('dashboard');
    if(dashboard){
      new MutationObserver(aplicar).observe(dashboard,{childList:true,subtree:true});
    }
    window.addEventListener('resize',aplicar,{passive:true});
    document.addEventListener('scp:modo-visualizacao-alterado',aplicar);
    setTimeout(aplicar,100);
    setTimeout(aplicar,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
(function(){
  'use strict';

  const nav=document.querySelector('.bottom');
  if(!nav)return;

  const LIMIAR=8;
  let ultimaPosicao=window.scrollY||0;
  let acumulado=0;
  let ultimaDirecao=0;
  let toqueY=null;
  let rafPendente=false;

  function mostrar(){nav.classList.remove('bottom-auto-hidden');}
  function esconder(){nav.classList.add('bottom-auto-hidden');}

  function aplicarDirecao(delta){
    if(Math.abs(delta)<1)return;
    const direcao=delta>0?1:-1;
    if(direcao!==ultimaDirecao){acumulado=0;ultimaDirecao=direcao;}
    acumulado+=Math.abs(delta);
    if(acumulado<LIMIAR)return;
    if(direcao>0)esconder();else mostrar();
    acumulado=0;
  }

  function tratarRolagem(){
    if(rafPendente)return;
    rafPendente=true;
    requestAnimationFrame(function(){
      const atual=window.scrollY||document.documentElement.scrollTop||0;
      if(atual<=4)mostrar();else aplicarDirecao(atual-ultimaPosicao);
      ultimaPosicao=Math.max(0,atual);
      rafPendente=false;
    });
  }

  window.addEventListener('scroll',tratarRolagem,{passive:true});
  window.addEventListener('wheel',function(e){aplicarDirecao(e.deltaY)},{passive:true});
  document.addEventListener('touchstart',function(e){if(e.touches&&e.touches.length)toqueY=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchmove',function(e){if(toqueY===null||!e.touches||!e.touches.length)return;const y=e.touches[0].clientY;aplicarDirecao(toqueY-y);toqueY=y;},{passive:true});
  document.addEventListener('touchend',function(){toqueY=null},{passive:true});
  document.addEventListener('touchcancel',function(){toqueY=null},{passive:true});
  nav.addEventListener('click',mostrar);
  document.addEventListener('focusin',function(e){if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))mostrar();});

  const abrirTelaOriginal=window.abrirTela;
  if(typeof abrirTelaOriginal==='function'){
    window.abrirTela=function(){mostrar();ultimaPosicao=0;return abrirTelaOriginal.apply(this,arguments);};
  }

  const voltarOriginal=window.voltarDashboard;
  if(typeof voltarOriginal==='function'){
    window.voltarDashboard=function(){mostrar();ultimaPosicao=0;return voltarOriginal.apply(this,arguments);};
  }

  mostrar();
  document.querySelectorAll('.guardia-nav-btn,.guardia-lancador').forEach(el=>el.remove());

  if(!document.querySelector('script[data-guardian-bridge]')){
    const bridge=document.createElement('script');
    bridge.src='guardian-firestore-bridge.js?v=1';
    bridge.dataset.guardianBridge='1';
    document.head.appendChild(bridge);
  }

  if(!document.querySelector('script[data-guardian-gear]')){
    const script=document.createElement('script');
    script.src='guardian-gear-integration.js?v=3';
    script.dataset.guardianGear='1';
    script.defer=true;
    document.head.appendChild(script);
  }

  if(!document.querySelector('script[data-guardian-audit]')){
    const audit=document.createElement('script');
    audit.src='guardian-audit-upgrade.js?v=1';
    audit.dataset.guardianAudit='1';
    audit.defer=true;
    document.head.appendChild(audit);
  }

  if(!document.querySelector('script[data-guardian-autofix]')){
    const autofix=document.createElement('script');
    autofix.src='guardian-autofix.js?v=3';
    autofix.dataset.guardianAutofix='1';
    autofix.defer=true;
    document.head.appendChild(autofix);
  }

  if(!document.querySelector('script[data-guardian-retention]')){
    const retention=document.createElement('script');
    retention.src='guardian-retention.js?v=1';
    retention.dataset.guardianRetention='1';
    retention.defer=true;
    document.head.appendChild(retention);
  }

  if(!document.querySelector('script[data-guardian-occurrences-safe]')){
    const occurrences=document.createElement('script');
    occurrences.src='guardian-occurrences-safe.js?v=1';
    occurrences.dataset.guardianOccurrencesSafe='1';
    occurrences.defer=true;
    document.head.appendChild(occurrences);
  }
})();
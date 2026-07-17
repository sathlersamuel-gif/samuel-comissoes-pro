(function(){
  'use strict';

  let ajustando=false;

  function moverControles(){
    if(ajustando||!document.body.classList.contains('home-modern')) return;

    const perfil=document.querySelector('#dashboard .perfil-topo');
    const barra=document.getElementById('firebaseUserBar');
    const sino=document.getElementById('scpNewUserBell');
    const engrenagem=document.getElementById('scpSecurityTools');
    const sair=document.getElementById('btnSairFirebase');

    if(!perfil||!barra||!sino||!engrenagem||!sair) return;

    ajustando=true;
    try{
      let acoes=perfil.querySelector('.perfil-acoes');
      if(!acoes){
        acoes=document.createElement('div');
        acoes.className='perfil-acoes';
        perfil.appendChild(acoes);
      }

      Array.from(acoes.children).forEach(el=>{
        if(el!==sino&&el!==engrenagem&&el!==sair) el.remove();
      });

      if(sino.parentElement!==acoes) acoes.appendChild(sino);
      if(engrenagem.parentElement!==acoes) acoes.appendChild(engrenagem);
      if(sair.parentElement!==acoes) acoes.appendChild(sair);

      barra.style.setProperty('display','none','important');
      perfil.classList.add('controles-integrados');
    }finally{
      ajustando=false;
    }
  }

  function iniciar(){
    moverControles();
    const observer=new MutationObserver(()=>requestAnimationFrame(moverControles));
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(moverControles,700);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();

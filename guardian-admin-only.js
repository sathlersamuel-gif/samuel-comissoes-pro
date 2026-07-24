(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  let currentUser=null;
  let authResolved=false;

  function authUser(){
    return currentUser||window.SCPAuth?.getUser?.()||window.firebase?.auth?.()?.currentUser||null;
  }

  function isAdmin(){
    return String(authUser()?.email||'').trim().toLowerCase()===ADMIN;
  }

  function hideGuardianForNonAdmin(){
    if(!authResolved||isAdmin())return;
    document.getElementById('scpGuardianGearSection')?.remove();
    document.querySelectorAll('.guardia-nav-btn,.guardia-lancador,[data-guardian-admin-only]').forEach(el=>el.remove());
    const screen=document.getElementById('iaGuardia');
    if(screen){
      screen.style.setProperty('display','none','important');
      screen.setAttribute('aria-hidden','true');
      screen.classList.remove('ativa');
    }
  }

  function restoreGuardianForAdmin(){
    if(!authResolved||!isAdmin())return;
    const screen=document.getElementById('iaGuardia');
    if(screen){
      screen.style.removeProperty('display');
      screen.removeAttribute('aria-hidden');
    }
    window.dispatchEvent(new CustomEvent('scp:guardian-admin-ready',{detail:{email:ADMIN}}));
  }

  function applyVisibility(){
    if(!authResolved)return;
    if(isAdmin())restoreGuardianForAdmin();
    else hideGuardianForNonAdmin();
  }

  function initAuth(){
    const timer=setInterval(()=>{
      if(!window.firebase?.apps?.length)return;
      clearInterval(timer);
      window.firebase.auth().onAuthStateChanged(user=>{
        currentUser=user;
        authResolved=true;
        applyVisibility();
      });
    },200);
    setTimeout(()=>clearInterval(timer),20000);
  }

  const observer=new MutationObserver(()=>{
    if(authResolved)applyVisibility();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('click',event=>{
    if(authResolved&&!isAdmin()&&event.target?.closest?.('#scpGuardianGearReports,.guardia-nav-btn,.guardia-lancador')){
      event.preventDefault();
      event.stopImmediatePropagation();
      hideGuardianForNonAdmin();
    }
  },true);

  window.addEventListener('scp:auth-ready',event=>{
    const user=window.SCPAuth?.getUser?.()||null;
    if(user)currentUser=user;
    else if(event?.detail?.email)currentUser={email:event.detail.email};
    authResolved=true;
    applyVisibility();
  });

  initAuth();
})();
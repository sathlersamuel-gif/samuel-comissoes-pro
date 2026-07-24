(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  let currentUser=null;

  function isAdmin(){
    return String(currentUser?.email||window.SCPAuth?.getUser?.()?.email||window.firebase?.auth?.()?.currentUser?.email||'').toLowerCase()===ADMIN;
  }

  function hideGuardianForNonAdmin(){
    if(isAdmin())return;
    document.getElementById('scpGuardianGearSection')?.remove();
    document.querySelectorAll('.guardia-nav-btn,.guardia-lancador,[data-guardian-admin-only]').forEach(el=>el.remove());
    const screen=document.getElementById('iaGuardia');
    if(screen){
      screen.style.display='none';
      screen.setAttribute('aria-hidden','true');
      screen.classList.remove('ativa');
    }
  }

  function applyVisibility(){
    if(isAdmin()){
      const screen=document.getElementById('iaGuardia');
      if(screen){screen.removeAttribute('aria-hidden');}
      return;
    }
    hideGuardianForNonAdmin();
  }

  function initAuth(){
    const timer=setInterval(()=>{
      if(!window.firebase?.apps?.length)return;
      clearInterval(timer);
      window.firebase.auth().onAuthStateChanged(user=>{
        currentUser=user;
        applyVisibility();
      });
    },200);
    setTimeout(()=>clearInterval(timer),20000);
  }

  const observer=new MutationObserver(applyVisibility);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',event=>{
    if(!isAdmin()&&event.target?.closest?.('#scpGuardianGearReports,.guardia-nav-btn,.guardia-lancador')){
      event.preventDefault();
      event.stopImmediatePropagation();
      hideGuardianForNonAdmin();
    }
  },true);

  initAuth();
  applyVisibility();
})();
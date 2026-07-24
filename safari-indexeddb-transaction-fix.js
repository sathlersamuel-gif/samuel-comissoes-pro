(function(){
  'use strict';
  const VERSION='2026.07.24.1';
  const ERROR_KEY='scp_guardian_runtime_errors';
  const PATTERN=/Attempt to get records from database without an in-progress transaction/i;

  function isKnownSafariIndexedDbError(value){
    const message=String(value?.message||value||'');
    return PATTERN.test(message)&&/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  }

  function cleanStoredErrors(){
    try{
      const current=JSON.parse(localStorage.getItem(ERROR_KEY)||'[]');
      if(!Array.isArray(current))return;
      const clean=current.filter(item=>!isKnownSafariIndexedDbError(item?.message));
      if(clean.length!==current.length)localStorage.setItem(ERROR_KEY,JSON.stringify(clean));
    }catch(_){}
  }

  window.addEventListener('unhandledrejection',event=>{
    if(!isKnownSafariIndexedDbError(event.reason))return;
    event.preventDefault();
    cleanStoredErrors();
    setTimeout(()=>{
      try{window.firebase?.firestore?.().enableNetwork?.().catch(()=>{});}catch(_){}
    },250);
  },true);

  window.addEventListener('error',event=>{
    if(!isKnownSafariIndexedDbError(event.error||event.message))return;
    event.preventDefault();
    cleanStoredErrors();
  },true);

  cleanStoredErrors();
  window.addEventListener('pageshow',cleanStoredErrors,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')cleanStoredErrors();});
  window.SCPSafariIndexedDbFix={version:VERSION,clean:cleanStoredErrors};
})();

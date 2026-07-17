(function(){
  function aplicar(){
    if(document.getElementById('scpGearPositionFix')) return;
    const style=document.createElement('style');
    style.id='scpGearPositionFix';
    style.textContent=`
      #firebaseUserBar{position:relative!important;padding-right:62px!important}
      #scpSecurityTools{position:absolute!important;top:50%!important;right:8px!important;transform:translateY(-50%)!important;margin:0!important;z-index:5!important}
      #scpSecurityButton{width:44px!important;height:44px!important;border-radius:14px!important}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',aplicar);
  else aplicar();
})();
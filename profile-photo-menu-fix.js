(function(){
  'use strict';
  const FOTO_KEY='controle_vendas_foto_usuario';
  const STYLE_ID='scpProfilePhotoMenuFixStyle';

  function garantirEstilo(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      body>.menu-foto{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:18px 18px calc(18px + env(safe-area-inset-bottom))!important;background:rgba(0,0,0,.72)!important}
      body>.menu-foto[hidden]{display:none!important}
      body>.menu-foto>div{position:relative!important;display:block!important;width:min(100%,420px)!important;max-height:calc(100dvh - 36px)!important;overflow:auto!important;background:#0b1d34!important;border:1px solid #28588c!important;border-radius:20px!important;padding:14px!important;box-shadow:0 18px 55px rgba(0,0,0,.55)!important;opacity:1!important;visibility:visible!important;transform:none!important}
      body>.menu-foto button{display:block!important;width:100%!important;min-height:48px!important;margin:0 0 10px!important;padding:14px!important;border:0!important;border-radius:13px!important;background:#15365c!important;color:#fff!important;font-weight:800!important;opacity:1!important;visibility:visible!important}
      body>.menu-foto button:first-child{background:#0877ff!important}
      body>.menu-foto .scp-remover-foto{background:#9f2231!important}
      body>.menu-foto button:last-child{margin-bottom:0!important;background:#381b26!important}
    `;
    document.head.appendChild(style);
  }

  function atualizarAvatares(menu){
    if(menu?.isConnected) menu.remove();
    try{
      if(typeof window.atualizarDashboardV2==='function') window.atualizarDashboardV2();
      window.dispatchEvent(new StorageEvent('storage',{key:FOTO_KEY,newValue:localStorage.getItem(FOTO_KEY)}));
    }catch(_){
      window.dispatchEvent(new Event('storage'));
    }
  }

  function prepararMenu(menu){
    if(!menu||menu.dataset.scpPhotoFixed==='1') return;
    menu.dataset.scpPhotoFixed='1';
    garantirEstilo();

    const caixa=menu.querySelector('div');
    const cancelar=menu.querySelector('#cancelarFotoV2');
    if(caixa&&!menu.querySelector('.scp-remover-foto')){
      const remover=document.createElement('button');
      remover.type='button';
      remover.className='scp-remover-foto';
      remover.textContent='🗑️ Apagar foto atual';
      remover.addEventListener('click',function(){
        if(!localStorage.getItem(FOTO_KEY)){
          alert('Não existe foto salva para apagar.');
          return;
        }
        if(!confirm('Apagar a foto atual do perfil?')) return;
        localStorage.removeItem(FOTO_KEY);
        atualizarAvatares(menu);
      });
      caixa.insertBefore(remover,cancelar||null);
    }
  }

  function limparDuplicados(){
    const menus=[...document.querySelectorAll('#menuFotoV2')];
    if(menus.length<2) return menus[0]||null;
    const atual=menus.find(menu=>menu.closest('#dashboard'))||menus[menus.length-1];
    menus.forEach(menu=>{if(menu!==atual) menu.remove();});
    return atual;
  }

  function mostrarMenu(){
    const menu=limparDuplicados()||document.getElementById('menuFotoV2');
    if(!menu) return;
    prepararMenu(menu);
    if(menu.parentElement!==document.body) document.body.appendChild(menu);
    menu.hidden=false;
  }

  document.addEventListener('click',function(event){
    const alvo=event.target.closest?.('#scpUnifiedAvatar,#botaoFotoPerfilV2');
    if(!alvo) return;
    setTimeout(mostrarMenu,0);
  },true);

  const observer=new MutationObserver(function(){
    const menu=limparDuplicados();
    if(menu) prepararMenu(menu);
  });

  function iniciar(){
    garantirEstilo();
    observer.observe(document.body,{childList:true,subtree:true});
    const menu=limparDuplicados()||document.getElementById('menuFotoV2');
    if(menu) prepararMenu(menu);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();

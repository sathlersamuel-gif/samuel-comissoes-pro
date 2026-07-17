(function(){
  'use strict';

  const NOME_KEY='controle_vendas_nome_usuario';
  const FOTO_KEY='controle_vendas_foto_usuario';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';

  function usuario(){
    try{return window.firebase?.auth?.().currentUser||null;}catch{return null;}
  }

  function ehAdmin(){
    return String(usuario()?.email||'').toLowerCase()===ADMIN_EMAIL;
  }

  function criar(){
    let header=document.getElementById('scpUnifiedHeader');
    if(header) return header;
    header=document.createElement('section');
    header.id='scpUnifiedHeader';
    header.setAttribute('aria-label','Perfil e controles da conta');
    header.innerHTML=`
      <button type="button" id="scpUnifiedAvatar" aria-label="Alterar foto do perfil"><span>👤</span></button>
      <div id="scpUnifiedIdentity">
        <button type="button" id="scpUnifiedName" aria-label="Alterar nome do perfil">Usuário</button>
        <span id="scpUnifiedEmail"></span>
      </div>
      <div id="scpUnifiedActions">
        <button type="button" id="scpUnifiedBell" aria-label="Notificações">🔔<span id="scpUnifiedBadge"></span></button>
        <button type="button" id="scpUnifiedGear" aria-label="Configurações">⚙️</button>
        <button type="button" id="scpUnifiedLogout" aria-label="Sair">Sair</button>
      </div>`;
    const main=document.querySelector('main');
    if(main) document.body.insertBefore(header,main); else document.body.appendChild(header);

    header.querySelector('#scpUnifiedAvatar').addEventListener('click',()=>document.getElementById('botaoFotoPerfilV2')?.click());
    header.querySelector('#scpUnifiedName').addEventListener('click',()=>document.getElementById('editarNomeV2')?.click());
    header.querySelector('#scpUnifiedBell').addEventListener('click',()=>{
      if(ehAdmin()) document.getElementById('scpNewUserBell')?.click();
    });
    header.querySelector('#scpUnifiedGear').addEventListener('click',()=>document.getElementById('scpSecurityButton')?.click());
    header.querySelector('#scpUnifiedLogout').addEventListener('click',()=>document.getElementById('btnSairFirebase')?.click());
    return header;
  }

  function atualizarPerfil(){
    const header=criar();
    const user=usuario();
    header.classList.toggle('is-visible',Boolean(user));
    if(!user) return;

    const nome=(localStorage.getItem(NOME_KEY)||'Samuel Mendes Sathler').trim()||'Usuário';
    const foto=localStorage.getItem(FOTO_KEY)||'';
    const nomeEl=document.getElementById('scpUnifiedName');
    const emailEl=document.getElementById('scpUnifiedEmail');
    const avatar=document.getElementById('scpUnifiedAvatar');
    const sino=document.getElementById('scpUnifiedBell');
    if(nomeEl) nomeEl.textContent=nome;
    if(emailEl) emailEl.textContent=user.email||'';
    if(avatar){
      avatar.innerHTML=foto?`<img src="${foto}" alt="Foto do perfil">`:'<span>👤</span>';
    }
    if(sino){
      sino.setAttribute('aria-label',ehAdmin()?'Gerenciar usuários pendentes':'Notificações');
      sino.removeAttribute('title');
    }
  }

  function atualizarBadge(){
    const origem=document.getElementById('scpNewUserBellBadge');
    const destino=document.getElementById('scpUnifiedBadge');
    if(!destino) return;
    if(!ehAdmin()){
      destino.textContent='';
      destino.style.display='none';
      return;
    }
    const texto=String(origem?.textContent||'').trim();
    const visivel=Boolean(origem&&getComputedStyle(origem).display!=='none'&&texto&&texto!=='0');
    destino.textContent=texto;
    destino.style.display=visivel?'flex':'none';
  }

  function sincronizar(){
    atualizarPerfil();
    atualizarBadge();
  }

  function iniciar(){
    criar();
    sincronizar();
    try{window.firebase?.auth?.().onAuthStateChanged?.(()=>setTimeout(sincronizar,50));}catch{}
    window.addEventListener('storage',sincronizar);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sincronizar();});
    const observer=new MutationObserver(()=>requestAnimationFrame(sincronizar));
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
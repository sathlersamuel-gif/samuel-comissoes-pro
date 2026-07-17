(function(){
  'use strict';

  const NOME_KEY='controle_vendas_nome_usuario';
  const FOTO_KEY='controle_vendas_foto_usuario';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  let ultimoNome=null;
  let ultimoEmail=null;
  let ultimaFoto=null;
  let ultimoUsuarioVisivel=null;
  let ultimoAdmin=null;

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
    const visivel=Boolean(user);
    if(ultimoUsuarioVisivel!==visivel){
      header.classList.toggle('is-visible',visivel);
      ultimoUsuarioVisivel=visivel;
    }
    if(!user) return;

    const nome=(localStorage.getItem(NOME_KEY)||'Samuel Mendes Sathler').trim()||'Usuário';
    const email=user.email||'';
    const foto=localStorage.getItem(FOTO_KEY)||'';
    const admin=ehAdmin();
    const nomeEl=document.getElementById('scpUnifiedName');
    const emailEl=document.getElementById('scpUnifiedEmail');
    const avatar=document.getElementById('scpUnifiedAvatar');
    const sino=document.getElementById('scpUnifiedBell');

    if(nomeEl&&nome!==ultimoNome){
      nomeEl.textContent=nome;
      ultimoNome=nome;
    }
    if(emailEl&&email!==ultimoEmail){
      emailEl.textContent=email;
      ultimoEmail=email;
    }
    if(avatar&&foto!==ultimaFoto){
      if(foto){
        let img=avatar.querySelector('img');
        if(!img){
          img=document.createElement('img');
          img.alt='Foto do perfil';
          avatar.replaceChildren(img);
        }
        if(img.src!==foto) img.src=foto;
      }else if(!avatar.querySelector('span')){
        const span=document.createElement('span');
        span.textContent='👤';
        avatar.replaceChildren(span);
      }
      ultimaFoto=foto;
    }
    if(sino&&admin!==ultimoAdmin){
      sino.setAttribute('aria-label',admin?'Gerenciar usuários pendentes':'Notificações');
      sino.removeAttribute('title');
      ultimoAdmin=admin;
    }
  }

  function atualizarBadge(){
    const origem=document.getElementById('scpNewUserBellBadge');
    const destino=document.getElementById('scpUnifiedBadge');
    if(!destino) return;
    if(!ehAdmin()){
      if(destino.textContent) destino.textContent='';
      if(destino.style.display!=='none') destino.style.display='none';
      return;
    }
    const texto=String(origem?.textContent||'').trim();
    const visivel=Boolean(origem&&getComputedStyle(origem).display!=='none'&&texto&&texto!=='0');
    if(destino.textContent!==texto) destino.textContent=texto;
    const display=visivel?'flex':'none';
    if(destino.style.display!==display) destino.style.display=display;
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
    let agendado=false;
    const observer=new MutationObserver(()=>{
      if(agendado)return;
      agendado=true;
      requestAnimationFrame(()=>{
        agendado=false;
        sincronizar();
      });
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
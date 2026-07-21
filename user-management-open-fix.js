(function(){
  'use strict';
  const VERSION='2026.07.21.9';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  let executando=false;
  let ultimaTentativa=0;

  function painelVisivel(){
    const painel=document.getElementById('painelUsuarios');
    if(!painel)return false;
    const estilo=getComputedStyle(painel);
    return estilo.display!=='none'&&estilo.visibility!=='hidden';
  }

  function listaCarregando(){
    const lista=document.getElementById('listaUsuarios');
    if(!lista)return false;
    const texto=String(lista.textContent||'').trim().toLowerCase();
    return !texto||texto==='carregando...'||texto.includes('carregando informações');
  }

  function mostrarErro(mensagem){
    const lista=document.getElementById('listaUsuarios');
    if(!lista)return;
    lista.innerHTML=`<div style="padding:18px;border:1px solid #34506f;border-radius:16px;background:#0b213d;color:#fff"><strong>Não foi possível carregar os usuários.</strong><p style="margin:8px 0 14px;color:#b7c6da">${mensagem}</p><button id="scpTentarUsuarios" type="button" style="width:100%;min-height:46px;border:0;border-radius:12px;background:#1683ff;color:#fff;font-weight:800">Tentar novamente</button></div>`;
    document.getElementById('scpTentarUsuarios')?.addEventListener('click',()=>forcarCarregamento(true),{once:true});
  }

  function esperarFirebase(limite=12000){
    return new Promise((resolve,reject)=>{
      const inicio=Date.now();
      const verificar=()=>{
        try{
          if(window.firebase&&firebase.apps?.length){
            const auth=firebase.auth();
            const user=auth.currentUser;
            if(user)return resolve({auth,user});
          }
        }catch(_){ }
        if(Date.now()-inicio>=limite)return reject(new Error('O login do Firebase não foi confirmado.'));
        setTimeout(verificar,200);
      };
      verificar();
    });
  }

  async function forcarCarregamento(manual=false){
    if(executando||!painelVisivel())return;
    if(!manual&&!listaCarregando())return;
    const agora=Date.now();
    if(!manual&&agora-ultimaTentativa<800)return;
    ultimaTentativa=agora;
    executando=true;
    const lista=document.getElementById('listaUsuarios');
    if(lista)lista.innerHTML='<p>Carregando informações de uso...</p>';
    try{
      const {user}=await esperarFirebase();
      if(String(user.email||'').trim().toLowerCase()!==ADMIN_EMAIL)throw new Error('Esta conta não possui permissão de administrador.');
      const inicio=Date.now();
      while(typeof window.carregarGerenciamentoUsuarios!=='function'){
        if(Date.now()-inicio>10000)throw new Error('O módulo de gerenciamento não terminou de iniciar.');
        await new Promise(r=>setTimeout(r,150));
      }
      await new Promise(r=>setTimeout(r,350));
      await window.carregarGerenciamentoUsuarios();
      await new Promise(r=>setTimeout(r,500));
      if(listaCarregando()){
        await new Promise(r=>setTimeout(r,700));
        await window.carregarGerenciamentoUsuarios();
      }
      await new Promise(r=>setTimeout(r,500));
      if(listaCarregando())throw new Error('A consulta não retornou os usuários.');
    }catch(erro){
      console.error('[User Management Open Fix]',erro);
      mostrarErro(erro?.message||'Falha inesperada.');
    }finally{
      executando=false;
    }
  }

  function observar(){
    const painel=document.getElementById('painelUsuarios');
    if(!painel)return setTimeout(observar,250);
    new MutationObserver(()=>{if(painelVisivel())setTimeout(forcarCarregamento,50);}).observe(painel,{attributes:true,attributeFilter:['style','class'],childList:true,subtree:true});
    document.addEventListener('click',evento=>{
      if(evento.target?.closest?.('#scpManageUsers,#adminUsuariosBtn'))setTimeout(()=>forcarCarregamento(true),120);
    },true);
    setInterval(()=>{if(painelVisivel()&&listaCarregando())forcarCarregamento();},1200);
    if(painelVisivel())forcarCarregamento(true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar,{once:true});else observar();
  window.__SCP_USER_MANAGEMENT_OPEN_FIX__=VERSION;
})();
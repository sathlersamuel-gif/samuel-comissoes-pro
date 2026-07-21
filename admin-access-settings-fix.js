(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const VERSION='2026.07.21.7';
  let usuarioAtual=null;

  function usuarioFirebase(){
    try{return window.firebase?.auth?.().currentUser||null;}catch(_){return null;}
  }

  function usuarioEhAdmin(){
    const email=String(usuarioAtual?.email||usuarioFirebase()?.email||'').trim().toLowerCase();
    return email===ADMIN_EMAIL;
  }

  function ocultarAcessoNaoAdmin(){
    const botao=document.getElementById('scpManageUsers');
    if(botao&&!usuarioEhAdmin())botao.remove();
    const painel=document.getElementById('painelUsuarios');
    if(painel&&!usuarioEhAdmin())painel.style.setProperty('display','none','important');
  }

  function esperarGerenciador(limiteMs=15000){
    return new Promise((resolve,reject)=>{
      const inicio=Date.now();
      const verificar=()=>{
        if(typeof window.carregarGerenciamentoUsuarios==='function')return resolve(window.carregarGerenciamentoUsuarios);
        if(Date.now()-inicio>=limiteMs)return reject(new Error('O gerenciador ainda não terminou de carregar.'));
        setTimeout(verificar,150);
      };
      verificar();
    });
  }

  function esperarUsuarioAdmin(limiteMs=10000){
    return new Promise((resolve,reject)=>{
      const inicio=Date.now();
      const verificar=()=>{
        const atual=usuarioFirebase();
        if(atual){
          usuarioAtual=atual;
          if(String(atual.email||'').trim().toLowerCase()===ADMIN_EMAIL)return resolve(atual);
          return reject(new Error('Este usuário não possui acesso administrativo.'));
        }
        if(Date.now()-inicio>=limiteMs)return reject(new Error('Não foi possível confirmar o login administrativo.'));
        setTimeout(verificar,150);
      };
      verificar();
    });
  }

  function mostrarFalhaNoPainel(mensagem){
    const lista=document.getElementById('listaUsuarios');
    if(lista)lista.innerHTML=`<div class="usuario-card"><p>${String(mensagem||'Não foi possível carregar os usuários.')}</p><button type="button" id="scpTentarUsuariosNovamente">Tentar novamente</button></div>`;
    document.getElementById('scpTentarUsuariosNovamente')?.addEventListener('click',abrirGerenciamento,{once:true});
  }

  async function abrirGerenciamento(evento){
    evento?.preventDefault?.();
    evento?.stopPropagation?.();

    const botao=evento?.currentTarget||document.getElementById('scpManageUsers');
    const textoOriginal=botao?.dataset?.textoOriginal||botao?.textContent||'👥 Gerenciar acessos';
    if(botao){
      botao.disabled=true;
      botao.dataset.textoOriginal=textoOriginal;
      botao.textContent='Abrindo...';
    }

    try{
      await esperarUsuarioAdmin();
      const carregar=await esperarGerenciador();
      const painel=document.getElementById('painelUsuarios');
      if(!painel)throw new Error('O painel de usuários não está disponível.');
      painel.style.setProperty('display','block','important');
      const lista=document.getElementById('listaUsuarios');
      if(lista)lista.innerHTML='<p>Carregando informações de uso...</p>';
      await Promise.race([
        Promise.resolve(carregar()),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('A consulta de usuários demorou mais que o esperado.')),15000))
      ]);
      document.getElementById('scpSecurityPanel')?.remove();
      window.scrollTo({top:0,behavior:'instant'});
    }catch(erro){
      console.error('[Gerenciar usuários]',erro);
      mostrarFalhaNoPainel(erro.message);
    }finally{
      if(botao&&document.body.contains(botao)){
        botao.disabled=false;
        botao.textContent=textoOriginal;
      }
    }
  }

  function adicionarBotao(){
    ocultarAcessoNaoAdmin();
    if(!usuarioEhAdmin())return;
    const card=document.querySelector('#scpSecurityPanel .scp-security-card');
    if(!card||document.getElementById('scpManageUsers'))return;
    const fechar=document.getElementById('scpCloseSecurity');
    const botao=document.createElement('button');
    botao.type='button';
    botao.id='scpManageUsers';
    botao.textContent='👥 Gerenciar acessos';
    botao.style.background='#5b2ca0';
    botao.style.color='#fff';
    botao.style.touchAction='manipulation';
    botao.addEventListener('click',abrirGerenciamento,{passive:false});
    card.insertBefore(botao,fechar||null);
  }

  function conectarFirebase(){
    if(!window.firebase||!firebase.apps.length)return setTimeout(conectarFirebase,250);
    usuarioAtual=firebase.auth().currentUser||usuarioAtual;
    firebase.auth().onAuthStateChanged(user=>{
      usuarioAtual=user;
      ocultarAcessoNaoAdmin();
      setTimeout(adicionarBotao,0);
      setTimeout(adicionarBotao,300);
      setTimeout(adicionarBotao,1000);
    });
  }

  function iniciar(){
    const observer=new MutationObserver(()=>{
      ocultarAcessoNaoAdmin();
      adicionarBotao();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    conectarFirebase();
    adicionarBotao();
    window.__SCP_ADMIN_ACCESS_SETTINGS_FIX__=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
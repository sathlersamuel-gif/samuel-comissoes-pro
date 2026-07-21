(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const VERSION='2026.07.21.6';
  let usuarioAtual=null;

  function usuarioEhAdmin(){
    const email=String(usuarioAtual?.email||window.firebase?.auth?.().currentUser?.email||'').trim().toLowerCase();
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

  async function abrirGerenciamento(evento){
    evento?.preventDefault?.();
    evento?.stopPropagation?.();
    if(!usuarioEhAdmin()){
      ocultarAcessoNaoAdmin();
      return;
    }

    const botao=evento?.currentTarget||document.getElementById('scpManageUsers');
    const textoOriginal=botao?.dataset?.textoOriginal||botao?.textContent||'👥 Gerenciar acessos';
    if(botao){
      botao.disabled=true;
      botao.dataset.textoOriginal=textoOriginal;
      botao.textContent='Abrindo...';
    }

    try{
      const carregar=await esperarGerenciador();
      const painel=document.getElementById('painelUsuarios');
      if(!painel)throw new Error('O painel de usuários não está disponível.');
      painel.style.setProperty('display','block','important');
      await carregar();
      document.getElementById('scpSecurityPanel')?.remove();
      window.scrollTo({top:0,behavior:'instant'});
    }catch(erro){
      console.error('[Gerenciar usuários]',erro);
      alert(`${erro.message||'Não foi possível abrir o gerenciamento.'} Tente novamente.`);
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
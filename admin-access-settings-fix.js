(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';

  function usuarioEhAdmin(){
    const email=window.firebase?.auth?.().currentUser?.email||'';
    return email.toLowerCase()===ADMIN_EMAIL;
  }

  async function abrirGerenciamento(evento){
    evento?.preventDefault?.();
    evento?.stopPropagation?.();
    if(!usuarioEhAdmin())return;

    const botao=evento?.currentTarget||document.getElementById('scpManageUsers');
    if(botao){
      botao.disabled=true;
      botao.dataset.textoOriginal=botao.dataset.textoOriginal||botao.textContent;
      botao.textContent='Abrindo...';
    }

    try{
      document.getElementById('scpSecurityPanel')?.remove();
      const painel=document.getElementById('painelUsuarios');
      if(!painel)throw new Error('O painel de usuários ainda não carregou.');
      painel.style.setProperty('display','block','important');

      if(typeof window.carregarGerenciamentoUsuarios!=='function'){
        throw new Error('O gerenciador principal ainda não terminou de carregar.');
      }

      await window.carregarGerenciamentoUsuarios();
    }catch(erro){
      console.error('[Gerenciar usuários]',erro);
      alert(`${erro.message||'Não foi possível abrir o gerenciamento.'} Tente novamente.`);
    }finally{
      if(botao&&document.body.contains(botao)){
        botao.disabled=false;
        botao.textContent=botao.dataset.textoOriginal||'👥 Gerenciar acessos';
      }
    }
  }

  function adicionarBotao(){
    const card=document.querySelector('#scpSecurityPanel .scp-security-card');
    if(!card||!usuarioEhAdmin()||document.getElementById('scpManageUsers'))return;
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

  function iniciar(){
    const observer=new MutationObserver(adicionarBotao);
    observer.observe(document.body,{childList:true,subtree:true});
    adicionarBotao();
    window.__SCP_ADMIN_ACCESS_SETTINGS_FIX__='2026.07.21.2';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
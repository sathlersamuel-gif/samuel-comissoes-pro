(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const VERSION='2026.07.21.4';

  function usuarioEhAdmin(){
    const email=window.firebase?.auth?.().currentUser?.email||'';
    return email.toLowerCase()===ADMIN_EMAIL;
  }

  function esperarGerenciador(limiteMs=3000){
    return new Promise((resolve,reject)=>{
      const inicio=Date.now();
      const verificar=()=>{
        if(typeof window.carregarGerenciamentoUsuarios==='function')return resolve(window.carregarGerenciamentoUsuarios);
        if(Date.now()-inicio>=limiteMs)return reject(new Error('O gerenciador ainda não terminou de carregar.'));
        setTimeout(verificar,100);
      };
      verificar();
    });
  }

  async function abrirGerenciamento(evento){
    evento?.preventDefault?.();
    evento?.stopPropagation?.();
    if(!usuarioEhAdmin())return;

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
    window.__SCP_ADMIN_ACCESS_SETTINGS_FIX__=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();

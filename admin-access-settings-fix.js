(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';

  function usuarioEhAdmin(){
    const email=window.firebase?.auth?.().currentUser?.email||'';
    return email.toLowerCase()===ADMIN_EMAIL;
  }

  async function carregarUsuariosNoPainel(){
    const lista=document.getElementById('listaUsuarios');
    if(!lista||!window.firebase)return;
    lista.innerHTML='<p>Carregando...</p>';
    try{
      const snap=await firebase.firestore().collection('usuarios').orderBy('email').get();
      const docs=snap.docs.filter(doc=>(doc.data().email||'').toLowerCase()!==ADMIN_EMAIL);
      if(!docs.length){
        lista.innerHTML='<p>Nenhum usuário cadastrado.</p>';
        return;
      }
      lista.innerHTML=docs.map(doc=>{
        const u=doc.data();
        const status=u.status||'pendente';
        return `<div class="usuario-card">
          <p><strong>${u.email||'Sem e-mail'}</strong></p>
          <p>Status: <strong>${status}</strong></p>
          <div class="usuario-acoes">
            <button class="btn-aprovar" data-admin-acao="aprovar" data-uid="${doc.id}">Aprovar</button>
            <button class="btn-pendente" data-admin-acao="pendente" data-uid="${doc.id}">Pendente</button>
            <button class="btn-bloquear" data-admin-acao="bloquear" data-uid="${doc.id}">Bloquear</button>
          </div>
        </div>`;
      }).join('');

      lista.querySelectorAll('[data-admin-acao]').forEach(botao=>{
        botao.addEventListener('click',async()=>{
          const uid=botao.dataset.uid;
          const acao=botao.dataset.adminAcao;
          if(acao==='aprovar'&&typeof window.aprovarUsuario==='function')await window.aprovarUsuario(uid);
          if(acao==='pendente'&&typeof window.penderUsuario==='function')await window.penderUsuario(uid);
          if(acao==='bloquear'&&typeof window.bloquearUsuario==='function')await window.bloquearUsuario(uid);
          await carregarUsuariosNoPainel();
        });
      });
    }catch(erro){
      console.error('Erro ao carregar usuários:',erro);
      lista.innerHTML='<p>Não foi possível carregar os usuários.</p>';
    }
  }

  async function abrirGerenciamento(){
    if(!usuarioEhAdmin())return;
    const painel=document.getElementById('painelUsuarios');
    if(!painel)return alert('O painel de usuários ainda não carregou. Tente novamente.');
    document.getElementById('scpSecurityPanel')?.remove();
    painel.style.setProperty('display','block','important');
    await carregarUsuariosNoPainel();
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
    botao.addEventListener('click',abrirGerenciamento);
    card.insertBefore(botao,fechar||null);
  }

  function iniciar(){
    const observer=new MutationObserver(adicionarBotao);
    observer.observe(document.body,{childList:true,subtree:true});
    adicionarBotao();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();

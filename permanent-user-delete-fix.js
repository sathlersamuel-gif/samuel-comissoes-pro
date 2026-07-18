(function(){
  'use strict';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const STATUS_EXCLUIDO='excluido';
  let db=null,auth=null,processando=false,botaoAtual=null;

  function iniciarFirebase(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return false;
    auth=firebase.auth();
    db=firebase.firestore();
    return true;
  }

  function ehAdmin(){
    return String(auth.currentUser?.email||'').trim().toLowerCase()===ADMIN_EMAIL;
  }

  function manterPainelAberto(){
    const painel=document.getElementById('painelUsuarios');
    if(painel)painel.style.display='block';
  }

  function criarConfirmacao(){
    if(document.getElementById('confirmarExclusaoUsuario'))return;
    const modal=document.createElement('div');
    modal.id='confirmarExclusaoUsuario';
    modal.style.cssText='position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:18px';
    modal.innerHTML='<div style="width:min(420px,100%);background:#fff;border-radius:20px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.3)"><h3 style="margin:0 0 8px;color:#071b3d">Excluir usuário?</h3><p id="confirmarExclusaoTexto" style="margin:0 0 18px;color:#5f6b7a;line-height:1.45"></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button type="button" id="cancelarExclusaoUsuario" style="border:0;border-radius:12px;padding:13px;font-weight:800;background:#e9eef6;color:#33435e">Cancelar</button><button type="button" id="confirmarExclusaoUsuarioBtn" style="border:0;border-radius:12px;padding:13px;font-weight:800;background:#941f2b;color:#fff">Excluir</button></div></div>';
    document.body.appendChild(modal);
    document.getElementById('cancelarExclusaoUsuario').onclick=fecharConfirmacao;
    document.getElementById('confirmarExclusaoUsuarioBtn').onclick=confirmarExclusao;
    modal.addEventListener('click',e=>{if(e.target===modal)fecharConfirmacao();});
  }

  function abrirConfirmacao(botao){
    if(processando)return;
    botaoAtual=botao;
    const email=botao.dataset.email||'este usuário';
    document.getElementById('confirmarExclusaoTexto').textContent=`${email} será removido da lista e terá o acesso bloqueado definitivamente.`;
    const modal=document.getElementById('confirmarExclusaoUsuario');
    modal.style.display='flex';
    manterPainelAberto();
  }

  function fecharConfirmacao(){
    const modal=document.getElementById('confirmarExclusaoUsuario');
    if(modal)modal.style.display='none';
    botaoAtual=null;
    manterPainelAberto();
  }

  async function confirmarExclusao(){
    const botao=botaoAtual;
    if(!botao||processando)return;
    if(!ehAdmin())return alert('Somente o administrador pode excluir usuários.');
    processando=true;
    const uid=String(botao.dataset.uid||'');
    const email=String(botao.dataset.email||'').trim().toLowerCase();
    const scrollAtual=document.getElementById('painelUsuarios')?.scrollTop||0;
    const confirmar=document.getElementById('confirmarExclusaoUsuarioBtn');
    if(confirmar){confirmar.disabled=true;confirmar.textContent='Excluindo...';}

    try{
      const ref=db.collection('usuarios').doc(uid);
      const snap=await ref.get();
      const dados=snap.exists?snap.data():{};
      await ref.set({
        uid,
        email:String(dados.email||email||'').trim().toLowerCase(),
        status:STATUS_EXCLUIDO,
        vendas:[],
        vendasExcluidas:[],
        totalAcessos:0,
        ultimoAcesso:firebase.firestore.FieldValue.delete(),
        ultimoDispositivo:firebase.firestore.FieldValue.delete(),
        expiraEm:firebase.firestore.FieldValue.delete(),
        acessoIniciadoEm:firebase.firestore.FieldValue.delete(),
        periodoQuantidade:firebase.firestore.FieldValue.delete(),
        periodoUnidade:firebase.firestore.FieldValue.delete(),
        excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),
        excluidoPor:ADMIN_EMAIL,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});

      const card=botao.closest('article,.usuario-card');
      if(card)card.remove();
      fecharConfirmacao();
      manterPainelAberto();
      const painel=document.getElementById('painelUsuarios');
      if(painel)painel.scrollTop=scrollAtual;
      alert('Usuário excluído com sucesso.');
      if(painel)painel.scrollTop=scrollAtual;
    }catch(erro){
      console.error('Erro ao excluir usuário:',erro);
      alert(`Não foi possível excluir o usuário. ${erro?.message||''}`.trim());
      manterPainelAberto();
    }finally{
      processando=false;
      if(confirmar){confirmar.disabled=false;confirmar.textContent='Excluir';}
    }
  }

  function filtrarExcluidosDaTela(){
    if(!ehAdmin())return;
    db.collection('usuarios').where('status','==',STATUS_EXCLUIDO).get().then(snap=>{
      const ids=new Set(snap.docs.map(d=>String(d.id)));
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{
        if(ids.has(String(el.dataset.uid)))el.closest('article,.usuario-card')?.remove();
      });
    }).catch(()=>{});
  }

  function instalar(){
    criarConfirmacao();
    document.addEventListener('click',function(e){
      const botao=e.target.closest&&e.target.closest('#listaUsuarios [data-acao="excluir"][data-uid]');
      if(!botao)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      manterPainelAberto();
      abrirConfirmacao(botao);
    },true);

    const observar=()=>{
      const lista=document.getElementById('listaUsuarios');
      if(!lista)return setTimeout(observar,300);
      new MutationObserver(()=>setTimeout(filtrarExcluidosDaTela,80)).observe(lista,{childList:true,subtree:true});
      filtrarExcluidosDaTela();
    };
    observar();

    auth.onAuthStateChanged(async user=>{
      if(!user||String(user.email||'').toLowerCase()===ADMIN_EMAIL)return;
      try{
        const snap=await db.collection('usuarios').doc(user.uid).get();
        if(snap.exists&&snap.data().status===STATUS_EXCLUIDO)await auth.signOut();
      }catch(erro){console.warn(erro);}
    });
  }

  function iniciar(){
    if(!iniciarFirebase())return setTimeout(iniciar,300);
    instalar();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
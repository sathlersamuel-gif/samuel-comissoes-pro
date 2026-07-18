(function(){
  'use strict';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const STATUS_EXCLUIDO='excluido';
  let db=null,auth=null,processando=false;

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

  async function excluirUsuario(uid,email,botao){
    if(processando)return;
    if(!ehAdmin())return alert('Somente o administrador pode excluir usuários.');
    const nome=email||'este usuário';
    if(!confirm(`Tem certeza que deseja excluir ${nome}?\n\nO acesso será bloqueado definitivamente e os dados serão apagados.`)){
      manterPainelAberto();
      return;
    }

    processando=true;
    const textoOriginal=botao?.textContent||'Excluir';
    if(botao){botao.disabled=true;botao.textContent='Excluindo...';}
    manterPainelAberto();

    try{
      const ref=db.collection('usuarios').doc(String(uid));
      const snap=await ref.get();
      const dados=snap.exists?snap.data():{};
      await ref.set({
        uid:String(uid),
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

      const card=botao?.closest('article,.usuario-card');
      if(card)card.remove();
      manterPainelAberto();
      if(typeof window.carregarGerenciamentoUsuarios==='function'){
        setTimeout(()=>{manterPainelAberto();window.carregarGerenciamentoUsuarios();},150);
      }
      alert('Usuário excluído definitivamente.');
      manterPainelAberto();
    }catch(erro){
      console.error('Erro ao excluir usuário:',erro);
      alert(`Não foi possível excluir o usuário. ${erro?.message||''}`.trim());
      manterPainelAberto();
    }finally{
      processando=false;
      if(botao&&document.body.contains(botao)){botao.disabled=false;botao.textContent=textoOriginal;}
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
    document.addEventListener('click',function(e){
      const botao=e.target.closest&&e.target.closest('#listaUsuarios [data-acao="excluir"][data-uid]');
      if(!botao)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      manterPainelAberto();
      excluirUsuario(botao.dataset.uid,botao.dataset.email||'',botao);
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
        if(snap.exists&&snap.data().status===STATUS_EXCLUIDO){
          await auth.signOut();
          alert('Esta conta foi excluída pelo administrador.');
        }
      }catch(erro){console.warn(erro);}
    });
  }

  function iniciar(){
    if(!iniciarFirebase())return setTimeout(iniciar,300);
    instalar();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
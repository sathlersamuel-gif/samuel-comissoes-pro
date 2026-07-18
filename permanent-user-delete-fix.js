(function(){
  'use strict';

  if(window.__SCP_EXCLUSAO_USUARIO_INSTALADA__)return;
  window.__SCP_EXCLUSAO_USUARIO_INSTALADA__=true;

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const STATUS_EXCLUIDO='excluido';
  let auth=null;
  let db=null;
  let processando=false;

  function iniciarFirebase(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return false;
    auth=firebase.auth();
    db=firebase.firestore();
    return true;
  }

  function ehAdmin(){
    return String(auth?.currentUser?.email||'').trim().toLowerCase()===ADMIN_EMAIL;
  }

  function manterPainelAberto(){
    const painel=document.getElementById('painelUsuarios');
    if(painel)painel.style.display='block';
  }

  async function confirmarExclusaoNoFirebase(uid){
    const snap=await db.collection('usuarios').doc(uid).get();
    return snap.exists&&snap.data().status===STATUS_EXCLUIDO;
  }

  async function excluirUsuario(botao){
    if(processando)return;
    if(!ehAdmin()){
      alert('Somente o administrador pode excluir usuários.');
      return;
    }

    const uid=String(botao?.dataset?.uid||'').trim();
    const email=String(botao?.dataset?.email||'este usuário').trim();
    if(!uid){
      alert('Não foi possível identificar este usuário.');
      return;
    }

    if(!confirm(`Tem certeza que deseja excluir ${email}?\n\nO usuário será removido da lista e não poderá voltar ao aplicativo.`))return;

    processando=true;
    const textoOriginal=botao.textContent;
    botao.disabled=true;
    botao.textContent='Excluindo...';
    manterPainelAberto();

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

      if(!(await confirmarExclusaoNoFirebase(uid))){
        throw new Error('O Firebase não confirmou a exclusão.');
      }

      botao.closest('article,.usuario-card')?.remove();
      manterPainelAberto();
      window.SCPMonitor?.registrar('acao-validada','Usuário excluído e confirmado no Firebase',{uid,email});
      alert('Usuário excluído com sucesso.');
    }catch(erro){
      console.error('Erro ao excluir usuário:',erro);
      window.SCPMonitor?.registrar('falha-exclusao-usuario',erro?.message||String(erro),{uid,email});
      alert(`Não foi possível excluir o usuário. ${erro?.message||''}`.trim());
    }finally{
      processando=false;
      if(document.body.contains(botao)){
        botao.disabled=false;
        botao.textContent=textoOriginal;
      }
    }
  }

  async function removerExcluidosDaTela(){
    if(!ehAdmin())return;
    try{
      const snap=await db.collection('usuarios').where('status','==',STATUS_EXCLUIDO).get();
      const ids=new Set(snap.docs.map(doc=>String(doc.id)));
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{
        if(ids.has(String(el.dataset.uid)))el.closest('article,.usuario-card')?.remove();
      });
    }catch(erro){
      console.warn('Falha ao ocultar usuários excluídos:',erro);
    }
  }

  function instalarCliqueDireto(){
    document.addEventListener('click',function(evento){
      const botao=evento.target.closest&&evento.target.closest('#listaUsuarios [data-acao="excluir"][data-uid]');
      if(!botao)return;
      evento.preventDefault();
      evento.stopPropagation();
      evento.stopImmediatePropagation();
      excluirUsuario(botao);
    },true);
  }

  function observarLista(){
    const conectar=()=>{
      const lista=document.getElementById('listaUsuarios');
      if(!lista)return setTimeout(conectar,300);
      removerExcluidosDaTela();
      new MutationObserver(()=>setTimeout(removerExcluidosDaTela,50)).observe(lista,{childList:true,subtree:true});
    };
    conectar();
  }

  function bloquearRetornoDoExcluido(){
    auth.onAuthStateChanged(async user=>{
      if(!user||String(user.email||'').trim().toLowerCase()===ADMIN_EMAIL)return;
      try{
        const snap=await db.collection('usuarios').doc(user.uid).get();
        if(snap.exists&&snap.data().status===STATUS_EXCLUIDO){
          await auth.signOut();
          alert('Esta conta foi excluída pelo administrador.');
        }
      }catch(erro){
        console.warn('Falha ao verificar usuário excluído:',erro);
      }
    });
  }

  function iniciar(){
    if(!iniciarFirebase())return setTimeout(iniciar,300);
    instalarCliqueDireto();
    observarLista();
    bloquearRetornoDoExcluido();
    window.excluirUsuarioDefinitivamente=excluirUsuario;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
(function(){
  'use strict';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const STATUS_EXCLUIDO='excluido';
  let auth=null,db=null,processando=false;

  function iniciarFirebase(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return false;
    auth=firebase.auth();
    db=firebase.firestore();
    return true;
  }

  function ehAdmin(){
    return String(auth?.currentUser?.email||'').trim().toLowerCase()===ADMIN_EMAIL;
  }

  function painelAberto(){
    const painel=document.getElementById('painelUsuarios');
    if(painel)painel.style.display='block';
  }

  async function excluirUsuario(botao){
    if(processando)return;
    if(!ehAdmin())return alert('Somente o administrador pode excluir usuários.');
    const uid=String(botao.dataset.uid||'').trim();
    const email=String(botao.dataset.email||'este usuário').trim();
    if(!uid)return alert('Não foi possível identificar este usuário.');
    if(!confirm(`Tem certeza que deseja excluir ${email}?\n\nO usuário será removido da lista e terá o acesso bloqueado.`))return;

    processando=true;
    const texto=botao.textContent;
    botao.disabled=true;
    botao.textContent='Excluindo...';
    painelAberto();

    try{
      const ref=db.collection('usuarios').doc(uid);
      await ref.set({
        status:STATUS_EXCLUIDO,
        excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),
        excluidoPor:ADMIN_EMAIL,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});

      const verificacao=await ref.get();
      if(!verificacao.exists||verificacao.data().status!==STATUS_EXCLUIDO){
        throw new Error('O Firebase não confirmou a exclusão.');
      }

      const card=botao.closest('article,.usuario-card');
      if(card)card.remove();
      painelAberto();
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
        botao.textContent=texto;
      }
    }
  }

  function prepararBotoes(){
    document.querySelectorAll('#listaUsuarios [data-acao="excluir"][data-uid]').forEach(botao=>{
      if(botao.dataset.exclusaoCorrigida==='1')return;
      const novo=botao.cloneNode(true);
      novo.dataset.exclusaoCorrigida='1';
      novo.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        excluirUsuario(novo);
      };
      botao.replaceWith(novo);
    });
  }

  async function removerExcluidosDaTela(){
    if(!ehAdmin())return;
    try{
      const snap=await db.collection('usuarios').where('status','==',STATUS_EXCLUIDO).get();
      const ids=new Set(snap.docs.map(doc=>String(doc.id)));
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{
        if(ids.has(String(el.dataset.uid)))el.closest('article,.usuario-card')?.remove();
      });
    }catch(erro){console.warn('Falha ao filtrar usuários excluídos:',erro);}
  }

  function instalar(){
    const observar=()=>{
      const lista=document.getElementById('listaUsuarios');
      if(!lista)return setTimeout(observar,250);
      prepararBotoes();
      removerExcluidosDaTela();
      new MutationObserver(()=>{
        prepararBotoes();
        removerExcluidosDaTela();
      }).observe(lista,{childList:true,subtree:true});
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
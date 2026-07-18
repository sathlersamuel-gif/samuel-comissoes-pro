(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const STATUS_EXCLUIDO='excluido';
  const CORE_VERSION='2026.07.18.2';
  const COLECAO_BLOQUEIOS='usuariosExcluidos';
  let auth=null;
  let db=null;
  let processandoUid='';
  let ultimoAcionamento=0;

  function iniciarFirebase(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return false;
    auth=firebase.auth();
    db=firebase.firestore();
    return true;
  }

  function emailAtual(){return String(auth?.currentUser?.email||'').trim().toLowerCase();}
  function ehAdmin(){return emailAtual()===ADMIN_EMAIL;}
  function painelAberto(){const painel=document.getElementById('painelUsuarios');if(painel)painel.style.display='block';}
  function botaoExcluir(alvo){return alvo?.closest?.('#listaUsuarios [data-acao="excluir"][data-uid],#listaUsuarios .btn-excluir-novo[data-uid]')||null;}
  function registrar(tipo,mensagem,dados){
    console[tipo==='erro'?'error':'log'](`[Gestão ${CORE_VERSION}] ${mensagem}`,dados||'');
    try{window.SCPMonitor?.registrar(tipo,mensagem,{versao:CORE_VERSION,...(dados||{})});}catch(_){ }
  }

  function marcarVersao(){
    const topo=document.querySelector('#painelUsuarios .painel-topo');
    if(!topo)return;
    let selo=document.getElementById('gestaoUsuariosVersao');
    if(!selo){selo=document.createElement('small');selo.id='gestaoUsuariosVersao';selo.style.cssText='margin-left:auto;color:#647188;font-size:10px;font-weight:800;white-space:nowrap';topo.appendChild(selo);}
    selo.textContent=`Gestão ${CORE_VERSION}`;
  }

  async function usuarioFoiExcluido(uid){
    const [usuario,bloqueio]=await Promise.all([
      db.collection('usuarios').doc(uid).get(),
      db.collection(COLECAO_BLOQUEIOS).doc(uid).get()
    ]);
    return bloqueio.exists||(usuario.exists&&usuario.data().status===STATUS_EXCLUIDO);
  }

  async function excluirUsuario(botao){
    const agora=Date.now();
    if(agora-ultimoAcionamento<700)return;
    ultimoAcionamento=agora;
    const uid=String(botao?.dataset?.uid||'').trim();
    const email=String(botao?.dataset?.email||'este usuário').trim().toLowerCase();
    if(!uid)return alert('Não foi possível identificar este usuário.');
    if(processandoUid)return;
    if(!ehAdmin())return alert('Somente o administrador pode excluir usuários.');
    if(!confirm(`Tem certeza que deseja excluir ${email}?\n\nO usuário será removido definitivamente da lista e não poderá voltar ao acessar novamente.`))return;

    processandoUid=uid;
    painelAberto();
    const textoOriginal=botao.textContent;
    botao.disabled=true;
    botao.textContent='Excluindo...';

    try{
      const usuarioRef=db.collection('usuarios').doc(uid);
      const bloqueioRef=db.collection(COLECAO_BLOQUEIOS).doc(uid);
      const snap=await usuarioRef.get();
      const dados=snap.exists?snap.data():{};
      const emailFinal=String(dados.email||email||'').trim().toLowerCase();
      const lote=db.batch();

      lote.set(bloqueioRef,{
        uid,
        email:emailFinal,
        motivo:'exclusao_administrativa',
        excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),
        excluidoPor:emailAtual()
      },{merge:true});

      lote.set(usuarioRef,{
        uid,
        email:emailFinal,
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
        excluidoPor:emailAtual(),
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});

      await lote.commit();
      if(!(await usuarioFoiExcluido(uid)))throw new Error('O Firebase não confirmou a exclusão permanente.');

      document.querySelectorAll(`#listaUsuarios [data-uid="${CSS.escape(uid)}"]`).forEach(el=>el.closest('article,.usuario-card')?.remove());
      registrar('acao-validada','Usuário excluído e bloqueio permanente confirmado no Firebase',{uid,email:emailFinal});
      alert('Usuário excluído definitivamente.');
      setTimeout(filtrarExcluidos,50);
    }catch(erro){
      registrar('erro',erro?.message||String(erro),{uid,email});
      alert(`Não foi possível excluir o usuário. ${erro?.message||''}`.trim());
    }finally{
      processandoUid='';
      if(document.body.contains(botao)){botao.disabled=false;botao.textContent=textoOriginal;}
      painelAberto();
    }
  }

  async function filtrarExcluidos(){
    if(!ehAdmin())return;
    try{
      const [usuarios,bloqueios]=await Promise.all([
        db.collection('usuarios').where('status','==',STATUS_EXCLUIDO).get(),
        db.collection(COLECAO_BLOQUEIOS).get()
      ]);
      const ids=new Set([...usuarios.docs,...bloqueios.docs].map(doc=>String(doc.id)));
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{
        if(ids.has(String(el.dataset.uid)))el.closest('article,.usuario-card')?.remove();
      });
    }catch(erro){registrar('erro','Falha ao filtrar usuários excluídos',{erro:erro?.message||String(erro)});}
  }

  function interceptar(evento){
    const botao=botaoExcluir(evento.target);
    if(!botao)return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    excluirUsuario(botao);
  }

  function instalarEventos(){
    document.addEventListener('pointerup',interceptar,true);
    document.addEventListener('click',interceptar,true);
    document.addEventListener('touchend',interceptar,{capture:true,passive:false});
    document.addEventListener('click',evento=>{
      if(evento.target?.closest?.('#adminUsuariosBtn')){
        setTimeout(()=>{marcarVersao();filtrarExcluidos();},100);
        setTimeout(()=>{marcarVersao();filtrarExcluidos();},700);
      }
    },true);
    const observar=()=>{
      const lista=document.getElementById('listaUsuarios');
      if(!lista)return setTimeout(observar,250);
      new MutationObserver(()=>{marcarVersao();setTimeout(filtrarExcluidos,30);}).observe(lista,{childList:true,subtree:true});
      marcarVersao();
      filtrarExcluidos();
    };
    observar();
  }

  function bloquearInterfaceExcluida(){
    const overlay=document.getElementById('firebaseAuthOverlay');
    const texto=document.getElementById('authTexto');
    const mensagem=document.getElementById('authMensagem');
    const barra=document.getElementById('firebaseUserBar');
    if(texto)texto.textContent='Esta conta foi excluída pelo administrador.';
    if(mensagem){mensagem.textContent='Acesso removido permanentemente.';mensagem.style.color='#b00020';}
    if(overlay)overlay.style.display='flex';
    if(barra)barra.style.display='none';
    ['authEmail','authSenha','btnEntrar','btnCadastrar','btnRecuperar'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
    const sair=document.getElementById('btnSairPendente');if(sair)sair.style.display='block';
  }

  function protegerContaExcluida(){
    auth.onAuthStateChanged(async user=>{
      if(!user||String(user.email||'').toLowerCase()===ADMIN_EMAIL)return;
      try{
        if(await usuarioFoiExcluido(user.uid)){
          bloquearInterfaceExcluida();
          setTimeout(()=>auth.signOut().catch(()=>{}),500);
        }
      }catch(erro){registrar('erro','Falha ao validar conta excluída',{erro:erro?.message||String(erro)});}
    });
  }

  function iniciar(){
    if(!iniciarFirebase())return setTimeout(iniciar,200);
    if(window.__SCP_USER_MANAGEMENT_CORE__)return;
    window.__SCP_USER_MANAGEMENT_CORE__=CORE_VERSION;
    instalarEventos();
    protegerContaExcluida();
    window.excluirUsuarioSCP=excluirUsuario;
    window.usuarioFoiExcluidoSCP=usuarioFoiExcluido;
    registrar('carregamento','Núcleo definitivo de gerenciamento carregado');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
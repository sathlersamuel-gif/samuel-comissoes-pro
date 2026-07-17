(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  let pararPendentes=null;
  let pararUsuario=null;
  let recriando=false;

  function pronto(){return Boolean(window.firebase&&firebase.apps&&firebase.apps.length);}
  function auth(){return firebase.auth();}
  function db(){return firebase.firestore();}
  function emailAtual(){return String(auth().currentUser?.email||'').toLowerCase();}
  function ehAdmin(){return emailAtual()===ADMIN_EMAIL;}

  function estilos(){
    if(document.getElementById('scpNewUserBellStyle'))return;
    const s=document.createElement('style');
    s.id='scpNewUserBellStyle';
    s.textContent=`
      #scpNewUserBell{position:relative!important;inset:auto!important;z-index:auto!important;flex:0 0 42px;width:42px;height:42px;margin:0 8px 0 0!important;padding:0!important;border:1px solid #245487;border-radius:50%;background:#0a2039;color:#fff;display:none;align-items:center;justify-content:center;font-size:20px;box-shadow:none!important;cursor:pointer;transform:none!important}
      #scpNewUserBell:hover{transform:none!important}
      #scpNewUserBellBadge{position:absolute;right:-3px;top:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e22335;color:#fff;border:2px solid #061326;display:none;align-items:center;justify-content:center;font-size:10px;font-weight:900;line-height:1}
      #scpNewUserToast{position:fixed;top:calc(66px + env(safe-area-inset-top));right:14px;z-index:10001;max-width:min(310px,calc(100vw - 28px));background:#0b2038;color:#fff;border:1px solid #2d679f;border-radius:15px;padding:12px 14px;box-shadow:0 12px 28px rgba(0,0,0,.32);font-size:13px;font-weight:700;display:none}
      body[data-scp-theme="claro"] #scpNewUserBell{background:#fff;color:#17355b;border-color:#d7e2ef}
      body[data-scp-theme="claro"] #scpNewUserBellBadge{border-color:#fff}
      body[data-scp-theme="claro"] #scpNewUserToast{background:#fff;color:#17355b;border-color:#d7e2ef;box-shadow:0 12px 28px rgba(18,49,93,.15)}
      @media(max-width:520px){#scpNewUserBell{flex-basis:40px;width:40px;height:40px;margin-right:6px!important}}
    `;
    document.head.appendChild(s);
  }

  function posicionarSino(){
    const sino=document.getElementById('scpNewUserBell');
    const barra=document.getElementById('firebaseUserBar');
    const sair=document.getElementById('btnSairFirebase');
    const ferramentas=document.getElementById('scpSecurityTools');
    if(!sino||!barra||!sair)return false;
    const referencia=ferramentas||sair;
    if(sino.parentElement!==barra||sino.nextElementSibling!==referencia)barra.insertBefore(sino,referencia);
    return true;
  }

  function criarSino(){
    let b=document.getElementById('scpNewUserBell');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.id='scpNewUserBell';
      b.setAttribute('aria-label','Novos usuários aguardando aprovação');
      b.innerHTML='🔔<span id="scpNewUserBellBadge"></span>';
      b.onclick=abrirGerenciamento;
      document.body.appendChild(b);
    }
    posicionarSino();
    if(!document.getElementById('scpNewUserToast')){
      const toast=document.createElement('div');
      toast.id='scpNewUserToast';
      document.body.appendChild(toast);
    }
  }

  function abrirGerenciamento(){
    const direto=document.getElementById('scpManageUsers')||document.getElementById('adminUsuariosBtn');
    if(direto){direto.click();return;}
    const painel=document.getElementById('painelUsuarios');
    if(painel){painel.style.setProperty('display','block','important');}
  }

  function mostrarAviso(qtd){
    const toast=document.getElementById('scpNewUserToast');
    if(!toast||qtd<1)return;
    toast.textContent=qtd===1?'Novo usuário aguardando sua aprovação.':`${qtd} usuários aguardando sua aprovação.`;
    toast.style.display='block';
    clearTimeout(mostrarAviso.timer);
    mostrarAviso.timer=setTimeout(()=>toast.style.display='none',4200);
  }

  function atualizarSino(qtd,avisar){
    posicionarSino();
    const sino=document.getElementById('scpNewUserBell');
    const badge=document.getElementById('scpNewUserBellBadge');
    if(!sino||!badge)return;
    sino.style.display=ehAdmin()?'flex':'none';
    badge.textContent=qtd>99?'99+':String(qtd);
    badge.style.display=qtd>0?'flex':'none';
    sino.title=qtd===1?'1 usuário aguardando aprovação':`${qtd} usuários aguardando aprovação`;
    if(avisar&&qtd>0)mostrarAviso(qtd);
  }

  function ouvirPendentes(){
    if(pararPendentes){pararPendentes();pararPendentes=null;}
    if(!ehAdmin()){atualizarSino(0,false);return;}
    let primeira=true,anterior=0;
    pararPendentes=db().collection('usuarios').where('status','==','pendente').onSnapshot(snap=>{
      const qtd=snap.docs.filter(d=>String(d.data().email||'').toLowerCase()!==ADMIN_EMAIL).length;
      atualizarSino(qtd,!primeira&&qtd>anterior);
      anterior=qtd;
      primeira=false;
    },erro=>console.warn('Não foi possível acompanhar novos usuários:',erro));
  }

  async function recriarSolicitacao(user){
    if(!user||ehAdmin()||recriando)return;
    recriando=true;
    try{
      const ref=db().collection('usuarios').doc(user.uid);
      const snap=await ref.get();
      if(snap.exists)return;
      await ref.set({
        uid:user.uid,
        email:String(user.email||'').toLowerCase(),
        status:'pendente',
        vendas:[],
        recriadoAposExclusao:true,
        solicitadoEm:firebase.firestore.FieldValue.serverTimestamp(),
        criadoEm:firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
    }catch(e){console.warn('Não foi possível recriar a solicitação de acesso:',e);}
    finally{recriando=false;}
  }

  function observarProprioCadastro(user){
    if(pararUsuario){pararUsuario();pararUsuario=null;}
    if(!user||ehAdmin())return;
    pararUsuario=db().collection('usuarios').doc(user.uid).onSnapshot(snap=>{
      if(!snap.exists)recriarSolicitacao(user);
    },erro=>console.warn('Não foi possível acompanhar o cadastro:',erro));
  }

  function iniciar(){
    if(!pronto())return setTimeout(iniciar,250);
    estilos();
    criarSino();
    const reposicionar=setInterval(()=>{if(posicionarSino()&&document.getElementById('scpSecurityTools'))clearInterval(reposicionar);},250);
    setTimeout(()=>clearInterval(reposicionar),5000);
    auth().onAuthStateChanged(user=>{
      if(!user){atualizarSino(0,false);return;}
      criarSino();
      observarProprioCadastro(user);
      ouvirPendentes();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
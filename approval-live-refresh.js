(function(){
  'use strict';

  let cancelarEscuta=null;
  let liberando=false;

  function firebasePronto(){
    return Boolean(window.firebase&&firebase.apps&&firebase.apps.length);
  }

  function liberarInterface(user){
    if(liberando)return;
    liberando=true;
    const overlay=document.getElementById('firebaseAuthOverlay');
    const barra=document.getElementById('firebaseUserBar');
    const email=document.getElementById('firebaseUserEmail');
    if(overlay)overlay.style.display='none';
    if(barra)barra.style.display='flex';
    if(email)email.textContent=user.email||'';
    setTimeout(()=>location.reload(),250);
  }

  function observarUsuario(user){
    if(cancelarEscuta){cancelarEscuta();cancelarEscuta=null;}
    if(!user)return;

    cancelarEscuta=firebase.firestore().collection('usuarios').doc(user.uid).onSnapshot(snapshot=>{
      if(!snapshot.exists)return;
      const dados=snapshot.data()||{};
      const status=String(dados.status||'pendente').toLowerCase();
      if(status==='ativo'){
        const overlay=document.getElementById('firebaseAuthOverlay');
        if(overlay&&getComputedStyle(overlay).display!=='none')liberarInterface(user);
      }
    },erro=>console.warn('Não foi possível acompanhar a aprovação:',erro));
  }

  function iniciar(){
    if(!firebasePronto())return setTimeout(iniciar,250);
    firebase.auth().onAuthStateChanged(observarUsuario);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();

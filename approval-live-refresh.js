(function(){
  'use strict';

  let cancelarEscuta=null;
  let statusAnterior=null;
  let primeiraLeitura=true;

  function firebasePronto(){
    return Boolean(window.firebase&&firebase.apps&&firebase.apps.length);
  }

  function liberarInterface(user){
    const overlay=document.getElementById('firebaseAuthOverlay');
    const barra=document.getElementById('firebaseUserBar');
    const email=document.getElementById('firebaseUserEmail');
    if(overlay)overlay.style.display='none';
    if(barra)barra.style.display='flex';
    if(email)email.textContent=user.email||'';
  }

  function observarUsuario(user){
    if(cancelarEscuta){cancelarEscuta();cancelarEscuta=null;}
    statusAnterior=null;
    primeiraLeitura=true;
    if(!user)return;

    cancelarEscuta=firebase.firestore().collection('usuarios').doc(user.uid).onSnapshot(snapshot=>{
      if(!snapshot.exists)return;
      const dados=snapshot.data()||{};
      const status=String(dados.status||'pendente').toLowerCase();

      if(primeiraLeitura){
        primeiraLeitura=false;
        statusAnterior=status;
        return;
      }

      const acabouDeSerAprovado=status==='ativo'&&statusAnterior!=='ativo';
      statusAnterior=status;
      if(acabouDeSerAprovado)liberarInterface(user);
    },erro=>console.warn('Não foi possível acompanhar a aprovação:',erro));
  }

  function iniciar(){
    if(!firebasePronto())return setTimeout(iniciar,250);
    firebase.auth().onAuthStateChanged(observarUsuario);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
(function(){
  'use strict';

  const STORAGE='samuel_comissoes_pro';
  let salvando=false;
  let ultimoJson='';

  function lerLocal(){
    try{
      const lista=JSON.parse(localStorage.getItem(STORAGE)||'[]');
      return Array.isArray(lista)?lista:[];
    }catch(_){return [];}
  }

  function substituirLista(lista){
    const segura=Array.isArray(lista)?lista:[];
    try{if(typeof vendas!=='undefined')vendas=segura;}catch(_){}
    localStorage.setItem(STORAGE,JSON.stringify(segura));
    try{if(typeof atualizarDashboard==='function')atualizarDashboard();}catch(_){}
    try{if(typeof carregarHistorico==='function')carregarHistorico();}catch(_){}
  }

  function unirListas(a,b){
    const mapa=new Map();
    [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(v=>{
      const id=String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`);
      mapa.set(id,v);
    });
    return [...mapa.values()];
  }

  async function salvarFirebase(forcar){
    if(salvando||!window.firebase||!firebase.apps?.length)return;
    const user=firebase.auth().currentUser;
    if(!user)return;
    const lista=lerLocal();
    const json=JSON.stringify(lista);
    if(!forcar&&json===ultimoJson)return;
    salvando=true;
    try{
      await firebase.firestore().collection('usuarios').doc(user.uid).set({
        email:user.email||'',
        vendas:lista,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      ultimoJson=json;
    }catch(erro){
      console.error('Falha ao salvar vendas do Android:',erro);
    }finally{
      salvando=false;
    }
  }

  async function restaurarFirebase(){
    if(!window.firebase||!firebase.apps?.length)return;
    const user=firebase.auth().currentUser;
    if(!user)return;
    try{
      const snap=await firebase.firestore().collection('usuarios').doc(user.uid).get();
      const nuvem=snap.exists&&Array.isArray(snap.data().vendas)?snap.data().vendas:[];
      const locais=lerLocal();
      const unificadas=unirListas(nuvem,locais);
      substituirLista(unificadas);
      ultimoJson=JSON.stringify(unificadas);
      await salvarFirebase(true);
    }catch(erro){
      console.error('Falha ao restaurar vendas no Android:',erro);
    }
  }

  function integrarSalvamento(){
    try{
      if(typeof salvarBanco==='function'&&!window.__androidPersistenciaIntegrada){
        window.__androidPersistenciaIntegrada=true;
        const original=salvarBanco;
        salvarBanco=function(){
          original.apply(this,arguments);
          setTimeout(()=>salvarFirebase(true),0);
        };
        window.salvarBanco=salvarBanco;
      }
    }catch(erro){console.error(erro);}
  }

  function iniciar(){
    integrarSalvamento();
    if(window.firebase&&firebase.apps?.length){
      firebase.auth().onAuthStateChanged(user=>{
        if(!user)return;
        setTimeout(restaurarFirebase,400);
        setTimeout(()=>salvarFirebase(true),1500);
      });
    }
    document.getElementById('formVenda')?.addEventListener('submit',()=>{
      setTimeout(()=>salvarFirebase(true),150);
      setTimeout(()=>salvarFirebase(true),800);
    },true);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden')salvarFirebase(true);
    });
    window.addEventListener('pagehide',()=>salvarFirebase(true));
    window.addEventListener('beforeunload',()=>salvarFirebase(true));
    setInterval(()=>salvarFirebase(false),3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
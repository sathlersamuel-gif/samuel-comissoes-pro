(function(){
'use strict';
const STORAGE='samuel_comissoes_pro';
const DELETED='samuel_comissoes_pro_excluidas';
const OWNER='scp_usuario_atual';
const VERSION='2026.07.20.1';
let running=false;

const read=(key)=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch(_){return[]}};
const saleId=(sale)=>String(sale?.id??`${sale?.data||''}-${sale?.cliente||''}-${sale?.valor||''}`);
const userKey=(uid)=>`${STORAGE}:${uid}`;
const deletedKey=(uid)=>`${DELETED}:${uid}`;
const decisionKey=(uid)=>`scp_restore_login_flow:${uid}`;

function removePrematureBackupPrompt(){
  const modal=document.getElementById('avisoBackupSeguranca');
  if(!modal)return;
  const authenticated=Boolean(window.firebase&&firebase.apps?.length&&firebase.auth().currentUser);
  const sales=read(STORAGE);
  if(!authenticated||!sales.length)modal.remove();
}

function render(){
  try{if(typeof atualizarDashboard==='function')atualizarDashboard()}catch(_){}
  try{if(typeof carregarHistorico==='function')carregarHistorico()}catch(_){}
  try{if(typeof window.atualizarRelatorio==='function')window.atualizarRelatorio()}catch(_){}
}

async function restoreAfterLogin(user){
  if(running||!user||!window.firebase||!firebase.apps?.length)return;
  running=true;
  try{
    removePrematureBackupPrompt();
    const uid=user.uid;
    const local=read(userKey(uid));
    const deleted=read(deletedKey(uid));
    if(local.length||deleted.length){
      window.dispatchEvent(new CustomEvent('scp:data-ready',{detail:{restored:false,count:local.length}}));
      return;
    }

    const snap=await firebase.firestore().collection('usuarios').doc(uid).collection('vendas').get();
    const cloud=snap.docs.map(doc=>({...doc.data(),id:doc.id}));
    if(!cloud.length){
      window.dispatchEvent(new CustomEvent('scp:data-ready',{detail:{restored:false,count:0}}));
      return;
    }

    const previous=localStorage.getItem(decisionKey(uid));
    if(previous==='restaurado')return;

    const accepted=confirm(`Encontramos ${cloud.length} venda(s) salvas na sua conta.\n\nDeseja restaurar suas vendas e relatórios neste aparelho?\n\nAs datas e os meses originais serão mantidos.`);
    if(!accepted){
      localStorage.setItem(decisionKey(uid),'adiado');
      window.dispatchEvent(new CustomEvent('scp:data-ready',{detail:{restored:false,count:0}}));
      return;
    }

    const unique=[...new Map(cloud.map(sale=>[saleId(sale),sale])).values()];
    localStorage.setItem(userKey(uid),JSON.stringify(unique));
    localStorage.setItem(STORAGE,JSON.stringify(unique));
    localStorage.setItem(OWNER,uid);
    localStorage.setItem(decisionKey(uid),'restaurado');
    try{vendas=unique}catch(_){}
    render();
    alert(`${unique.length} venda(s) restaurada(s) com sucesso. Os relatórios permaneceram nos meses corretos.`);
    window.dispatchEvent(new CustomEvent('scp:data-ready',{detail:{restored:true,count:unique.length}}));
  }catch(error){
    console.error('[Restauração após login] Falha:',error);
    window.dispatchEvent(new CustomEvent('scp:data-ready',{detail:{restored:false,error:true}}));
  }finally{
    running=false;
  }
}

function install(){
  removePrematureBackupPrompt();
  const observer=new MutationObserver(removePrematureBackupPrompt);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  const wait=()=>{
    if(!window.firebase||!firebase.apps?.length)return setTimeout(wait,100);
    firebase.auth().onAuthStateChanged(user=>{
      removePrematureBackupPrompt();
      if(user)setTimeout(()=>restoreAfterLogin(user),500);
    });
  };
  wait();
  window.__SCP_RESTORE_LOGIN_FLOW__=VERSION;
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
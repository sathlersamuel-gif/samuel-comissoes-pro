(function(){
'use strict';
const STORAGE='samuel_comissoes_pro';
const DELETED='samuel_comissoes_pro_excluidas';
const QUEUE='samuel_comissoes_pro_fila_sync';
const VERSION='2026.07.18.4';
let user=null,saving=false,pending=false,editingId=null;
const parse=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
const id=v=>String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`);
const current=()=>{try{return typeof vendas!=='undefined'&&Array.isArray(vendas)?vendas:parse(STORAGE)}catch(_){return parse(STORAGE)}};
const normalizeDeleted=list=>{const m=new Map();(list||[]).forEach(x=>{const r=typeof x==='object'&&x?x:{id:x};const k=String(r.id||'');if(!k)return;const old=m.get(k);if(!old||String(r.excluidaEm||'')>String(old.excluidaEm||''))m.set(k,{id:k,excluidaEm:r.excluidaEm||new Date().toISOString()})});return[...m.values()]};
const deleted=()=>normalizeDeleted(parse(DELETED));
const filterDeleted=(list,del)=>{const ids=new Set(normalizeDeleted(del).map(x=>String(x.id)));return(list||[]).filter(v=>!ids.has(id(v)))};
const merge=(a,b)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(v=>m.set(id(v),v));return[...m.values()]};
function apply(list,del=deleted()){
 const clean=filterDeleted(Array.isArray(list)?list:[],del);
 try{vendas=clean}catch(_){ }
 localStorage.setItem(STORAGE,JSON.stringify(clean));
 if(user)localStorage.setItem(`${STORAGE}:${user.uid}`,JSON.stringify(clean));
 try{atualizarDashboard?.()}catch(_){ }
 try{carregarHistorico?.()}catch(_){ }
 try{window.atualizarRelatorio?.()}catch(_){ }
 return clean;
}
function queue(){localStorage.setItem(QUEUE,JSON.stringify({pending:true,updatedAt:new Date().toISOString(),version:VERSION}));pending=true}
async function saveCloud(force=false){
 if(saving||!user||!window.firebase||!firebase.apps?.length){if(force)queue();return}
 saving=true;
 try{
  const list=apply(current()),del=deleted();
  await firebase.firestore().collection('usuarios').doc(user.uid).set({email:user.email||'',vendas:list,vendasExcluidas:del,sincronizacaoVersao:VERSION,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  localStorage.removeItem(QUEUE);pending=false;
 }catch(e){queue();console.error('[Dados] Falha ao salvar:',e)}
 finally{saving=false;if(pending&&navigator.onLine)setTimeout(()=>saveCloud(true),800)}
}
async function reconcile(){
 if(!user||!window.firebase||!firebase.apps?.length)return;
 try{
  const ref=firebase.firestore().collection('usuarios').doc(user.uid),snap=await ref.get(),cloud=snap.exists?snap.data():{};
  const del=normalizeDeleted([...deleted(),...(cloud.vendasExcluidas||[])]);localStorage.setItem(DELETED,JSON.stringify(del));
  const userLocal=parse(`${STORAGE}:${user.uid}`),local=userLocal.length?userLocal:current(),final=apply(merge(cloud.vendas||[],local),del);
  await ref.set({email:user.email||'',vendas:final,vendasExcluidas:del,sincronizacaoVersao:VERSION,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  localStorage.removeItem(QUEUE);pending=false;
 }catch(e){queue();console.error('[Dados] Falha ao reconciliar:',e)}
}
function save(){const list=apply(current());queue();saveCloud(true);return list}
function numberBR(value){const s=String(value??'').replace(/R\$/g,'').trim();if(!s)return 0;if(s.includes(','))return Number(s.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0;return Number(s.replace(/[^\d.-]/g,''))||0}
function installForm(){
 const form=document.getElementById('formVenda');if(!form||form.dataset.dataCore)return;form.dataset.dataCore='1';
 form.addEventListener('submit',e=>{
  e.preventDefault();e.stopImmediatePropagation();const get=x=>document.getElementById(x),p=numberBR(get('porcentagem')?.value),v=numberBR(get('valorVenda')?.value);
  const sale={id:editingId??Date.now(),cliente:get('cliente')?.value?.trim()||'',telefone:get('telefone')?.value||'',produto:get('produto')?.value?.trim()||'',tipo:get('tipoVenda')?.value||'',valor:v,porcentagem:p,comissao:v*p/100,data:get('dataVenda')?.value||new Date().toISOString().slice(0,10),observacao:get('observacao')?.value||''};
  let list=current();list=editingId!==null?list.map(x=>id(x)===String(editingId)?sale:x):[...list,sale];apply(list);save();editingId=null;form.reset();if(get('comissao'))get('comissao').value='';alert('Venda salva com sucesso!');try{voltarDashboard?.()}catch(_){ }
 },true);
}
window.excluirVenda=async function(saleId){if(!confirm('Excluir esta venda definitivamente?'))return;const sid=String(saleId),del=normalizeDeleted([...deleted(),{id:sid,excluidaEm:new Date().toISOString()}]);localStorage.setItem(DELETED,JSON.stringify(del));apply(current().filter(v=>id(v)!==sid),del);queue();await saveCloud(true)};
window.editarVenda=function(saleId){const sale=current().find(v=>id(v)===String(saleId));if(!sale)return;editingId=sale.id;try{abrirTela('novaVenda')}catch(_){ }const set=(k,v)=>{const el=document.getElementById(k);if(el)el.value=v??''};set('cliente',sale.cliente);set('telefone',sale.telefone);set('produto',sale.produto||sale.modelo);set('tipoVenda',sale.tipo);set('valorVenda',Number(sale.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));set('porcentagem',String(Number(sale.porcentagem||0).toFixed(1)).replace('.',','));set('dataVenda',sale.data);set('observacao',sale.observacao);try{calcularComissao?.()}catch(_){ }};
function install(){window.salvarBanco=save;installForm();const wait=()=>{if(!window.firebase||!firebase.apps?.length)return setTimeout(wait,100);firebase.auth().onAuthStateChanged(async u=>{user=u||null;if(!u)return;await reconcile();if(localStorage.getItem(QUEUE))await saveCloud(true)})};wait();window.addEventListener('online',reconcile);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveCloud(true)});window.addEventListener('pagehide',()=>saveCloud(true));setInterval(()=>{if(user&&(pending||localStorage.getItem(QUEUE)))saveCloud(true)},5000);window.__SCP_DATA_CORE__=VERSION}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
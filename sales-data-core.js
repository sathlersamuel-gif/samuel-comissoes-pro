(function(){
'use strict';
const STORAGE='samuel_comissoes_pro',DELETED='samuel_comissoes_pro_excluidas',QUEUE='samuel_comissoes_pro_fila_sync',VERSION='2026.07.18.4';
let user=null,saving=false,pending=false,editingId=null,lastUid='';
const read=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
const saleId=v=>String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`);
const userKey=uid=>`${STORAGE}:${uid}`;
const deletedKey=uid=>`${DELETED}:${uid}`;
const current=()=>{try{return typeof vendas!=='undefined'&&Array.isArray(vendas)?vendas:read(STORAGE)}catch(_){return read(STORAGE)}};
const normalizeDeleted=list=>{const m=new Map();(list||[]).forEach(x=>{const r=typeof x==='object'&&x?x:{id:x},k=String(r.id||'');if(!k)return;const old=m.get(k);if(!old||String(r.excluidaEm||'')>String(old.excluidaEm||''))m.set(k,{id:k,excluidaEm:r.excluidaEm||new Date().toISOString()})});return[...m.values()]};
const deleted=()=>normalizeDeleted(read(user?deletedKey(user.uid):DELETED));
const filterDeleted=(list,del)=>{const ids=new Set(normalizeDeleted(del).map(x=>String(x.id)));return(list||[]).filter(v=>!ids.has(saleId(v)))};
const merge=(a,b)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(v=>m.set(saleId(v),v));return[...m.values()]};
function render(){try{atualizarDashboard?.()}catch(_){ }try{carregarHistorico?.()}catch(_){ }try{window.atualizarRelatorio?.()}catch(_){ }}
function apply(list,del=deleted()){
 const clean=filterDeleted(Array.isArray(list)?list:[],del);try{vendas=clean}catch(_){ }
 localStorage.setItem(STORAGE,JSON.stringify(clean));if(user)localStorage.setItem(userKey(user.uid),JSON.stringify(clean));render();return clean;
}
function markPending(){localStorage.setItem(QUEUE,JSON.stringify({pending:true,uid:user?.uid||'',updatedAt:new Date().toISOString(),version:VERSION}));pending=true}
async function saveCloud(force=false){
 if(saving||!user||!window.firebase||!firebase.apps?.length){if(force&&user)markPending();return}
 saving=true;try{const list=apply(current()),del=deleted();await firebase.firestore().collection('usuarios').doc(user.uid).set({email:user.email||'',vendas:list,vendasExcluidas:del,sincronizacaoVersao:VERSION,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});localStorage.removeItem(QUEUE);pending=false}catch(e){markPending();console.error('[Dados] Falha ao salvar:',e)}finally{saving=false;if(pending&&navigator.onLine)setTimeout(()=>saveCloud(true),800)}}
async function reconcile(){
 if(!user||!window.firebase||!firebase.apps?.length)return;
 try{const ref=firebase.firestore().collection('usuarios').doc(user.uid),snap=await ref.get(),cloud=snap.exists?snap.data():{},local=read(userKey(user.uid)),del=normalizeDeleted([...read(deletedKey(user.uid)),...(cloud.vendasExcluidas||[])]);localStorage.setItem(deletedKey(user.uid),JSON.stringify(del));const final=apply(merge(cloud.vendas||[],local),del);await ref.set({email:user.email||'',vendas:final,vendasExcluidas:del,sincronizacaoVersao:VERSION,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});localStorage.removeItem(QUEUE);pending=false}catch(e){markPending();console.error('[Dados] Falha ao reconciliar:',e)}}
function save(){const list=apply(current());if(user){markPending();saveCloud(true)}return list}
function numberBR(value){const s=String(value??'').replace(/R\$/g,'').trim();if(!s)return 0;if(s.includes(','))return Number(s.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0;return Number(s.replace(/[^\d.-]/g,''))||0}
function percentText(value){const n=String(value??'').replace(/\D/g,'').slice(0,3);if(!n)return'';return n.length===1?n+',':`${n.slice(0,-1)},${n.slice(-1)}`}
function installForm(){const form=document.getElementById('formVenda');if(!form||form.dataset.dataCore)return;form.dataset.dataCore='1';const pct=document.getElementById('porcentagem');pct?.addEventListener('input',function(){this.value=percentText(this.value);try{calcularComissao?.()}catch(_){ }},true);document.getElementById('tipoVenda')?.addEventListener('change',()=>setTimeout(()=>{if(pct)try{calcularComissao?.()}catch(_){ }},0));form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const get=x=>document.getElementById(x),p=numberBR(get('porcentagem')?.value),v=numberBR(get('valorVenda')?.value),sale={id:editingId??Date.now(),cliente:get('cliente')?.value?.trim()||'',telefone:get('telefone')?.value||'',produto:get('produto')?.value?.trim()||'',tipo:get('tipoVenda')?.value||'',valor:v,porcentagem:p,comissao:v*p/100,data:get('dataVenda')?.value||new Date().toISOString().slice(0,10),observacao:get('observacao')?.value||''};let list=current();list=editingId!==null?list.map(x=>saleId(x)===String(editingId)?sale:x):[...list,sale];apply(list);save();editingId=null;form.reset();if(get('comissao'))get('comissao').value='';alert('Venda salva com sucesso!');try{voltarDashboard?.()}catch(_){ }},true)}
window.excluirVenda=async function(id){if(!confirm('Excluir esta venda definitivamente?'))return;const sid=String(id),del=normalizeDeleted([...deleted(),{id:sid,excluidaEm:new Date().toISOString()}]);if(user)localStorage.setItem(deletedKey(user.uid),JSON.stringify(del));else localStorage.setItem(DELETED,JSON.stringify(del));apply(current().filter(v=>saleId(v)!==sid),del);if(user){markPending();await saveCloud(true)}};
window.editarVenda=function(id){const sale=current().find(v=>saleId(v)===String(id));if(!sale)return;editingId=sale.id;try{abrirTela('novaVenda')}catch(_){ }const set=(k,v)=>{const el=document.getElementById(k);if(el)el.value=v??''};set('cliente',sale.cliente);set('telefone',sale.telefone);set('produto',sale.produto||sale.modelo);set('tipoVenda',sale.tipo);set('valorVenda',Number(sale.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));set('porcentagem',String(Number(sale.porcentagem||0).toFixed(1)).replace('.',','));set('dataVenda',sale.data);set('observacao',sale.observacao);try{calcularComissao?.()}catch(_){ }};
function onAuth(u){
 user=u||null;if(!u){lastUid='';try{vendas=[]}catch(_){ }localStorage.removeItem(STORAGE);render();return}
 if(lastUid&&lastUid!==u.uid){try{vendas=[]}catch(_){ }localStorage.removeItem(STORAGE)}lastUid=u.uid;const own=read(userKey(u.uid));apply(own,read(deletedKey(u.uid)));reconcile();const q=JSON.parse(localStorage.getItem(QUEUE)||'null');if(q?.uid===u.uid)saveCloud(true)
}
function install(){window.salvarBanco=save;installForm();const wait=()=>{if(!window.firebase||!firebase.apps?.length)return setTimeout(wait,100);firebase.auth().onAuthStateChanged(onAuth)};wait();window.addEventListener('online',()=>{if(user)reconcile()});window.addEventListener('scp:auth-ready',()=>{const u=firebase.auth().currentUser;if(u)onAuth(u)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&user)saveCloud(true)});window.addEventListener('pagehide',()=>{if(user)saveCloud(true)});setInterval(()=>{if(user&&(pending||localStorage.getItem(QUEUE)))saveCloud(true)},5000);window.__SCP_DATA_CORE__=VERSION}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
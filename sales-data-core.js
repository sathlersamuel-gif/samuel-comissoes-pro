(function(){
'use strict';

const STORAGE='samuel_comissoes_pro';
const DELETED='samuel_comissoes_pro_excluidas';
const QUEUE='samuel_comissoes_pro_fila_sync';
const OWNER='scp_usuario_atual';
const VERSION='2026.07.20.3';
const MIGRATION_VERSION=1;
const BATCH_LIMIT=400;

let user=null;
let saving=false;
let pending=false;
let lastUid='';

const read=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
const readObject=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){return{}};
const saleId=v=>String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`);
const userKey=uid=>`${STORAGE}:${uid}`;
const deletedKey=uid=>`${DELETED}:${uid}`;
const queueKey=uid=>`${QUEUE}:${uid}`;
const userRef=uid=>firebase.firestore().collection('usuarios').doc(uid);
const salesRef=uid=>userRef(uid).collection('vendas');
const deletedRef=uid=>userRef(uid).collection('vendasExcluidas');

const current=()=>{try{return typeof vendas!=='undefined'&&Array.isArray(vendas)?vendas:read(STORAGE)}catch(_){return read(STORAGE)}};

const normalizeDeleted=list=>{
  const m=new Map();
  (list||[]).forEach(x=>{
    const r=typeof x==='object'&&x?x:{id:x};
    const k=String(r.id||'');
    if(!k)return;
    const old=m.get(k);
    if(!old||String(r.excluidaEm||'')>String(old.excluidaEm||'')){
      m.set(k,{id:k,excluidaEm:r.excluidaEm||new Date().toISOString()});
    }
  });
  return[...m.values()];
};

const deleted=()=>normalizeDeleted(read(user?deletedKey(user.uid):DELETED));
const filterDeleted=(list,del)=>{
  const ids=new Set(normalizeDeleted(del).map(x=>String(x.id)));
  return(list||[]).filter(v=>!ids.has(saleId(v)));
};
const merge=(a,b)=>{
  const m=new Map();
  [...(a||[]),...(b||[])].forEach(v=>m.set(saleId(v),v));
  return[...m.values()];
};

function render(){
  try{if(typeof atualizarDashboard==='function')atualizarDashboard()}catch(_){}
  try{if(typeof carregarHistorico==='function')carregarHistorico()}catch(_){}
  try{if(typeof window.atualizarRelatorio==='function')window.atualizarRelatorio()}catch(_){}
}

function apply(list,del=deleted()){
  const clean=filterDeleted(Array.isArray(list)?list:[],del);
  try{vendas=clean}catch(_){}
  localStorage.setItem(STORAGE,JSON.stringify(clean));
  if(user){
    localStorage.setItem(userKey(user.uid),JSON.stringify(clean));
    localStorage.setItem(OWNER,user.uid);
  }
  render();
  return clean;
}

function markPending(mode='merge'){
  if(!user)return;
  const old=readObject(queueKey(user.uid));
  const finalMode=old.mode==='replace'||mode==='replace'?'replace':'merge';
  localStorage.setItem(queueKey(user.uid),JSON.stringify({
    pending:true,mode:finalMode,uid:user.uid,
    updatedAt:new Date().toISOString(),version:VERSION
  }));
  pending=true;
}

async function commitOperations(operations){
  for(let i=0;i<operations.length;i+=BATCH_LIMIT){
    const batch=firebase.firestore().batch();
    operations.slice(i,i+BATCH_LIMIT).forEach(op=>{
      if(op.type==='set')batch.set(op.ref,op.data,{merge:op.merge!==false});
      else if(op.type==='delete')batch.delete(op.ref);
    });
    await batch.commit();
  }
}

async function migrateLegacy(uid){
  const ref=userRef(uid);
  const snap=await ref.get();
  const data=snap.exists?snap.data():{};
  if(Number(data.vendasSubcolecaoVersao||0)>=MIGRATION_VERSION)return;

  const legacySales=Array.isArray(data.vendas)?data.vendas:[];
  const legacyDeleted=normalizeDeleted(data.vendasExcluidas||[]);
  const operations=[];

  legacySales.forEach(sale=>{
    const id=saleId(sale);
    operations.push({
      type:'set',
      ref:salesRef(uid).doc(id),
      data:{...sale,id,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()}
    });
  });

  legacyDeleted.forEach(item=>{
    operations.push({
      type:'set',
      ref:deletedRef(uid).doc(String(item.id)),
      data:{...item,id:String(item.id)}
    });
    operations.push({type:'delete',ref:salesRef(uid).doc(String(item.id))});
  });

  await commitOperations(operations);
  await ref.set({
    vendasSubcolecaoVersao:MIGRATION_VERSION,
    sincronizacaoVersao:VERSION,
    migradoEm:firebase.firestore.FieldValue.serverTimestamp(),
    legadoPreservado:true
  },{merge:true});
}

async function readCloud(uid){
  await migrateLegacy(uid);
  const [salesSnap,deletedSnap]=await Promise.all([
    salesRef(uid).get(),
    deletedRef(uid).get()
  ]);
  return{
    sales:salesSnap.docs.map(d=>({...d.data(),id:d.id})),
    deleted:normalizeDeleted(deletedSnap.docs.map(d=>({...d.data(),id:d.id})))
  };
}

async function replaceCloud(uid,list){
  const [salesSnap,deletedSnap]=await Promise.all([
    salesRef(uid).get(),
    deletedRef(uid).get()
  ]);
  const operations=[];
  salesSnap.docs.forEach(d=>operations.push({type:'delete',ref:d.ref}));
  deletedSnap.docs.forEach(d=>operations.push({type:'delete',ref:d.ref}));
  list.forEach(sale=>{
    const id=saleId(sale);
    operations.push({
      type:'set',
      ref:salesRef(uid).doc(id),
      data:{...sale,id,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()}
    });
  });
  await commitOperations(operations);
}

async function saveCloud(force=false){
  if(saving||!user||!window.firebase||!firebase.apps?.length){
    if(force&&user)markPending();
    return;
  }

  const uid=user.uid;
  saving=true;
  try{
    await migrateLegacy(uid);
    const queue=readObject(queueKey(uid));
    const replace=queue.mode==='replace';
    const list=replace?apply(current(),[]):apply(current());
    const del=replace?[]:deleted();

    if(replace){
      await replaceCloud(uid,list);
    }else{
      const operations=[];
      list.forEach(sale=>{
        const id=saleId(sale);
        operations.push({
          type:'set',
          ref:salesRef(uid).doc(id),
          data:{...sale,id,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()}
        });
      });
      del.forEach(item=>{
        const id=String(item.id);
        operations.push({
          type:'set',
          ref:deletedRef(uid).doc(id),
          data:{...item,id}
        });
        operations.push({type:'delete',ref:salesRef(uid).doc(id)});
      });
      await commitOperations(operations);
    }

    await userRef(uid).set({
      email:user.email||'',
      vendasSubcolecaoVersao:MIGRATION_VERSION,
      sincronizacaoVersao:VERSION,
      atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});

    localStorage.removeItem(queueKey(uid));
    pending=false;
  }catch(e){
    markPending();
    console.error('[Dados] Falha ao salvar:',e);
  }finally{
    saving=false;
    if(pending&&navigator.onLine&&user?.uid===uid)setTimeout(()=>saveCloud(true),800);
  }
}

async function reconcile(){
  if(!user||!window.firebase||!firebase.apps?.length)return;
  const uid=user.uid;
  try{
    const queue=readObject(queueKey(uid));
    const replace=queue.mode==='replace';

    if(replace){
      const final=apply(read(userKey(uid)),[]);
      localStorage.setItem(deletedKey(uid),'[]');
      await replaceCloud(uid,final);
      await userRef(uid).set({
        email:user.email||'',
        vendasSubcolecaoVersao:MIGRATION_VERSION,
        sincronizacaoVersao:VERSION,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      localStorage.removeItem(queueKey(uid));
      pending=false;
      return;
    }

    const cloud=await readCloud(uid);
    const local=read(userKey(uid));
    const del=normalizeDeleted([...read(deletedKey(uid)),...cloud.deleted]);
    localStorage.setItem(deletedKey(uid),JSON.stringify(del));
    const final=apply(merge(cloud.sales,local),del);
    markPending();
    await saveCloud(true);
    return final;
  }catch(e){
    markPending();
    console.error('[Dados] Falha ao reconciliar:',e);
  }
}

function save(){
  const list=apply(current());
  if(user){markPending();saveCloud(true)}
  return list;
}

function numberBR(value){
  const s=String(value??'').replace(/R\$/g,'').trim();
  if(!s)return 0;
  if(s.includes(','))return Number(s.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0;
  return Number(s.replace(/[^\d.-]/g,''))||0;
}

function percentText(value){
  const n=String(value??'').replace(/\D/g,'').slice(0,3);
  if(!n)return'';
  return n.length===1?n+',':`${n.slice(0,-1)},${n.slice(-1)}`;
}

function installForm(){
  const form=document.getElementById('formVenda');
  if(!form||form.dataset.dataCore)return;
  form.dataset.dataCore='1';
  const pct=document.getElementById('porcentagem');

  pct?.addEventListener('input',function(){
    this.value=percentText(this.value);
    try{if(typeof calcularComissao==='function')calcularComissao()}catch(_){}
  },true);

  document.getElementById('tipoVenda')?.addEventListener('change',()=>setTimeout(()=>{
    if(pct)try{if(typeof calcularComissao==='function')calcularComissao()}catch(_){}
  },0));

  form.addEventListener('submit',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const get=x=>document.getElementById(x);
    const editId=form.dataset.editingId||'';
    const wasEditing=editId!=='';
    const p=numberBR(get('porcentagem')?.value);
    const v=numberBR(get('valorVenda')?.value);
    const sale={
      id:wasEditing?editId:Date.now(),
      cliente:get('cliente')?.value?.trim()||'',
      telefone:get('telefone')?.value||'',
      produto:get('produto')?.value?.trim()||'',
      tipo:get('tipoVenda')?.value||'',
      valor:v,porcentagem:p,comissao:v*p/100,
      data:get('dataVenda')?.value||new Date().toISOString().slice(0,10),
      observacao:get('observacao')?.value||''
    };
    let list=current();
    list=wasEditing
      ?list.map(x=>saleId(x)===String(editId)?{...x,...sale,id:x.id}:x)
      :[...list,sale];
    apply(list);
    save();
    delete form.dataset.editingId;
    form.reset();
    if(get('comissao'))get('comissao').value='';
    const btn=form.querySelector("button[type='submit']");
    if(btn)btn.textContent='SALVAR VENDA';
    alert(wasEditing?'Venda atualizada com sucesso!':'Venda salva com sucesso!');
    try{if(typeof voltarDashboard==='function')voltarDashboard()}catch(_){}
  },true);
}

window.excluirVenda=async function(id){
  if(!confirm('Excluir esta venda definitivamente?'))return false;
  const sid=String(id);
  const del=normalizeDeleted([...deleted(),{id:sid,excluidaEm:new Date().toISOString()}]);
  if(user)localStorage.setItem(deletedKey(user.uid),JSON.stringify(del));
  else localStorage.setItem(DELETED,JSON.stringify(del));
  apply(current().filter(v=>saleId(v)!==sid),del);
  if(user){markPending();await saveCloud(true)}
  return true;
};

window.editarVenda=function(id){
  const sale=current().find(v=>saleId(v)===String(id));
  if(!sale)return;
  const form=document.getElementById('formVenda');
  if(form)form.dataset.editingId=saleId(sale);
  try{if(typeof abrirTela==='function')abrirTela('novaVenda')}catch(_){}
  const set=(k,v)=>{const el=document.getElementById(k);if(el)el.value=v??''};
  set('cliente',sale.cliente);
  set('telefone',sale.telefone);
  set('produto',sale.produto||sale.modelo);
  set('tipoVenda',sale.tipo||sale.tipoVenda);
  set('valorVenda',Number(sale.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
  set('porcentagem',String(Number(sale.porcentagem||0).toFixed(1)).replace('.',','));
  set('dataVenda',sale.data);
  set('observacao',sale.observacao);
  const btn=document.querySelector("#formVenda button[type='submit']");
  if(btn)btn.textContent='SALVAR ALTERAÇÕES';
  try{if(typeof calcularComissao==='function')calcularComissao()}catch(_){}
};

async function restoreBackup(list){
  if(!Array.isArray(list))throw new Error('Backup inválido');
  const normalized=list
    .filter(v=>v&&typeof v==='object')
    .map((v,i)=>({...v,id:v.id??Date.now()+i}));
  if(normalized.length!==list.length)throw new Error('Backup inválido');
  if(user)localStorage.setItem(deletedKey(user.uid),'[]');
  else localStorage.setItem(DELETED,'[]');
  apply(normalized,[]);
  if(user){markPending('replace');await saveCloud(true)}
  return normalized;
}

function installBackupImport(){
  const old=document.getElementById('importarBackup');
  if(!old||old.dataset.dataCore)return;
  const button=old.cloneNode(true);
  button.dataset.dataCore='1';
  old.replaceWith(button);
  button.addEventListener('click',()=>{
    const input=document.createElement('input');
    input.type='file';
    input.accept='.json,application/json';
    input.addEventListener('change',()=>{
      const file=input.files?.[0];
      if(!file)return;
      const reader=new FileReader();
      reader.onload=async()=>{
        try{
          const data=JSON.parse(String(reader.result||''));
          const list=Array.isArray(data)?data:Array.isArray(data?.vendas)?data.vendas:null;
          if(!list)throw new Error('Backup inválido');
          if(!confirm(`Foram encontradas ${list.length} venda(s). Deseja substituir os dados atuais por este backup?`))return;
          await restoreBackup(list);
          alert(`Backup importado com sucesso! ${list.length} venda(s) restaurada(s).`);
          try{if(typeof abrirTela==='function')abrirTela('dashboard')}catch(_){}
        }catch(e){
          console.error(e);
          alert('Não foi possível importar o backup. Selecione um arquivo JSON exportado pelo aplicativo.');
        }
      };
      reader.onerror=()=>alert('Não foi possível ler o arquivo selecionado.');
      reader.readAsText(file,'UTF-8');
    });
    input.click();
  });
}

function onAuth(u){
  user=u||null;
  if(!u){
    lastUid='';
    pending=false;
    try{vendas=[]}catch(_){}
    localStorage.removeItem(STORAGE);
    localStorage.removeItem(OWNER);
    render();
    return;
  }
  if(lastUid&&lastUid!==u.uid){
    try{vendas=[]}catch(_){}
    localStorage.removeItem(STORAGE);
  }
  lastUid=u.uid;
  let own=read(userKey(u.uid));
  const legacyOwner=localStorage.getItem(OWNER);
  const legacy=read(STORAGE);
  if(!own.length&&legacy.length&&legacyOwner===u.uid){
    own=legacy;
    localStorage.setItem(userKey(u.uid),JSON.stringify(own));
  }
  apply(own,read(deletedKey(u.uid)));
  pending=Boolean(localStorage.getItem(queueKey(u.uid)));
  reconcile();
  if(pending)saveCloud(true);
}

function install(){
  window.salvarBanco=save;
  installForm();
  installBackupImport();
  window.editarVendaSegura=id=>window.editarVenda(id);
  window.excluirVendaSegura=async function(id,ano,mes){
    const ok=await window.excluirVenda(id);
    if(ok&&typeof window.abrirMesAno==='function')window.abrirMesAno(ano,mes);
  };
  window.SCPDataCore={version:VERSION,restoreBackup,reconcile};
  const wait=()=>{
    if(!window.firebase||!firebase.apps?.length)return setTimeout(wait,100);
    firebase.auth().onAuthStateChanged(onAuth);
  };
  wait();
  window.addEventListener('online',()=>{if(user)reconcile()});
  window.addEventListener('scp:auth-ready',()=>{
    const u=firebase.auth().currentUser;
    if(u)onAuth(u);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&user)saveCloud(true);
  });
  window.addEventListener('pagehide',()=>{if(user)saveCloud(true)});
  setInterval(()=>{
    if(user&&(pending||localStorage.getItem(queueKey(user.uid))))saveCloud(true);
  },5000);
  window.__SCP_DATA_CORE__=VERSION;
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
})();

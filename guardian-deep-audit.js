(function(){
'use strict';
const VERSION='guardia-profunda-4.0.0';
const RESULT_KEY='scp_guardian_deep_audit_result';
const ERROR_KEY='scp_guardian_runtime_errors';
const INTERVAL=4*60*1000;
let running=false;
const safeJson=(v,f=null)=>{try{return JSON.parse(v);}catch(_){return f;}};
const item=(name,ok,detail,severity='important',code='')=>({name,ok:Boolean(ok),detail:String(detail||''),severity,code});
const currentUser=()=>{try{return window.firebase?.auth?.()?.currentUser||window.SCPAuth?.getUser?.()||null;}catch(_){return null;}};
const active=()=>localStorage.getItem('scp_guardian_active_cache')==='1'||Boolean(window.SCPGuardian?.active);
const temporaryOffline=m=>/client is offline|network request failed|failed to fetch|unavailable|offline/i.test(String(m||''));
function runtimeErrorsCheck(){
 const all=safeJson(localStorage.getItem(ERROR_KEY),[])||[];
 const recent=all.filter(e=>!temporaryOffline(e.message)&&Date.now()-Date.parse(e.at)<24*60*60*1000);
 return item('Erros reais de execução',recent.length===0,recent.length?`${recent.length} erro(s) real(is) capturado(s). Último: ${recent.at(-1).message}`:'Nenhum erro JavaScript recente capturado.','critical','runtime-errors');
}
function structureCheck(){
 const ids=['dashboard','novaVenda','historico','relatorios','formVenda','listaMeses','resultadoRelatorio'];
 const funcs=['abrirTela','voltarDashboard','atualizarDashboard','carregarHistorico'];
 const missing=[...ids.filter(id=>!document.getElementById(id)),...funcs.filter(n=>typeof window[n]!=='function')];
 return item('Estrutura integral das funções principais',!missing.length,missing.length?`Ausências: ${missing.join(', ')}.`:'Telas, formulários e funções centrais estão presentes.','critical','core-structure');
}
function navigationCheck(){
 const nav=document.querySelector('.bottom');
 const buttons=[...document.querySelectorAll('.bottom button')];
 const ok=Boolean(nav)&&buttons.length>=4&&buttons.every(b=>b.isConnected&&!b.disabled);
 return item('Navegação e botões principais',ok,ok?`Barra disponível com ${buttons.length} botões.`:'Barra inferior ausente ou com botão desativado.','critical','navigation');
}
function dataCheck(){
 const raw=localStorage.getItem('samuel_comissoes_pro');
 if(raw===null)return item('Integridade das vendas',true,'Nenhuma venda local neste aparelho; estrutura pronta para uso.','critical','sales-data');
 const sales=safeJson(raw,null);
 if(!Array.isArray(sales))return item('Integridade das vendas',false,'Banco local não contém uma lista válida. Nenhum dado foi apagado.','critical','sales-data');
 const invalid=sales.filter(s=>!s||typeof s!=='object'||s.id===undefined||!('valor' in s));
 return item('Integridade das vendas',!invalid.length,invalid.length?`${invalid.length} registro(s) incompleto(s) entre ${sales.length}.`:`${sales.length} venda(s) verificadas sem corrupção estrutural.`,'critical','sales-data');
}
async function serviceWorkerCheck(){
 if(!('serviceWorker' in navigator))return item('Atualização e funcionamento offline',false,'Service Worker não suportado.','warning','service-worker');
 try{const r=await navigator.serviceWorker.getRegistration();return item('Atualização e funcionamento offline',Boolean(r),r?'Service Worker registrado.':'Service Worker não registrado.','important','service-worker');}catch(e){return item('Atualização e funcionamento offline',false,e.message,'important','service-worker');}
}
async function firebaseCheck(){
 const user=currentUser();
 if(!user)return item('Login e Firebase',false,'Nenhum usuário autenticado.','critical','firebase');
 if(!window.firebase?.apps?.length)return item('Login e Firebase',false,'Firebase não inicializado.','critical','firebase');
 if(!navigator.onLine)return item('Login e Firebase',true,'Aparelho offline; confirmação será repetida quando a conexão voltar.','warning','firebase');
 try{await firebase.firestore().collection('monitor_dispositivos').doc(window.SCPGuardian?.deviceId||user.uid).set({uid:user.uid,email:user.email||'',auditoriaProfunda:VERSION,ultimaAuditoriaProfunda:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});return item('Login e Firebase',true,'Autenticação e gravação confirmadas.','critical','firebase');}catch(e){return item('Login e Firebase',temporaryOffline(e?.message),temporaryOffline(e?.message)?'Conexão temporariamente indisponível.':`${e.code||'erro'}: ${e.message||e}`,'critical','firebase');}
}
async function repositoryMapCheck(){
 try{const r=await fetch(`guardian-app-manifest.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const m=await r.json();const files=Array.isArray(m.files)?m.files:[];return item('Conhecimento do repositório',files.length>=25,files.length>=25?`Mapa integral carregado com ${files.length} arquivos.`:`Mapa incompleto com ${files.length} arquivos.`,'important','repository-map');}catch(e){return item('Conhecimento do repositório',false,`Não foi possível ler o mapa: ${e.message}`,'important','repository-map');}
}
async function cleanupOldDeepAudits(db,user,keepId){
 try{
  const snap=await db.collection('monitor_erros').where('uid','==',user.uid).get();
  const batch=db.batch();let changed=0;
  snap.docs.forEach(doc=>{const d=doc.data();if(d.tipo==='auditoria-profunda'&&doc.id!==keepId){batch.delete(doc.ref);changed++;}});
  if(changed)await batch.commit();
 }catch(e){console.warn('IA Guardiã: limpeza de duplicados pendente',e);}
}
async function save(checks){
 const failures=checks.filter(c=>!c.ok);
 const result={version:VERSION,at:new Date().toISOString(),checks,failures:failures.length};
 localStorage.setItem(RESULT_KEY,JSON.stringify(result));
 window.dispatchEvent(new CustomEvent('scp-guardian-deep-audit-complete',{detail:result}));
 const user=currentUser();
 if(!user||!window.firebase?.apps?.length||!navigator.onLine)return result;
 const db=firebase.firestore();
 const deviceId=window.SCPGuardian?.deviceId||localStorage.getItem('scp_guardian_device_id')||user.uid;
 const docId=`deep_${user.uid}_${String(deviceId).replace(/[^a-zA-Z0-9_-]/g,'_')}`;
 const ref=db.collection('monitor_erros').doc(docId);
 try{
  if(!failures.length){await ref.delete().catch(()=>{});await cleanupOldDeepAudits(db,user,docId);return result;}
  await ref.set({app:'Samuel Comissões PRO',versao:VERSION,tipo:'auditoria-profunda',mensagem:`Auditoria profunda encontrou ${failures.length} problema(s): ${failures.map(f=>f.name).join(', ')}.`,gravidade:failures.some(f=>f.severity==='critical')?'critico':'importante',status:'novo',uid:user.uid,email:user.email||'',deviceId,contexto:result,criadoEmLocal:new Date().toISOString(),criadoEm:firebase.firestore.FieldValue.serverTimestamp(),origem:'ia-guardia-profunda'},{merge:true});
  await cleanupOldDeepAudits(db,user,docId);
 }catch(e){console.warn('IA Guardiã: auditoria profunda pendente',e);}
 return result;
}
async function run(forced=false){
 if(running||(!forced&&!active()))return null;
 running=true;
 try{return await save([structureCheck(),navigationCheck(),dataCheck(),runtimeErrorsCheck(),await serviceWorkerCheck(),await repositoryMapCheck(),await firebaseCheck()]);}finally{running=false;}
}
function start(){
 setTimeout(()=>run(true),8000);
 setInterval(()=>run(false),INTERVAL);
 window.addEventListener('online',()=>setTimeout(()=>run(true),1800));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>run(false),1600);});
 window.SCPGuardianDeepAudit={run:()=>run(true),version:VERSION,get last(){return safeJson(localStorage.getItem(RESULT_KEY),null);},get errors(){return safeJson(localStorage.getItem(ERROR_KEY),[])||[];},clearErrors(){localStorage.removeItem(ERROR_KEY);}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
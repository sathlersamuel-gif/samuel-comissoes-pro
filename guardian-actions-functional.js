(function(){
'use strict';
const VERSION='guardian-actions-functional-1.0.0';
const ADMIN='sathlersamuel@gmail.com';
const CURRENT_CACHE='samuel-comissoes-pro-v109';
const RUNTIME_ERRORS='scp_guardian_runtime_errors';
const LAST_REPORT='scp_guardian_unified_report';
let busy=false;

function user(){try{return window.firebase?.auth?.()?.currentUser||window.SCPAuth?.getUser?.()||null;}catch(_){return null;}}
function isAdmin(){return String(user()?.email||'').trim().toLowerCase()===ADMIN;}
function safeParse(v,f){try{return JSON.parse(v);}catch(_){return f;}}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function label(check){return check.name||check.item||check.nome||check.area||'Verificação';}
function detail(check){return check.detail||check.detalhe||check.message||'Sem detalhes';}
function code(check){return check.code||check.item||label(check).toLowerCase().replace(/\s+/g,'-');}

function normalizeFailed(source){
  const list=Array.isArray(source?.checks)?source.checks:[];
  return list.filter(item=>item&&item.ok===false).map(item=>({name:label(item),detail:detail(item),code:code(item),severity:item.severity||'important',source:item.source||''}));
}
function dedupe(items){const seen=new Set();return items.filter(item=>{const key=`${item.code}|${item.detail}`;if(seen.has(key))return false;seen.add(key);return true;});}
function removeFalsePositives(items){
  return items.filter(item=>{
    if(item.code==='navigation'){
      const nav=document.querySelector('.bottom');
      const buttons=[...document.querySelectorAll('.bottom button')];
      if(nav&&buttons.length>=4&&buttons.every(button=>!button.disabled))return false;
    }
    return true;
  });
}

async function unifiedAudit(){
  let deep=null,basic=null;
  try{deep=await window.SCPGuardianDeepAudit?.run?.();}catch(error){deep={checks:[{ok:false,name:'Auditoria profunda',detail:error.message,code:'deep-audit-call',severity:'critical'}]};}
  try{basic=await window.SCPGuardianAutoFix?.audit?.();}catch(error){basic={checks:[{ok:false,item:'Auditoria básica',detail:error.message,area:'auditoria'}]};}
  if(!deep)deep=window.SCPGuardianDeepAudit?.last||safeParse(localStorage.getItem('scp_guardian_deep_audit_result'),null);
  if(!basic)basic=window.SCPGuardianAutoFix?.report||safeParse(localStorage.getItem('scp_guardian_last_full_report'),null);
  const failed=removeFalsePositives(dedupe([...normalizeFailed(deep),...normalizeFailed(basic)]));
  const report={version:VERSION,createdAt:new Date().toISOString(),url:location.href,user:user()?.email||null,device:navigator.userAgent,deep,basic,failed};
  localStorage.setItem(LAST_REPORT,JSON.stringify(report));
  return report;
}

function reportText(report){
  const lines=['DIAGNÓSTICO COMPLETO — IA GUARDIÃ',`Data: ${new Date(report.createdAt).toLocaleString('pt-BR')}`,`Usuário: ${report.user||'não identificado'}`,`Página: ${report.url}`,`Dispositivo: ${report.device}`,''];
  if(!report.failed.length)lines.push('✓ Nenhuma falha detectada na verificação atual.');
  else report.failed.forEach((item,index)=>lines.push(`${index+1}. ⚠ ${item.name}\n   Código: ${item.code}\n   Detalhe: ${item.detail}`));
  const runtime=safeParse(localStorage.getItem(RUNTIME_ERRORS),[])||[];
  if(runtime.length){lines.push('','ERROS DE EXECUÇÃO CAPTURADOS:');runtime.slice(-15).forEach((item,index)=>lines.push(`${index+1}. ${item.at||''} — ${item.message||item.kind||'Erro'}${item.source?` (${item.source}:${item.line||0})`:''}`));}
  return lines.join('\n');
}

function manualCopy(text){
  let overlay=document.getElementById('guardianCopyOverlay');
  if(overlay)overlay.remove();
  overlay=document.createElement('div');overlay.id='guardianCopyOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,8,24,.88);display:flex;align-items:center;justify-content:center;padding:18px';
  overlay.innerHTML=`<div style="width:min(680px,100%);max-height:88vh;background:#fff;border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:12px"><b style="font-size:20px;color:#09264f">Copiar diagnóstico</b><p style="margin:0;color:#42546b">Toque no texto, selecione tudo e escolha Copiar.</p><textarea readonly style="width:100%;height:52vh;box-sizing:border-box;border:1px solid #9fb2c9;border-radius:12px;padding:12px;font-size:14px;color:#102a4c;background:#f7faff"></textarea><div style="display:flex;gap:10px"><button type="button" data-select style="flex:1;padding:13px;border:0;border-radius:12px;background:#0d4b91;color:#fff;font-weight:800">Selecionar texto</button><button type="button" data-close style="flex:1;padding:13px;border:1px solid #9fb2c9;border-radius:12px;background:#fff;color:#17375e;font-weight:800">Fechar</button></div></div>`;
  const area=overlay.querySelector('textarea');area.value=text;
  overlay.querySelector('[data-select]').onclick=()=>{area.focus();area.select();area.setSelectionRange(0,area.value.length);};
  overlay.querySelector('[data-close]').onclick=()=>overlay.remove();
  document.body.appendChild(overlay);setTimeout(()=>{area.focus();area.select();area.setSelectionRange(0,area.value.length);},100);
}

async function copyReport(report){
  const text=reportText(report);
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch(_){ }
  try{const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;opacity:0;left:-9999px';document.body.appendChild(area);area.select();area.setSelectionRange(0,area.value.length);const ok=document.execCommand('copy');area.remove();if(ok)return true;}catch(_){ }
  manualCopy(text);return false;
}

async function refreshWorkerAndCaches(){
  const actions=[];
  try{
    if('caches' in window){const keys=await caches.keys();const old=keys.filter(name=>name.startsWith('samuel-comissoes-pro-')&&name!==CURRENT_CACHE);await Promise.all(old.map(name=>caches.delete(name)));actions.push(`${old.length} cache(s) antigo(s) removido(s)`);}
  }catch(error){actions.push(`cache: ${error.message}`);}
  try{
    if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){await reg.update().catch(()=>{});if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});}actions.push('Service Worker atualizado');}
  }catch(error){actions.push(`Service Worker: ${error.message}`);}
  localStorage.setItem('scp_guardian_active_cache','1');
  return actions;
}

function localFixable(item){return ['service-worker','resources','navigation','event-loop','blocking-layer'].includes(item.code)||/cache|service worker|arquivo|navegação|travamento/i.test(`${item.name} ${item.detail}`);}
async function repair(){
  if(!isAdmin()){alert('Somente o administrador pode autorizar correções.');return;}
  const before=await unifiedAudit();
  if(!before.failed.length){alert('A verificação completa não encontrou falhas ativas neste momento.');return;}
  const summary=before.failed.map((item,index)=>`${index+1}. ${item.name}: ${item.detail}`).join('\n');
  if(!confirm(`Foram encontradas ${before.failed.length} falha(s):\n\n${summary}\n\nAutoriza a manutenção segura deste aparelho e o envio das falhas de código para correção?`))return;
  const actions=await refreshWorkerAndCaches();
  try{await window.SCPGuardian?.heartbeat?.(true);}catch(_){ }
  const after=await unifiedAudit();
  const codeFailures=after.failed.filter(item=>!localFixable(item));
  if(codeFailures.length)await requestFix(after,true);
  alert(`Manutenção concluída.\n\n${actions.join('\n')}\n\nFalhas restantes: ${after.failed.length}.${codeFailures.length?' As falhas que exigem mudança no código foram registradas para correção.':''}`);
}

async function requestFix(report,silent=false){
  const current=user();
  const payload={app:'Samuel Comissões PRO',status:'novo',prioridade:report.failed.length?'alta':'normal',resumo:`${report.failed.length} falha(s) da auditoria unificada`,falhas:report.failed,relatorio:report,uid:current?.uid||null,email:current?.email||null,criadoEmLocal:new Date().toISOString(),pagina:location.pathname,origem:VERSION};
  try{
    const db=window.firebase?.firestore?.();if(!db||!current)throw new Error('Firebase não disponível');
    await db.collection('guardian_fix_requests').add({...payload,criadoEm:window.firebase.firestore.FieldValue.serverTimestamp()});
    if(!silent)alert('Solicitação de correção registrada com o diagnóstico completo.');return true;
  }catch(error){localStorage.setItem('scp_guardian_pending_fix',JSON.stringify(payload));if(!silent)alert('A solicitação foi salva neste aparelho e será reenviada quando o Firebase estiver disponível.');return false;}
}

async function diagnose(){
  const report=await unifiedAudit();
  if(!report.failed.length){alert('Diagnóstico completo concluído: nenhuma falha ativa foi encontrada agora.');return;}
  alert(`Diagnóstico completo encontrou ${report.failed.length} falha(s):\n\n${report.failed.map((item,index)=>`${index+1}. ${item.name}: ${item.detail}`).join('\n\n')}`);
}

async function handle(id,button){
  if(busy)return;busy=true;const old=button?.textContent;if(button){button.disabled=true;button.textContent='Aguarde...';}
  try{
    if(id==='guardiaDiagnostico'||id==='guardianFullAudit')await diagnose();
    else if(id==='guardianAutoFix')await repair();
    else if(id==='guardianRequestFix'){const report=await unifiedAudit();await requestFix(report);}
    else if(id==='guardianCopyReport'){const report=await unifiedAudit();const copied=await copyReport(report);if(copied)alert('Diagnóstico completo copiado.');}
  }catch(error){console.error('IA Guardiã — ação falhou',error);alert(`Não foi possível concluir a ação: ${error.message||error}`);}
  finally{if(button){button.disabled=false;button.textContent=old;}busy=false;}
}

document.addEventListener('click',event=>{
  const button=event.target?.closest?.('#guardiaDiagnostico,#guardianFullAudit,#guardianAutoFix,#guardianRequestFix,#guardianCopyReport');
  if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  handle(button.id,button);
},true);

window.SCPGuardianFunctionalActions={version:VERSION,audit:unifiedAudit,copy:async()=>copyReport(await unifiedAudit()),repair,request:async()=>requestFix(await unifiedAudit())};
})();
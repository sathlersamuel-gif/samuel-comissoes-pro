(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  const REQUIRED_ELEMENTS=['dashboard','formVenda','listaMeses','resultadoRelatorio'];
  const REQUIRED_FUNCTIONS=['abrirTela','voltarDashboard'];
  const REQUIRED_ASSETS=['script.js','firebase-integration.js','ai-monitor.js','ia-guardia-24h.js','dashboard-v2.js','report-options-fix.js','user-management-modern-v2.js'];
  const LAST_REPORT='scp_guardian_last_full_report';
  let lastReport=null;

  function currentUser(){
    try{return window.firebase?.auth?.().currentUser||window.SCPAuth?.getUser?.()||null;}catch(_){return null;}
  }
  function isAdmin(){return String(currentUser()?.email||'').toLowerCase()===ADMIN;}
  function scriptNames(){return [...document.scripts].map(s=>(s.src||'').split('/').pop().split('?')[0]).filter(Boolean);}
  function styleNames(){return [...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>(l.href||'').split('/').pop().split('?')[0]).filter(Boolean);}
  function safeJson(value){try{return JSON.stringify(value);}catch(_){return String(value);}}
  function loadSales(){try{return JSON.parse(localStorage.getItem('samuel_comissoes_pro')||'[]');}catch(_){return null;}}

  async function assetReachable(name){
    try{
      const r=await fetch(name+'?guardian='+Date.now(),{cache:'no-store',method:'GET'});
      return r.ok;
    }catch(_){return false;}
  }

  async function fullAudit(){
    const scripts=scriptNames(),styles=styleNames(),sales=loadSales();
    const checks=[];
    for(const id of REQUIRED_ELEMENTS)checks.push({area:'interface',item:id,ok:Boolean(document.getElementById(id)),detail:document.getElementById(id)?'Elemento presente':'Elemento ausente'});
    for(const fn of REQUIRED_FUNCTIONS)checks.push({area:'funcoes',item:fn,ok:typeof window[fn]==='function',detail:typeof window[fn]==='function'?'Função disponível':'Função ausente'});
    for(const asset of REQUIRED_ASSETS){
      const loaded=scripts.includes(asset);
      const reachable=loaded?true:await assetReachable(asset);
      checks.push({area:'arquivos',item:asset,ok:loaded&&reachable,detail:loaded?(reachable?'Carregado e acessível':'Carregado, mas indisponível na rede'):(reachable?'Existe, mas não foi carregado':'Arquivo não encontrado')});
    }
    checks.push({area:'dados',item:'vendas-locais',ok:Array.isArray(sales),detail:Array.isArray(sales)?`${sales.length} venda(s) legíveis`:'Armazenamento inválido'});
    checks.push({area:'firebase',item:'autenticacao',ok:Boolean(currentUser()),detail:currentUser()?.email||'Usuário não autenticado'});
    checks.push({area:'firebase',item:'firestore',ok:Boolean(window.firebase?.apps?.length&&window.firebase?.firestore),detail:window.firebase?.apps?.length?'Firebase inicializado':'Firebase indisponível'});
    checks.push({area:'pwa',item:'service-worker',ok:'serviceWorker' in navigator,detail:'serviceWorker' in navigator?'Compatível':'Não suportado'});
    checks.push({area:'pwa',item:'online',ok:navigator.onLine,detail:navigator.onLine?'Conectado':'Sem conexão'});
    checks.push({area:'modulos',item:'SCPMonitor',ok:Boolean(window.SCPMonitor?.ativo),detail:window.SCPMonitor?.ativo?'Monitor ativo':'Monitor inativo'});
    checks.push({area:'modulos',item:'SCPGuardian',ok:Boolean(window.SCPGuardian),detail:window.SCPGuardian?'Guardião carregado':'Guardião ausente'});
    checks.push({area:'interface',item:'folhas-de-estilo',ok:styles.length>0,detail:`${styles.length} arquivo(s) de estilo carregados`});

    const failed=checks.filter(c=>!c.ok);
    lastReport={createdAt:new Date().toISOString(),url:location.href,user:currentUser()?.email||null,device:navigator.userAgent,checks,failed};
    try{localStorage.setItem(LAST_REPORT,JSON.stringify(lastReport));}catch(_){}
    return lastReport;
  }

  async function clearOldCaches(){
    if(!('caches' in window))return {ok:false,detail:'Cache API indisponível'};
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>!k.includes('v94')).map(k=>caches.delete(k)));
    return {ok:true,detail:`${keys.length} cache(s) verificado(s)`};
  }

  async function repairServiceWorker(){
    if(!('serviceWorker' in navigator))return {ok:false,detail:'Service Worker não suportado'};
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const reg of regs)await reg.update().catch(()=>{});
    if(!regs.length)await navigator.serviceWorker.register('sw.js').catch(()=>{});
    return {ok:true,detail:'Service Worker atualizado'};
  }

  async function flushGuardian(){
    try{await window.SCPGuardian?.heartbeat?.();}catch(_){}
    try{window.SCPMonitor?.registrar?.('autocorrecao','IA Guardiã executou manutenção segura',{pagina:location.pathname});}catch(_){}
    return {ok:true,detail:'Filas e monitoramento acionados'};
  }

  async function safeRepair(){
    const before=await fullAudit();
    const actions=[];
    actions.push(await clearOldCaches());
    actions.push(await repairServiceWorker());
    actions.push(await flushGuardian());
    if(!localStorage.getItem('scp_guardian_active_cache'))localStorage.setItem('scp_guardian_active_cache','1');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('online'));
    const after=await fullAudit();
    return {before,after,actions,fixed:before.failed.length-after.failed.length};
  }

  async function requestCorrection(report){
    const user=currentUser();
    const payload={
      app:'Samuel Comissões PRO',status:'novo',prioridade:report.failed.length?'alta':'normal',
      resumo:report.failed.length?`${report.failed.length} falha(s) detectada(s)`:'Solicitação manual de revisão',
      falhas:report.failed,relatorio:report,userUid:user?.uid||null,email:user?.email||null,
      criadoEmLocal:new Date().toISOString(),pagina:location.pathname,origem:'ia-guardia-autofix'
    };
    try{
      const db=window.firebase?.firestore?.();
      if(!db||!user)throw new Error('Firebase não disponível');
      await db.collection('guardian_fix_requests').add({...payload,criadoEm:window.firebase.firestore.FieldValue.serverTimestamp()});
      return {ok:true,message:'Solicitação registrada para correção.'};
    }catch(error){
      try{localStorage.setItem('scp_guardian_pending_fix',safeJson(payload));}catch(_){}
      return {ok:false,message:'Solicitação salva neste aparelho. Envie o diagnóstico pelo botão de copiar.'};
    }
  }

  async function copyReport(report){
    const text=['DIAGNÓSTICO IA GUARDIÃ',`Data: ${report.createdAt}`,`Usuário: ${report.user||'não identificado'}`,`Página: ${report.url}`,'',...report.checks.map(c=>`${c.ok?'✓':'⚠'} [${c.area}] ${c.item}: ${c.detail}`)].join('\n');
    try{await navigator.clipboard.writeText(text);return true;}catch(_){return false;}
  }

  function ensureButtons(){
    const host=document.querySelector('#iaGuardia .guardia-acoes');
    if(!host||document.getElementById('guardianAutoFix'))return;
    const audit=document.createElement('button');audit.type='button';audit.id='guardianFullAudit';audit.className='secundario';audit.textContent='Verificar aplicativo completo';
    const fix=document.createElement('button');fix.type='button';fix.id='guardianAutoFix';fix.className='principal';fix.textContent='Corrigir automaticamente';
    const request=document.createElement('button');request.type='button';request.id='guardianRequestFix';request.className='secundario';request.textContent='Solicitar correção do código';
    const copy=document.createElement('button');copy.type='button';copy.id='guardianCopyReport';copy.className='secundario';copy.textContent='Copiar diagnóstico';
    host.append(audit,fix,request,copy);

    audit.onclick=async()=>{audit.disabled=true;audit.textContent='Verificando tudo...';const r=await fullAudit();alert(r.failed.length?`A IA encontrou ${r.failed.length} falha(s).`:'Aplicativo validado sem falhas detectáveis.');audit.disabled=false;audit.textContent='Verificar aplicativo completo';};
    fix.onclick=async()=>{fix.disabled=true;fix.textContent='Corrigindo...';const r=await safeRepair();alert(r.after.failed.length?`Correção segura concluída. Restam ${r.after.failed.length} falha(s) que exigem código.`:'Correção concluída. Nenhuma falha detectável permaneceu.');fix.disabled=false;fix.textContent='Corrigir automaticamente';};
    request.onclick=async()=>{const r=lastReport||await fullAudit();request.disabled=true;const result=await requestCorrection(r);alert(result.message);request.disabled=false;};
    copy.onclick=async()=>{const r=lastReport||await fullAudit();alert(await copyReport(r)?'Diagnóstico copiado. Cole nesta conversa para eu corrigir o código.':'Não foi possível copiar automaticamente.');};
  }

  function init(){
    const observer=new MutationObserver(ensureButtons);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    ensureButtons();
    setInterval(()=>{if(localStorage.getItem('scp_guardian_active_cache')==='1')fullAudit().catch(()=>{});},10*60*1000);
    window.SCPGuardianAutoFix={audit:fullAudit,repair:safeRepair,request:async()=>requestCorrection(lastReport||await fullAudit()),get report(){return lastReport;}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
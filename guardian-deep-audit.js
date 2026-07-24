(function(){
  'use strict';

  const VERSION='guardia-profunda-3.1.0';
  const ADMIN='sathlersamuel@gmail.com';
  const RESULT_KEY='scp_guardian_deep_audit_result';
  const ERROR_KEY='scp_guardian_runtime_errors';
  const INTERVAL=4*60*1000;
  const MAX_ERRORS=60;
  let running=false;
  let mutationCount=0;
  let mutationWindowStart=Date.now();

  const safeJson=(value,fallback=null)=>{try{return JSON.parse(value);}catch(_){return fallback;}};
  const item=(name,ok,detail,severity='important',code='')=>({name,ok:Boolean(ok),detail:String(detail||''),severity,code});
  const visible=el=>Boolean(el&&el.isConnected&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&Number(getComputedStyle(el).opacity||1)>0&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0);
  const user=()=>{try{return window.firebase?.auth?.()?.currentUser||window.SCPAuth?.getUser?.()||null;}catch(_){return null;}};
  const isAdmin=()=>String(user()?.email||'').trim().toLowerCase()===ADMIN;
  const active=()=>localStorage.getItem('scp_guardian_active_cache')==='1'||Boolean(window.SCPGuardian?.active);
  const temporaryOffline=message=>/client is offline|network request failed|failed to fetch|unavailable|offline/i.test(String(message||''));

  function rememberError(kind,message,source,line,column){
    if(temporaryOffline(message))return;
    const list=safeJson(localStorage.getItem(ERROR_KEY),[])||[];
    list.push({kind,message:String(message||'Erro desconhecido').slice(0,500),source:String(source||'').slice(0,300),line:line||0,column:column||0,at:new Date().toISOString(),screen:document.querySelector('.tela.ativa')?.id||''});
    localStorage.setItem(ERROR_KEY,JSON.stringify(list.slice(-MAX_ERRORS)));
  }

  window.addEventListener('error',event=>rememberError('javascript',event.message,event.filename,event.lineno,event.colno),true);
  window.addEventListener('unhandledrejection',event=>rememberError('promise',event.reason?.message||event.reason||'Promise rejeitada','',0,0),true);

  const mutationObserver=new MutationObserver(records=>{mutationCount+=records.reduce((sum,record)=>sum+record.addedNodes.length+record.removedNodes.length,0);});
  mutationObserver.observe(document.documentElement,{childList:true,subtree:true});

  function runtimeErrorsCheck(){
    const original=safeJson(localStorage.getItem(ERROR_KEY),[])||[];
    const errors=original.filter(error=>!temporaryOffline(error.message));
    if(errors.length!==original.length)localStorage.setItem(ERROR_KEY,JSON.stringify(errors.slice(-MAX_ERRORS)));
    const recent=errors.filter(error=>Date.now()-Date.parse(error.at)<24*60*60*1000);
    return item('Erros reais de execução',recent.length===0,recent.length?`${recent.length} erro(s) capturado(s) nas últimas 24 horas. Último: ${recent.at(-1).message}`:'Nenhum erro JavaScript recente capturado.','critical','runtime-errors');
  }

  function structureCheck(){
    const ids=['dashboard','novaVenda','historico','relatorios','formVenda','listaMeses','resultadoRelatorio'];
    const functions=['abrirTela','voltarDashboard','atualizarDashboard','carregarHistorico'];
    const missingIds=ids.filter(id=>!document.getElementById(id));
    const missingFunctions=functions.filter(name=>typeof window[name]!=='function');
    const ok=!missingIds.length&&!missingFunctions.length;
    return item('Estrutura integral das funções principais',ok,ok?'Telas, formulários e funções centrais estão presentes.':`Ausências: ${[...missingIds,...missingFunctions].join(', ')}.`,'critical','core-structure');
  }

  function navigationCheck(){
    const nav=document.querySelector('.bottom');
    const buttons=[...document.querySelectorAll('.bottom button')];
    const labels=buttons.map(button=>button.textContent.trim()).join(' | ');
    const ok=Boolean(nav)&&buttons.length>=4&&buttons.every(button=>!button.disabled&&button.isConnected);
    return item('Navegação e botões principais',ok,ok?`Barra disponível com ${buttons.length} botões: ${labels}. A ocultação automática durante a rolagem é permitida.`:'Barra inferior ausente ou com botão desativado.','critical','navigation');
  }

  function blockingLayerCheck(){
    const allowedIds=new Set(['firebaseAuthOverlay','scpSecurityPanel','scpFaceLock','appSplash']);
    const viewportCenter=document.elementFromPoint(Math.max(1,innerWidth/2),Math.max(1,innerHeight/2));
    const blockers=[...document.querySelectorAll('body *')].filter(el=>{if(!visible(el))return false;const style=getComputedStyle(el);if(style.position!=='fixed')return false;const rect=el.getBoundingClientRect();const covers=rect.width>=innerWidth*.9&&rect.height>=innerHeight*.9;const z=Number.parseInt(style.zIndex,10)||0;return covers&&z>=1000&&style.pointerEvents!=='none';});
    const suspicious=blockers.filter(el=>!allowedIds.has(el.id)&&!el.closest('#firebaseAuthOverlay,#scpSecurityPanel,#scpFaceLock,#appSplash'));
    const panel=document.getElementById('scpSecurityPanel');
    const panelValid=!panel||visible(panel.querySelector('#scpCloseSecurity'));
    const ok=!suspicious.length&&panelValid;
    const detail=!panelValid?'Painel de configurações aberto sem botão Fechar acessível.':suspicious.length?`Camada suspeita bloqueando toques: ${suspicious.map(el=>el.id||el.className||el.tagName).slice(0,4).join(', ')}.`:`Nenhuma camada invisível bloqueando o aplicativo. Elemento central: ${viewportCenter?.id||viewportCenter?.className||viewportCenter?.tagName||'não identificado'}.`;
    return item('Travamentos por camadas e configurações',ok,detail,'critical','blocking-layer');
  }

  function guardianPermissionCheck(){
    const section=document.getElementById('scpGuardianGearSection');
    const guardianScreen=document.getElementById('iaGuardia');
    if(!user())return item('Permissão administrativa da Guardiã',true,'Aguardando autenticação para validar a permissão.','warning','guardian-permission');
    if(isAdmin()){
      const ok=Boolean(section)||Boolean(guardianScreen&&!guardianScreen.hasAttribute('aria-hidden'));
      return item('Permissão administrativa da Guardiã',ok,ok?'IA Guardiã disponível para o administrador.':'Administrador autenticado, mas a IA Guardiã não foi disponibilizada.','critical','guardian-permission');
    }
    const exposed=visible(section)||visible(guardianScreen)||Boolean(document.querySelector('.guardia-nav-btn,.guardia-lancador'));
    return item('Permissão administrativa da Guardiã',!exposed,exposed?'Recursos administrativos da Guardiã ficaram visíveis para usuário comum.':'IA Guardiã corretamente invisível para usuário comum.','critical','guardian-permission');
  }

  function dataCheck(){
    const raw=localStorage.getItem('samuel_comissoes_pro');
    if(raw===null)return item('Integridade das vendas',true,'Nenhuma venda local neste aparelho; estrutura pronta para uso.','critical','sales-data');
    const sales=safeJson(raw,null);
    if(!Array.isArray(sales))return item('Integridade das vendas',false,'Banco local não contém uma lista válida.','critical','sales-data');
    const invalid=sales.filter(sale=>!sale||typeof sale!=='object'||sale.id===undefined||!('valor'in sale));
    return item('Integridade das vendas',invalid.length===0,invalid.length?`${invalid.length} registro(s) incompleto(s) entre ${sales.length}.`:`${sales.length} venda(s) verificadas sem corrupção estrutural.`,'critical','sales-data');
  }

  async function resourceCheck(){
    const entries=performance.getEntriesByType?.('resource')||[];
    const candidates=entries.filter(entry=>entry.name.startsWith(location.origin)&&!entry.name.includes('firebase')&&entry.duration>0&&entry.transferSize===0&&entry.decodedBodySize===0);
    const unique=[...new Map(candidates.map(entry=>[entry.name,entry])).values()].slice(0,8);
    const failed=[];
    for(const entry of unique){
      try{const response=await fetch(entry.name,{method:'GET',cache:'no-store',credentials:'same-origin'});if(!response.ok)failed.push(entry);}catch(_){failed.push(entry);}
    }
    return item('Arquivos carregados no aparelho',failed.length===0,failed.length?`${failed.length} recurso(s) realmente falharam: ${failed.slice(0,5).map(entry=>entry.name.split('/').pop()).join(', ')}.`:'Arquivos locais confirmados. Recursos entregues pelo cache do iPhone não são considerados falha.','important','resources');
  }

  function mutationFloodCheck(){
    const elapsed=Math.max(1,Date.now()-mutationWindowStart);
    const rate=mutationCount/(elapsed/1000);
    mutationCount=0;mutationWindowStart=Date.now();
    const ok=rate<120;
    return item('Conflitos e ciclos de recriação da tela',ok,ok?`Alterações de tela em nível seguro (${rate.toFixed(1)}/s).`:`Alterações excessivas na tela (${rate.toFixed(1)}/s), possível ciclo entre módulos.`,'critical','mutation-flood');
  }

  async function eventLoopCheck(){const start=performance.now();await new Promise(resolve=>setTimeout(resolve,120));const lag=performance.now()-start-120;return item('Resposta e travamento do aplicativo',lag<450,lag<450?`Interface respondeu normalmente (${Math.max(0,lag).toFixed(0)} ms de atraso).`:`Interface apresentou atraso grave de ${lag.toFixed(0)} ms.`,'critical','event-loop');}

  async function serviceWorkerCheck(){
    if(!('serviceWorker'in navigator))return item('Atualização e funcionamento offline',false,'Service Worker não suportado neste ambiente.','warning','service-worker');
    try{const registration=await navigator.serviceWorker.getRegistration();const controlled=Boolean(navigator.serviceWorker.controller);return item('Atualização e funcionamento offline',Boolean(registration)&&controlled,registration?`Registrado; controle da página: ${controlled?'ativo':'ainda não assumido'}.`:'Service Worker não registrado.','important','service-worker');}catch(error){return item('Atualização e funcionamento offline',false,error.message,'important','service-worker');}
  }

  async function repositoryMapCheck(){
    try{const response=await fetch(`guardian-app-manifest.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const manifest=await response.json();const files=Array.isArray(manifest.files)?manifest.files:[];const bootstrap=Boolean(manifest.bootstrap);return item('Conhecimento do repositório',files.length>=25&&!bootstrap,bootstrap?`Mapa ainda é inicial, com ${files.length} arquivos; precisa ser regenerado pelo workflow.`:`Mapa integral carregado com ${files.length} arquivos, ${manifest.summary?.symbols||0} símbolos e ${manifest.summary?.domIds||0} elementos de tela.`,'important','repository-map');}catch(error){return item('Conhecimento do repositório',false,`Não foi possível ler o mapa: ${error.message}`,'important','repository-map');}
  }

  async function firebaseCheck(){
    const current=user();
    if(!current)return item('Login e Firebase',false,'Nenhum usuário autenticado.','critical','firebase');
    if(!window.firebase?.apps?.length)return item('Login e Firebase',false,'Firebase não inicializado.','critical','firebase');
    if(!navigator.onLine)return item('Login e Firebase',true,'Aparelho offline; a confirmação será repetida automaticamente quando a conexão voltar.','warning','firebase');
    try{await window.firebase.firestore().collection('monitor_dispositivos').doc(window.SCPGuardian?.deviceId||localStorage.getItem('scp_guardian_device_id')||current.uid).set({uid:current.uid,email:current.email||'',auditoriaProfunda:VERSION,ultimaAuditoriaProfundaLocal:new Date().toISOString(),ultimaAuditoriaProfunda:window.firebase.firestore.FieldValue.serverTimestamp()},{merge:true});return item('Login e Firebase',true,'Autenticação e gravação de diagnóstico confirmadas.','critical','firebase');}catch(error){if(temporaryOffline(error?.message||error))return item('Login e Firebase',true,'Conexão temporariamente indisponível; dados permanecem na fila local.','warning','firebase');return item('Login e Firebase',false,`${error.code||'erro'}: ${error.message||error}`,'critical','firebase');}
  }

  async function save(checks,forced){
    const failures=checks.filter(check=>!check.ok);
    const result={version:VERSION,at:new Date().toISOString(),device:{platform:navigator.platform,userAgent:navigator.userAgent,standalone:matchMedia('(display-mode: standalone)').matches},checks,failures:failures.length};
    localStorage.setItem(RESULT_KEY,JSON.stringify(result));
    window.dispatchEvent(new CustomEvent('scp-guardian-deep-audit-complete',{detail:result}));
    const current=user();
    if(!current||!window.firebase?.apps?.length||!navigator.onLine)return result;
    if(!forced&&!failures.length)return result;
    try{await window.firebase.firestore().collection('monitor_erros').add({app:'Samuel Comissões PRO',versao:VERSION,tipo:'auditoria-profunda',mensagem:failures.length?`Auditoria profunda encontrou ${failures.length} problema(s): ${failures.map(f=>f.name).join(', ')}.`:'Auditoria profunda aprovada.',gravidade:failures.some(f=>f.severity==='critical')?'critico':failures.length?'importante':'atencao',status:failures.length?'novo':'resolvido',uid:current.uid,email:current.email||'',deviceId:window.SCPGuardian?.deviceId||'',contexto:result,criadoEmLocal:new Date().toISOString(),criadoEm:window.firebase.firestore.FieldValue.serverTimestamp(),origem:'ia-guardia-profunda'});}catch(error){console.warn('IA Guardiã: auditoria profunda pendente.',error);}
    return result;
  }

  async function run(forced=false){
    if(running||(!forced&&!active()))return null;
    running=true;
    try{const checks=[structureCheck(),navigationCheck(),blockingLayerCheck(),guardianPermissionCheck(),dataCheck(),runtimeErrorsCheck(),await resourceCheck(),mutationFloodCheck(),await eventLoopCheck(),await serviceWorkerCheck(),await repositoryMapCheck(),await firebaseCheck()];return await save(checks,forced);}finally{running=false;}
  }

  function start(){
    setTimeout(()=>run(true),8000);
    setInterval(()=>run(false),INTERVAL);
    window.addEventListener('online',()=>setTimeout(()=>run(true),1800));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>run(false),1600);});
    document.addEventListener('click',event=>{if(event.target?.closest?.('#scpSecurityButton,#scpCloseSecurity,.bottom button'))setTimeout(()=>run(true),900);},true);
    window.SCPGuardianDeepAudit={run:()=>run(true),version:VERSION,get last(){return safeJson(localStorage.getItem(RESULT_KEY),null);},get errors(){return safeJson(localStorage.getItem(ERROR_KEY),[])||[];},clearErrors(){localStorage.removeItem(ERROR_KEY);}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
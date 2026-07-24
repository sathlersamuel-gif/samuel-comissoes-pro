(function(){
  'use strict';

  const VERSION='guardia-auditoria-2.0.0';
  const LAST_SIGNATURE='scp_guardian_last_audit_signature';
  const LAST_RESULT='scp_guardian_last_audit_result';
  const INTERVAL=5*60*1000;
  let running=false;

  function safeJson(value,fallback=null){try{return JSON.parse(value);}catch(_){return fallback;}}
  function active(){return localStorage.getItem('scp_guardian_active_cache')==='1'||Boolean(window.SCPGuardian?.active);}
  function currentUser(){try{return window.firebase?.auth?.()?.currentUser||null;}catch(_){return null;}}
  function firestore(){try{return window.firebase?.apps?.length?window.firebase.firestore():null;}catch(_){return null;}}
  function check(name,ok,detail,severity='important'){return{name,ok:Boolean(ok),detail:String(detail||''),severity};}

  async function serviceWorkerCheck(){
    if(!('serviceWorker' in navigator))return check('Aplicativo instalado/PWA',false,'Este navegador não oferece Service Worker.','warning');
    try{
      const registration=await navigator.serviceWorker.getRegistration();
      return check('Aplicativo instalado/PWA',Boolean(registration),registration?'Service Worker registrado.':'Service Worker ainda não registrado.','warning');
    }catch(error){return check('Aplicativo instalado/PWA',false,error.message,'warning');}
  }

  function storageCheck(){
    const key='__scp_guardian_test__';
    try{localStorage.setItem(key,'ok');const ok=localStorage.getItem(key)==='ok';localStorage.removeItem(key);return check('Armazenamento local',ok,ok?'Leitura e gravação funcionando.':'Falha ao confirmar gravação.','critical');}
    catch(error){return check('Armazenamento local',false,error.message,'critical');}
  }

  function salesCheck(){
    const raw=localStorage.getItem('samuel_comissoes_pro');
    if(raw===null)return check('Base de vendas',true,'Ainda não existem vendas locais neste aparelho.','critical');
    const sales=safeJson(raw,null);
    return check('Base de vendas',Array.isArray(sales),Array.isArray(sales)?`${sales.length} venda(s) legível(is).`:'Os dados locais não estão em formato válido.','critical');
  }

  function interfaceChecks(){
    const required=['dashboard','formVenda','historico','relatorios','valorVenda','porcentagem','comissao'];
    const missing=required.filter(id=>!document.getElementById(id));
    return check('Telas e campos principais',missing.length===0,missing.length?`Não encontrados: ${missing.join(', ')}.`:'Estrutura principal carregada.','critical');
  }

  function functionsCheck(){
    const required=['abrirTela','voltarDashboard'];
    const missing=required.filter(name=>typeof window[name]!=='function');
    return check('Navegação do aplicativo',missing.length===0,missing.length?`Funções ausentes: ${missing.join(', ')}.`:'Navegação disponível.','critical');
  }

  function pdfCheck(){
    const ok=Boolean(window.jspdf?.jsPDF);
    return check('Exportação de PDF',ok,ok?'Biblioteca de PDF carregada.':'Biblioteca de PDF não carregou.','important');
  }

  async function firebaseCheck(){
    const user=currentUser(),db=firestore();
    if(!user)return check('Login e sincronização',false,'Usuário não autenticado.','critical');
    if(!db)return check('Login e sincronização',false,'Firebase não inicializado.','critical');
    if(!navigator.onLine)return check('Login e sincronização',false,'Sem internet; dados ficarão pendentes.','warning');
    try{
      const deviceId=window.SCPGuardian?.deviceId||localStorage.getItem('scp_guardian_device_id');
      if(!deviceId)throw new Error('Identificador do aparelho indisponível.');
      await db.collection('monitor_dispositivos').doc(deviceId).set({
        uid:user.uid,email:user.email||'',auditoriaVersao:VERSION,
        ultimaAuditoria:window.firebase.firestore.FieldValue.serverTimestamp(),
        ultimaAuditoriaLocal:new Date().toISOString()
      },{merge:true});
      return check('Login e sincronização',true,'Firebase aceitou o sinal deste aparelho.','critical');
    }catch(error){
      return check('Login e sincronização',false,`${error.code||'erro'}: ${error.message||error}`,'critical');
    }
  }

  function signature(checks){return checks.map(item=>`${item.name}:${item.ok?'1':'0'}:${item.detail}`).join('|').slice(0,6000);}

  async function saveReport(checks,forced){
    const user=currentUser(),db=firestore();
    const failures=checks.filter(item=>!item.ok);
    const sig=signature(checks),previous=localStorage.getItem(LAST_SIGNATURE)||'';
    localStorage.setItem(LAST_SIGNATURE,sig);
    localStorage.setItem(LAST_RESULT,JSON.stringify({at:new Date().toISOString(),checks,failures:failures.length,version:VERSION}));
    updateUI(checks);
    if(!db||!user||!navigator.onLine||(!forced&&sig===previous))return;
    const critical=failures.some(item=>item.severity==='critical');
    const message=failures.length?`Auditoria automática encontrou ${failures.length} problema(s): ${failures.map(item=>item.name).join(', ')}.`:'Auditoria automática concluída: funções principais operando normalmente.';
    try{
      await db.collection('monitor_erros').add({
        app:'Controle de Vendas',versao:VERSION,tipo:'auditoria-completa',mensagem:message,
        gravidade:critical?'critico':failures.length?'importante':'atencao',status:failures.length?'novo':'resolvido',
        uid:user.uid,email:user.email||'',deviceId:window.SCPGuardian?.deviceId||'',
        contexto:{checks},criadoEmLocal:new Date().toISOString(),
        criadoEm:window.firebase.firestore.FieldValue.serverTimestamp(),origem:'ia-guardia-auditoria'
      });
    }catch(error){console.warn('IA Guardiã: relatório ficou pendente.',error);}
  }

  function updateUI(checks){
    const panel=document.getElementById('guardiaResumo');
    if(!panel)return;
    const failures=checks.filter(item=>!item.ok);
    const last=new Date().toLocaleString('pt-BR');
    const details=checks.map(item=>`<div style="margin-top:8px"><b>${item.ok?'✓':'⚠'} ${item.name}</b><br><small>${String(item.detail).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</small></div>`).join('');
    panel.innerHTML=`<b>${failures.length?'Atenção necessária':'Auditoria completa aprovada'}</b><br><small>Última verificação: ${last}</small>${details}`;
  }

  async function audit(forced=false){
    if(running||!active())return;
    running=true;
    try{
      const checks=[
        check('IA Guardiã ativada',active(),'Monitoramento ativo neste aparelho.','critical'),
        check('Internet',navigator.onLine,navigator.onLine?'Conectado.':'Sem conexão; eventos serão enviados depois.','warning'),
        storageCheck(),salesCheck(),interfaceChecks(),functionsCheck(),pdfCheck(),
        await serviceWorkerCheck(),await firebaseCheck()
      ];
      await saveReport(checks,forced);
      window.dispatchEvent(new CustomEvent('scp-guardian-audit-complete',{detail:{checks,version:VERSION}}));
    }finally{running=false;}
  }

  function start(){
    setTimeout(()=>audit(true),5000);
    setInterval(()=>audit(false),INTERVAL);
    window.addEventListener('online',()=>setTimeout(()=>audit(true),1500));
    window.addEventListener('error',()=>setTimeout(()=>audit(false),1000));
    window.addEventListener('unhandledrejection',()=>setTimeout(()=>audit(false),1000));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>audit(false),1200);});
    document.addEventListener('click',event=>{if(event.target?.closest?.('#guardiaDiagnostico'))setTimeout(()=>audit(true),300);},true);
    window.SCPGuardianAudit={run:()=>audit(true),version:VERSION,get last(){return safeJson(localStorage.getItem(LAST_RESULT),null);}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
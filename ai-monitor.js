(function(){
  'use strict';

  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const APP='Samuel Comissões PRO';
  const VERSAO='1.0.0';
  const FILA='scp_ai_monitor_queue';
  const SESSAO=(crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const MAX_FILA=80;
  const REPETICAO_MS=5*60*1000;
  const vistos=new Map();
  let db=null;
  let auth=null;
  let enviando=false;

  function pronto(){return Boolean(window.firebase&&firebase.apps&&firebase.apps.length);}
  function agora(){return new Date().toISOString();}
  function texto(v,max=1200){return String(v==null?'':v).slice(0,max);}
  function emailAtual(){return String(auth?.currentUser?.email||'').toLowerCase();}
  function uidAtual(){return auth?.currentUser?.uid||null;}
  function dispositivo(){
    const ua=navigator.userAgent||'';
    let sistema='Outro';
    if(/iPhone|iPad|iPod/i.test(ua))sistema='iOS';
    else if(/Android/i.test(ua))sistema='Android';
    else if(/Windows/i.test(ua))sistema='Windows';
    else if(/Macintosh/i.test(ua))sistema='macOS';
    let navegador='Outro';
    if(/CriOS/i.test(ua))navegador='Chrome iOS';
    else if(/FxiOS/i.test(ua))navegador='Firefox iOS';
    else if(/EdgiOS|Edg\//i.test(ua))navegador='Edge';
    else if(/Chrome/i.test(ua))navegador='Chrome';
    else if(/Safari/i.test(ua))navegador='Safari';
    return {sistema,navegador,userAgent:texto(ua,500),online:navigator.onLine,idioma:navigator.language||'',largura:innerWidth||0,altura:innerHeight||0};
  }
  function gravidade(tipo,mensagem){
    const t=`${tipo} ${mensagem}`.toLowerCase();
    if(/perda|corromp|quota|permission-denied|não foi possível salvar|falha ao salvar|firebase|firestore/.test(t))return 'critico';
    if(/pdf|backup|login|auth|sincron|network|erro/.test(t))return 'importante';
    return 'atencao';
  }
  function assinatura(e){return `${e.tipo}|${e.mensagem}|${e.arquivo||''}|${e.linha||''}`.slice(0,700);}
  function lerFila(){try{return JSON.parse(localStorage.getItem(FILA)||'[]')||[];}catch(_){return [];}}
  function salvarFila(f){try{localStorage.setItem(FILA,JSON.stringify(f.slice(-MAX_FILA)));}catch(_){}}
  function enfileirar(evento){const f=lerFila();f.push(evento);salvarFila(f);}

  function montar(tipo,mensagem,extra={}){
    const evento={
      app:APP,versao:VERSAO,sessao:SESSAO,tipo:texto(tipo,80),mensagem:texto(mensagem),gravidade:gravidade(tipo,mensagem),
      criadoEmLocal:agora(),pagina:location.pathname+location.search,uid:uidAtual(),email:emailAtual()||null,
      dispositivo:dispositivo(),arquivo:texto(extra.arquivo,500)||null,linha:Number(extra.linha)||null,coluna:Number(extra.coluna)||null,
      stack:texto(extra.stack,2500)||null,contexto:extra.contexto||null,status:'novo',origem:'monitor-cliente'
    };
    return evento;
  }

  async function enviar(evento){
    if(!db||!navigator.onLine){enfileirar(evento);return;}
    const sig=assinatura(evento);const ultimo=vistos.get(sig)||0;
    if(Date.now()-ultimo<REPETICAO_MS)return;
    vistos.set(sig,Date.now());
    try{
      await db.collection('monitor_erros').add({...evento,criadoEm:firebase.firestore.FieldValue.serverTimestamp()});
      if(evento.gravidade==='critico'){
        await db.collection('notificacoes_admin').add({
          titulo:'Falha crítica detectada',mensagem:evento.mensagem,gravidade:evento.gravidade,lido:false,
          usuario:evento.email||'não identificado',dispositivo:evento.dispositivo,eventoTipo:evento.tipo,
          criadoEm:firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }catch(_){enfileirar(evento);}
  }

  async function descarregarFila(){
    if(enviando||!db||!navigator.onLine)return;
    enviando=true;
    const fila=lerFila();salvarFila([]);
    for(const e of fila){try{await enviar(e);}catch(_){enfileirar(e);}}
    enviando=false;
  }

  function capturar(tipo,mensagem,extra){
    const evento=montar(tipo,mensagem,extra);
    enviar(evento);
    return evento;
  }

  function instalarCapturas(){
    window.addEventListener('error',ev=>capturar('javascript',ev.message||'Erro não identificado',{arquivo:ev.filename,linha:ev.lineno,coluna:ev.colno,stack:ev.error?.stack}));
    window.addEventListener('unhandledrejection',ev=>{
      const r=ev.reason;
      capturar('promessa-rejeitada',r?.message||r||'Falha assíncrona não identificada',{stack:r?.stack});
    });
    window.addEventListener('offline',()=>capturar('conectividade','Aplicativo ficou sem conexão com a internet'));
    window.addEventListener('online',descarregarFila);
    const original=console.error.bind(console);
    console.error=function(...args){
      original(...args);
      const msg=args.map(a=>a instanceof Error?a.message:typeof a==='string'?a:JSON.stringify(a)).join(' ');
      capturar('console-error',msg,{stack:args.find(a=>a instanceof Error)?.stack});
    };
  }

  function verificarSaude(){
    const vendas=(()=>{try{return JSON.parse(localStorage.getItem('samuel_comissoes_pro')||'[]');}catch(_){return null;}})();
    if(vendas===null)capturar('integridade-dados','Não foi possível ler os dados locais de vendas');
    else if(!Array.isArray(vendas))capturar('integridade-dados','Formato inválido no armazenamento de vendas');
    if(!document.getElementById('dashboard'))capturar('estrutura','Tela principal não encontrada');
    if(!document.getElementById('formVenda'))capturar('estrutura','Formulário de venda não encontrado');
  }

  function iniciar(){
    instalarCapturas();
    const aguardar=setInterval(()=>{
      if(!pronto())return;
      clearInterval(aguardar);
      db=firebase.firestore();auth=firebase.auth();
      auth.onAuthStateChanged(()=>{descarregarFila();verificarSaude();});
      descarregarFila();verificarSaude();
      setInterval(()=>{descarregarFila();verificarSaude();},15*60*1000);
      window.SCPMonitor={registrar:(tipo,mensagem,contexto)=>capturar(tipo,mensagem,{contexto}),versao:VERSAO,ativo:true};
    },250);
    setTimeout(()=>clearInterval(aguardar),15000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

(function(){
  'use strict';

  const VERSION='2.0.0';
  const CACHE='scp-ai-warm-v2';
  const HOT_ASSETS=[
    './index.html','./style.css?v=4','./dashboard-v2.css?v=7','./script.js?v=4',
    './dashboard-v2.js?v=9','./firebase-integration.js?v=7','./report-options-fix.js?v=7',
    './history-search-fix.js?v=1','./analise-vendas.js?v=2','./bottom-nav-auto-hide.js?v=3'
  ];
  const tempos=[];
  const inicio=performance.now();
  let ultimoClique=0;
  let ultimoPulso=performance.now();
  let travamentos=0;

  function registrar(tipo,mensagem,contexto={}){
    const payload={acelerador:VERSION,dispositivo:navigator.userAgent,memoria:navigator.deviceMemory||null,nucleos:navigator.hardwareConcurrency||null,conexao:navigator.connection?.effectiveType||null,...contexto};
    try{window.SCPMonitor?.registrar(tipo,mensagem,payload);}catch(_){ }
    try{window.dispatchEvent(new CustomEvent('scp-performance-event',{detail:{tipo,mensagem,contexto:payload}}));}catch(_){ }
  }

  function ocioso(fn,timeout=1800){
    if('requestIdleCallback' in window)requestIdleCallback(fn,{timeout});
    else setTimeout(fn,350);
  }

  function perfilDispositivo(){
    const memoria=Number(navigator.deviceMemory||4);
    const nucleos=Number(navigator.hardwareConcurrency||4);
    const economico=memoria<=2||nucleos<=2||navigator.connection?.saveData===true;
    document.documentElement.classList.toggle('scp-low-power',economico);
    return{memoria,nucleos,economico};
  }

  function aplicarAceleracaoVisual(){
    if(document.getElementById('scpPerformanceStyle'))return;
    const style=document.createElement('style');
    style.id='scpPerformanceStyle';
    style.textContent=`
      html,body{scroll-behavior:auto!important}
      .tela{contain:layout style paint;content-visibility:auto;contain-intrinsic-size:700px}
      .tela.ativa{content-visibility:visible}
      .bottom,.topo,#firebaseUserBar{transform:translateZ(0);backface-visibility:hidden}
      button,.tipo-card,.mes{touch-action:manipulation}
      .scp-low-power *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .scp-low-power *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
      @media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    `;
    document.head.appendChild(style);
  }

  async function aquecerCache(){
    if(!('caches' in window)||!navigator.onLine)return;
    try{
      const cache=await caches.open(CACHE);
      for(const url of HOT_ASSETS){
        try{
          const hit=await cache.match(url);
          if(!hit)await cache.add(new Request(url,{cache:'reload'}));
        }catch(_){ }
      }
    }catch(erro){registrar('acelerador-cache','Falha ao preparar arquivos para abertura rápida',{erro:String(erro)});}
  }

  function otimizarMidia(){
    document.querySelectorAll('img').forEach(img=>{
      if(!img.hasAttribute('decoding'))img.decoding='async';
      if(!img.hasAttribute('loading')&&!img.closest('#appSplash'))img.loading='lazy';
      img.style.contentVisibility='auto';
    });
  }

  function acompanharCliques(){
    document.addEventListener('click',e=>{
      ultimoClique=performance.now();
      const alvo=e.target?.closest?.('button,a,[onclick]');
      if(!alvo)return;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const duracao=Math.round(performance.now()-ultimoClique);
        tempos.push(duracao);if(tempos.length>50)tempos.shift();
        if(duracao>350)registrar('desempenho-clique','Clique demorou para responder',{duracaoMs:duracao,alvo:(alvo.id||alvo.textContent||alvo.tagName).trim().slice(0,80)});
      }));
    },true);
  }

  function acompanharTravamentos(){
    if('PerformanceObserver' in window){
      try{
        const observer=new PerformanceObserver(lista=>{
          lista.getEntries().forEach(item=>{
            if(item.duration>=120){
              travamentos++;
              registrar('desempenho-travamento','Interface apresentou travamento prolongado',{duracaoMs:Math.round(item.duration),inicioMs:Math.round(item.startTime),quantidade:travamentos});
            }
          });
        });
        observer.observe({type:'longtask',buffered:true});
      }catch(_){ }
    }

    setInterval(()=>{
      const agora=performance.now();
      const atraso=agora-ultimoPulso-1000;
      ultimoPulso=agora;
      if(atraso>700)registrar('desempenho-bloqueio','A linha principal ficou bloqueada',{atrasoMs:Math.round(atraso)});
    },1000);
  }

  function medirInicializacao(){
    const pronto=()=>{
      const duracao=Math.round(performance.now()-inicio);
      document.documentElement.dataset.scpReady='1';
      window.SCPPerformanceBootMs=duracao;
      if(duracao>2500)registrar('desempenho-inicializacao','Aplicativo demorou para iniciar',{duracaoMs:duracao});
      else registrar('desempenho-inicializacao','Aplicativo iniciou normalmente',{duracaoMs:duracao});
    };
    if(document.readyState==='complete')pronto();
    else window.addEventListener('load',pronto,{once:true});
    setTimeout(()=>{
      if(document.documentElement.dataset.scpReady!=='1')registrar('desempenho-inicializacao','Tela inicial não concluiu o carregamento no tempo esperado',{limiteMs:6000});
    },6000);
  }

  function protegerInteracao(){
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')requestAnimationFrame(()=>document.body?.classList.add('scp-awake'));
      else document.body?.classList.remove('scp-awake');
    });
    window.addEventListener('pageshow',()=>requestAnimationFrame(()=>document.body?.classList.add('scp-awake')),{passive:true});
  }

  function iniciar(){
    perfilDispositivo();
    aplicarAceleracaoVisual();
    otimizarMidia();
    acompanharCliques();
    acompanharTravamentos();
    medirInicializacao();
    protegerInteracao();
    ocioso(aquecerCache,2500);
    window.addEventListener('online',()=>ocioso(aquecerCache),{passive:true});
    window.SCPAcelerador={
      ativo:true,
      versao:VERSION,
      hardware:perfilDispositivo(),
      mediaClique:()=>tempos.length?Math.round(tempos.reduce((a,b)=>a+b,0)/tempos.length):0,
      travamentos:()=>travamentos,
      aquecer:aquecerCache,
      diagnostico:()=>({bootMs:window.SCPPerformanceBootMs||null,mediaCliqueMs:tempos.length?Math.round(tempos.reduce((a,b)=>a+b,0)/tempos.length):0,travamentos,hardware:perfilDispositivo()})
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
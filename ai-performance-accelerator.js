(function(){
  'use strict';

  const VERSION='1.0.0';
  const CACHE='scp-ai-warm-v1';
  const HOT_ASSETS=[
    './index.html','./style.css?v=4','./dashboard-v2.css?v=7','./script.js?v=4',
    './dashboard-v2.js?v=9','./firebase-integration.js?v=7','./report-options-fix.js?v=7',
    './history-search-fix.js?v=1','./analise-vendas.js?v=2'
  ];
  const tempos=[];
  let ultimoClique=0;

  function registrar(tipo,mensagem,contexto){
    try{window.SCPMonitor?.registrar(tipo,mensagem,{acelerador:VERSION,...contexto});}catch(_){ }
  }

  function ocioso(fn){
    if('requestIdleCallback' in window) requestIdleCallback(fn,{timeout:1800});
    else setTimeout(fn,350);
  }

  async function aquecerCache(){
    if(!('caches' in window)||!navigator.onLine) return;
    try{
      const cache=await caches.open(CACHE);
      await Promise.allSettled(HOT_ASSETS.map(async url=>{
        const hit=await cache.match(url);
        if(!hit) await cache.add(new Request(url,{cache:'reload'}));
      }));
    }catch(erro){registrar('acelerador-cache','Falha ao preparar arquivos para abertura rápida',{erro:String(erro)});}
  }

  function anteciparLink(elemento){
    const link=elemento?.closest?.('a[href]');
    if(!link) return;
    try{
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin) return;
      fetch(url.href,{method:'GET',cache:'force-cache',credentials:'same-origin'}).catch(()=>{});
    }catch(_){ }
  }

  function acompanharCliques(){
    document.addEventListener('pointerover',e=>anteciparLink(e.target),{passive:true});
    document.addEventListener('touchstart',e=>anteciparLink(e.target),{passive:true});
    document.addEventListener('click',e=>{
      ultimoClique=performance.now();
      const alvo=e.target?.closest?.('button,a,[onclick]');
      if(!alvo) return;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const duracao=Math.round(performance.now()-ultimoClique);
        tempos.push(duracao); if(tempos.length>30) tempos.shift();
        if(duracao>450) registrar('desempenho-clique','Clique demorou para responder',{duracaoMs:duracao,alvo:(alvo.id||alvo.textContent||alvo.tagName).trim().slice(0,80)});
      }));
    },true);
  }

  function acompanharTravamentos(){
    if(!('PerformanceObserver' in window)) return;
    try{
      const observer=new PerformanceObserver(lista=>{
        lista.getEntries().forEach(item=>{
          if(item.duration>=180) registrar('desempenho-travamento','Interface apresentou travamento prolongado',{duracaoMs:Math.round(item.duration),inicioMs:Math.round(item.startTime)});
        });
      });
      observer.observe({type:'longtask',buffered:true});
    }catch(_){ }
  }

  function otimizarInterface(){
    document.documentElement.style.setProperty('scroll-behavior','auto');
    document.querySelectorAll('img').forEach(img=>{
      if(!img.hasAttribute('decoding')) img.decoding='async';
      if(!img.hasAttribute('loading')&&!img.closest('#appSplash')) img.loading='lazy';
    });
  }

  function iniciar(){
    otimizarInterface();
    acompanharCliques();
    acompanharTravamentos();
    ocioso(aquecerCache);
    window.addEventListener('online',()=>ocioso(aquecerCache),{passive:true});
    window.SCPAcelerador={ativo:true,versao:VERSION,mediaClique:()=>tempos.length?Math.round(tempos.reduce((a,b)=>a+b,0)/tempos.length):0,aquecer:aquecerCache};
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();

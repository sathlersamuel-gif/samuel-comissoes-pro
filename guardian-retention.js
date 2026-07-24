(function(){
  'use strict';

  const SUCCESS_TTL=24*60*60*1000;
  const CLEAN_INTERVAL=30*60*1000;
  const SUCCESS_TYPES=new Set(['auditoria-completa','diagnostico-ia']);
  let db=null,user=null,cleaning=false,unsub=null;

  function isAdmin(){return String(user?.email||'').toLowerCase()==='sathlersamuel@gmail.com';}
  function toDate(v){if(!v)return null;if(typeof v.toDate==='function')return v.toDate();const d=new Date(v);return isNaN(d)?null:d;}
  function isSuccessful(e){return e?.status==='resolvido'||/nenhuma falha|operando normalmente|concluída/i.test(String(e?.mensagem||''));}
  function keyFor(e){return `${e.tipo||'outro'}|${e.deviceId||e.email||'geral'}`;}

  async function cleanReports(){
    if(cleaning||!db||!user||!isAdmin()||!navigator.onLine)return;
    cleaning=true;
    try{
      const snap=await db.collection('monitor_erros').orderBy('criadoEm','desc').limit(250).get();
      const now=Date.now();
      const latest=new Set();
      const deletions=[];
      snap.docs.forEach(doc=>{
        const e=doc.data()||{};
        const date=toDate(e.criadoEm)||toDate(e.criadoEmLocal);
        const success=SUCCESS_TYPES.has(e.tipo)&&isSuccessful(e);
        if(!success||!date)return;
        const key=keyFor(e);
        const old=now-date.getTime()>SUCCESS_TTL;
        const duplicate=latest.has(key);
        if(old||duplicate)deletions.push(doc.ref.delete().catch(()=>{}));
        else latest.add(key);
      });
      await Promise.all(deletions);
    }catch(error){console.warn('IA Guardiã: limpeza de relatórios adiada.',error);}
    finally{cleaning=false;}
  }

  function listenReports(){
    if(!db||!user||!isAdmin())return;
    unsub?.();
    unsub=db.collection('monitor_erros').orderBy('criadoEm','desc').limit(120).onSnapshot(snap=>{
      const items=snap.docs.map(d=>d.data()||{});
      const recent=items.filter(e=>{
        const d=toDate(e.criadoEm)||toDate(e.criadoEmLocal);
        return !d||Date.now()-d.getTime()<=24*60*60*1000;
      });
      const unresolved=recent.filter(e=>e.status!=='resolvido'&&!isSuccessful(e));
      const critical=unresolved.filter(e=>e.gravidade==='critico');
      const important=unresolved.filter(e=>e.gravidade==='importante');
      const avisos=document.getElementById('gAvisos');
      const criticos=document.getElementById('gCriticos');
      const saude=document.getElementById('gSaude');
      if(avisos)avisos.textContent=unresolved.length;
      if(criticos)criticos.textContent=critical.length;
      if(saude)saude.textContent=critical.length?'Alerta':important.length?'Atenção':'Boa';
      const resumo=document.getElementById('guardiaResumo');
      if(resumo&&unresolved.length===0&&/Padrão detectado/i.test(resumo.textContent||'')){
        const nome=localStorage.getItem('scp_guardian_device_name')||'este aparelho';
        resumo.innerHTML=`<b>Sistema saudável:</b> nenhum padrão grave foi detectado nas últimas 24 horas.<br><br>Este aparelho está identificado como <b>${nome.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</b>.`;
      }
    },()=>{});
  }

  function init(){
    const timer=setInterval(()=>{
      if(!window.firebase||!firebase.apps?.length)return;
      clearInterval(timer);
      db=firebase.firestore();
      firebase.auth().onAuthStateChanged(u=>{
        user=u;
        if(!u)return;
        listenReports();
        setTimeout(cleanReports,2500);
      });
      setInterval(cleanReports,CLEAN_INTERVAL);
    },250);
    setTimeout(()=>clearInterval(timer),20000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  const TTL=24*60*60*1000;
  let db=null,user=null,docs=[],open=false,rendering=false,unsub=null;

  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function isAdmin(){return String(user?.email||'').toLowerCase()===ADMIN;}
  function toDate(v){if(!v)return null;if(typeof v.toDate==='function')return v.toDate();const d=new Date(v);return isNaN(d)?null:d;}
  function fmt(v){const d=toDate(v);return d?d.toLocaleString('pt-BR'):'Sem data';}
  function deviceText(e){return e.dispositivo?.nome||e.dispositivo?.sistema||'';}

  function ensureStyle(){
    if(document.getElementById('guardianOccurrencesStyle'))return;
    const style=document.createElement('style');
    style.id='guardianOccurrencesStyle';
    style.textContent=`
      .guardian-occ-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .guardian-occ-head h3{margin:0}
      .guardian-occ-actions{display:flex;gap:8px;flex-wrap:wrap}
      .guardian-occ-actions button{border:1px solid #c8d6e8;border-radius:11px;padding:9px 12px;background:#eef5ff;color:#073b84;font-weight:800}
      .guardian-occ-actions button.danger{background:#fff1f2;color:#a51628;border-color:#f0b9c0}
      .guardian-occ-summary{margin-top:10px;color:#66758a;font-weight:700}
      #guardiaErrors.guardian-collapsed{display:none!important}
      .guardia-alerta{position:relative;padding-right:54px!important}
      .guardian-delete-one{position:absolute;top:10px;right:10px;width:36px;height:36px;border:1px solid #efc1c7;border-radius:10px;background:#fff;color:#b42335;font-size:18px;font-weight:900}
    `;
    document.head.appendChild(style);
  }

  function panel(){return document.getElementById('guardiaErrors')?.closest('.guardia-painel')||null;}

  function ensureControls(){
    const p=panel();const box=document.getElementById('guardiaErrors');
    if(!p||!box)return false;
    ensureStyle();
    let head=p.querySelector('.guardian-occ-head');
    if(!head){
      const old=p.querySelector('.guardia-painel-cabeca');
      head=document.createElement('div');head.className='guardian-occ-head';
      head.innerHTML=`<h3>Ocorrências</h3><div class="guardian-occ-actions"><button type="button" id="guardianToggleOccurrences">Ver registros</button><button type="button" id="guardianDeleteAll" class="danger">Apagar todos</button></div>`;
      old?.replaceWith(head);
      const summary=document.createElement('div');summary.id='guardianOccurrencesSummary';summary.className='guardian-occ-summary';
      head.insertAdjacentElement('afterend',summary);
      document.getElementById('guardianToggleOccurrences').onclick=()=>{open=!open;render();};
      document.getElementById('guardianDeleteAll').onclick=deleteAll;
    }
    return true;
  }

  function currentFilter(){return 'todos';}

  function render(){
    if(!ensureControls())return;
    const box=document.getElementById('guardiaErrors');
    const toggle=document.getElementById('guardianToggleOccurrences');
    const summary=document.getElementById('guardianOccurrencesSummary');
    const delAll=document.getElementById('guardianDeleteAll');
    if(!box||!toggle||!summary||!delAll)return;

    const list=docs.filter(d=>currentFilter()==='todos'||d.data.gravidade===currentFilter());
    summary.textContent=list.length?`${list.length} registro(s). Eles são apagados automaticamente após 24 horas.`:'Nenhum registro armazenado.';
    toggle.textContent=open?`Ocultar registros (${list.length})`:`Ver registros (${list.length})`;
    delAll.disabled=!list.length||!isAdmin();
    box.classList.toggle('guardian-collapsed',!open);
    if(!open)return;

    rendering=true;
    box.innerHTML=list.length?list.map(({id,data:e})=>`<article class="guardia-alerta ${esc(e.gravidade||'atencao')}" data-guardian-id="${esc(id)}"><div><strong>${esc(e.tipo||'Ocorrência')}</strong><div>${esc(e.mensagem||'Sem descrição')}</div><small>${esc(e.email||e.usuario||'Usuário não identificado')} • ${fmt(e.criadoEm||e.criadoEmLocal)}</small><small>${esc(deviceText(e))}${e.arquivo?` • ${esc(e.arquivo)}${e.linha?':'+e.linha:''}`:''}</small></div>${isAdmin()?`<button class="guardian-delete-one" type="button" data-delete-id="${esc(id)}" aria-label="Apagar registro">×</button>`:''}</article>`).join(''):'<div class="guardia-vazio">Nenhuma ocorrência encontrada.</div>';
    box.querySelectorAll('[data-delete-id]').forEach(btn=>btn.onclick=()=>deleteOne(btn.dataset.deleteId));
    rendering=false;
  }

  async function deleteOne(id){
    if(!isAdmin()||!id)return;
    if(!confirm('Deseja apagar somente este registro?'))return;
    try{await db.collection('monitor_erros').doc(id).delete();}
    catch(error){alert('Não foi possível apagar este registro agora.');console.warn(error);}
  }

  async function deleteAll(){
    if(!isAdmin()||!docs.length)return;
    if(!confirm(`Deseja apagar todos os ${docs.length} registros de ocorrências? Esta ação não pode ser desfeita.`))return;
    const button=document.getElementById('guardianDeleteAll');
    if(button){button.disabled=true;button.textContent='Apagando...';}
    try{
      for(let i=0;i<docs.length;i+=400){
        const batch=db.batch();
        docs.slice(i,i+400).forEach(item=>batch.delete(db.collection('monitor_erros').doc(item.id)));
        await batch.commit();
      }
    }catch(error){alert('Não foi possível apagar todos os registros.');console.warn(error);}
    finally{if(button){button.textContent='Apagar todos';button.disabled=false;}}
  }

  async function cleanupExpired(){
    if(!db||!isAdmin()||!navigator.onLine)return;
    const limit=Date.now()-TTL;
    try{
      const snap=await db.collection('monitor_erros').orderBy('criadoEm','asc').limit(250).get();
      const expired=snap.docs.filter(doc=>{const e=doc.data()||{};const d=toDate(e.criadoEm)||toDate(e.criadoEmLocal);return d&&d.getTime()<limit;});
      for(let i=0;i<expired.length;i+=400){const batch=db.batch();expired.slice(i,i+400).forEach(doc=>batch.delete(doc.ref));await batch.commit();}
    }catch(error){console.warn('IA Guardiã: limpeza de 24 horas adiada.',error);}
  }

  function listen(){
    if(!db||!user)return;
    unsub?.();
    let query=db.collection('monitor_erros').orderBy('criadoEm','desc').limit(120);
    if(!isAdmin())query=db.collection('monitor_erros').where('uid','==',user.uid).limit(50);
    unsub=query.onSnapshot(snap=>{docs=snap.docs.map(doc=>({id:doc.id,data:doc.data()||{}}));if(!isAdmin())docs.sort((a,b)=>(toDate(b.data.criadoEm)||0)-(toDate(a.data.criadoEm)||0));render();},()=>{});
  }

  function init(){
    const observer=new MutationObserver(()=>{if(!rendering){ensureControls();render();}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    const timer=setInterval(()=>{
      if(!window.firebase||!firebase.apps?.length)return;
      clearInterval(timer);db=firebase.firestore();
      firebase.auth().onAuthStateChanged(u=>{user=u;if(!u)return;listen();setTimeout(cleanupExpired,1800);});
      setInterval(cleanupExpired,30*60*1000);
    },250);
    setTimeout(()=>clearInterval(timer),20000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
(function(){
  'use strict';

  const ADMIN='sathlersamuel@gmail.com';
  const TTL=24*60*60*1000;
  let db=null,user=null,docs=[],opened=false,unsub=null,initialized=false;

  function isAdmin(){return String(user?.email||'').toLowerCase()===ADMIN;}
  function toDate(v){if(!v)return null;if(typeof v.toDate==='function')return v.toDate();const d=new Date(v);return isNaN(d)?null:d;}
  function fmt(v){const d=toDate(v);return d?d.toLocaleString('pt-BR'):'Sem data';}
  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function ensureStyles(){
    if(document.getElementById('guardianOccurrencesSafeStyle'))return;
    const s=document.createElement('style');
    s.id='guardianOccurrencesSafeStyle';
    s.textContent=`
      .guardian-safe-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .guardian-safe-actions button{border:1px solid #c8d6e8;border-radius:11px;padding:9px 12px;background:#eef5ff;color:#073b84;font-weight:800}
      .guardian-safe-actions .danger{background:#fff1f2;color:#a51628;border-color:#f0b9c0}
      .guardian-safe-count{margin-top:8px;color:#66758a;font-weight:700}
      #guardiaErrors.guardian-safe-collapsed{display:none!important}
      .guardia-alerta{position:relative;padding-right:54px!important}
      .guardian-safe-delete{position:absolute;top:10px;right:10px;width:36px;height:36px;border:1px solid #efc1c7;border-radius:10px;background:#fff;color:#b42335;font-size:18px;font-weight:900}
    `;
    document.head.appendChild(s);
  }

  function getHost(){
    const box=document.getElementById('guardiaErrors');
    const panel=box?.closest('.guardia-painel');
    return {box,panel};
  }

  function installUI(){
    if(initialized)return true;
    const {box,panel}=getHost();
    if(!box||!panel)return false;
    ensureStyles();

    const head=panel.querySelector('.guardia-painel-cabeca');
    if(!head)return false;

    const actions=document.createElement('div');
    actions.className='guardian-safe-actions';
    actions.innerHTML='<button type="button" id="guardianSafeToggle">Ver registros</button><button type="button" id="guardianSafeDeleteAll" class="danger">Apagar todos</button>';
    head.insertAdjacentElement('afterend',actions);

    const count=document.createElement('div');
    count.id='guardianSafeCount';
    count.className='guardian-safe-count';
    actions.insertAdjacentElement('afterend',count);

    document.getElementById('guardianSafeToggle').onclick=()=>{opened=!opened;render();};
    document.getElementById('guardianSafeDeleteAll').onclick=deleteAll;

    initialized=true;
    render();
    return true;
  }

  function render(){
    if(!installUI())return;
    const {box}=getHost();
    const toggle=document.getElementById('guardianSafeToggle');
    const delAll=document.getElementById('guardianSafeDeleteAll');
    const count=document.getElementById('guardianSafeCount');
    if(!box||!toggle||!delAll||!count)return;

    count.textContent=docs.length?`${docs.length} registro(s). Exclusão automática após 24 horas.`:'Nenhum registro armazenado.';
    toggle.textContent=opened?`Ocultar registros (${docs.length})`:`Ver registros (${docs.length})`;
    delAll.disabled=!docs.length||!isAdmin();
    box.classList.toggle('guardian-safe-collapsed',!opened);
    if(!opened)return;

    box.innerHTML=docs.length?docs.map(({id,data:e})=>`<article class="guardia-alerta ${esc(e.gravidade||'atencao')}"><div><strong>${esc(e.tipo||'Ocorrência')}</strong><div>${esc(e.mensagem||'Sem descrição')}</div><small>${esc(e.email||e.usuario||'Usuário não identificado')} • ${fmt(e.criadoEm||e.criadoEmLocal)}</small></div>${isAdmin()?`<button type="button" class="guardian-safe-delete" data-id="${esc(id)}" aria-label="Apagar registro">×</button>`:''}</article>`).join(''):'<div class="guardia-vazio">Nenhuma ocorrência encontrada.</div>';

    box.querySelectorAll('.guardian-safe-delete').forEach(btn=>btn.onclick=()=>deleteOne(btn.dataset.id));
  }

  async function deleteOne(id){
    if(!isAdmin()||!id)return;
    if(!confirm('Deseja apagar somente este registro?'))return;
    try{await db.collection('monitor_erros').doc(id).delete();}
    catch(_){alert('Não foi possível apagar este registro agora.');}
  }

  async function deleteAll(){
    if(!isAdmin()||!docs.length)return;
    if(!confirm(`Deseja apagar todos os ${docs.length} registros? Esta ação não pode ser desfeita.`))return;
    const btn=document.getElementById('guardianSafeDeleteAll');
    if(btn){btn.disabled=true;btn.textContent='Apagando...';}
    try{
      for(let i=0;i<docs.length;i+=400){
        const batch=db.batch();
        docs.slice(i,i+400).forEach(item=>batch.delete(db.collection('monitor_erros').doc(item.id)));
        await batch.commit();
      }
    }catch(_){alert('Não foi possível apagar todos os registros.');}
    finally{if(btn){btn.textContent='Apagar todos';btn.disabled=false;}}
  }

  async function cleanupExpired(){
    if(!db||!isAdmin()||!navigator.onLine)return;
    const cutoff=Date.now()-TTL;
    try{
      const snap=await db.collection('monitor_erros').orderBy('criadoEm','asc').limit(250).get();
      const expired=snap.docs.filter(doc=>{const e=doc.data()||{};const d=toDate(e.criadoEm)||toDate(e.criadoEmLocal);return d&&d.getTime()<cutoff;});
      for(let i=0;i<expired.length;i+=400){const batch=db.batch();expired.slice(i,i+400).forEach(doc=>batch.delete(doc.ref));await batch.commit();}
    }catch(error){console.warn('IA Guardiã: limpeza automática adiada.',error);}
  }

  function listen(){
    if(!db||!user)return;
    unsub?.();
    let q=db.collection('monitor_erros').orderBy('criadoEm','desc').limit(120);
    if(!isAdmin())q=db.collection('monitor_erros').where('uid','==',user.uid).limit(50);
    unsub=q.onSnapshot(snap=>{
      docs=snap.docs.map(doc=>({id:doc.id,data:doc.data()||{}}));
      if(!isAdmin())docs.sort((a,b)=>((toDate(b.data.criadoEm)||new Date(0)).getTime()-((toDate(a.data.criadoEm)||new Date(0)).getTime())));
      render();
    },()=>{});
  }

  function init(){
    let tries=0;
    const uiTimer=setInterval(()=>{tries++;if(installUI()||tries>40)clearInterval(uiTimer);},250);
    const fbTimer=setInterval(()=>{
      if(!window.firebase||!firebase.apps?.length)return;
      clearInterval(fbTimer);
      db=firebase.firestore();
      firebase.auth().onAuthStateChanged(u=>{user=u;if(!u)return;listen();setTimeout(cleanupExpired,2000);});
      setInterval(cleanupExpired,30*60*1000);
    },250);
    setTimeout(()=>clearInterval(fbTimer),20000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
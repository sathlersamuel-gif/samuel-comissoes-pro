(function(){
  'use strict';

  const MANIFEST_URL='guardian-app-manifest.json';
  const REFRESH_MS=30*60*1000;
  const CHECK_CONCURRENCY=6;
  let manifest=null,lastLoaded=0,loading=null;

  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  async function load(force=false){
    if(loading)return loading;
    if(!force&&manifest&&Date.now()-lastLoaded<REFRESH_MS)return manifest;
    loading=(async()=>{
      const response=await fetch(MANIFEST_URL+'?guardian='+Date.now(),{cache:'no-store'});
      if(!response.ok)throw new Error('Mapa completo ainda não foi publicado');
      const data=await response.json();
      if(!data||!Array.isArray(data.files))throw new Error('Mapa do aplicativo inválido');
      manifest=data;lastLoaded=Date.now();
      try{localStorage.setItem('scp_guardian_repository_knowledge',JSON.stringify({generatedAt:data.generatedAt,commit:data.commit,summary:data.summary}));}catch(_){}
      renderStatus();
      return manifest;
    })().finally(()=>{loading=null;});
    return loading;
  }

  function search(term){
    if(!manifest)return [];
    const q=String(term||'').trim().toLowerCase();
    if(!q)return [];
    const results=[];
    manifest.files.forEach(f=>{if(f.path.toLowerCase().includes(q))results.push({type:'file',...f});});
    manifest.symbols?.forEach(s=>{if(s.name.toLowerCase().includes(q)||s.file.toLowerCase().includes(q))results.push({type:'symbol',...s});});
    manifest.domIds?.forEach(id=>{if(id.toLowerCase().includes(q))results.push({type:'dom-id',name:id});});
    manifest.storageKeys?.forEach(key=>{if(key.toLowerCase().includes(q))results.push({type:'storage-key',name:key});});
    manifest.firestoreCollections?.forEach(name=>{if(name.toLowerCase().includes(q))results.push({type:'firestore',name});});
    return results.slice(0,100);
  }

  async function checkFile(file){
    try{
      const r=await fetch(file.path+'?guardian_check='+Date.now(),{cache:'no-store',method:'GET'});
      return {area:'repositorio',item:file.path,ok:r.ok,detail:r.ok?'Arquivo acessível':'HTTP '+r.status};
    }catch(error){return {area:'repositorio',item:file.path,ok:false,detail:error?.message||'Arquivo inacessível'};}
  }

  async function auditAllFiles(){
    const map=await load();
    const files=map.files.filter(f=>!f.path.startsWith('.github/')&&!f.path.startsWith('scripts/'));
    const checks=new Array(files.length);
    let index=0;
    async function worker(){
      while(index<files.length){const i=index++;checks[i]=await checkFile(files[i]);}
    }
    await Promise.all(Array.from({length:Math.min(CHECK_CONCURRENCY,files.length||1)},worker));
    checks.push({area:'conhecimento',item:'mapa-completo',ok:true,detail:`${map.summary?.files||files.length} arquivos, ${map.summary?.symbols||0} funções/símbolos, ${map.summary?.domIds||0} elementos de tela e ${map.summary?.firestoreCollections||0} coleções mapeadas`});
    return checks;
  }

  function renderStatus(){
    const host=document.querySelector('#iaGuardia .guardia-hero');
    if(!host||!manifest)return;
    let card=document.getElementById('guardianKnowledgeStatus');
    if(!card){
      card=document.createElement('div');card.id='guardianKnowledgeStatus';
      card.style.cssText='margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.1);color:#fff;font-weight:700;line-height:1.45';
      host.appendChild(card);
    }
    const s=manifest.summary||{};
    card.innerHTML=`Conhecimento do aplicativo atualizado<br><small style="font-weight:600;color:#cfe0f7">${esc(s.files||0)} arquivos • ${esc(s.symbols||0)} funções/símbolos • ${esc(s.domIds||0)} campos/telas • ${esc(s.firestoreCollections||0)} coleções Firebase</small>`;
  }

  function wrapAudit(){
    const api=window.SCPGuardianAutoFix;
    if(!api||api.__knowledgeWrapped)return false;
    const original=api.audit;
    if(typeof original!=='function')return false;
    api.audit=async function(){
      const base=await original();
      try{
        const knowledgeChecks=await auditAllFiles();
        base.checks=[...(base.checks||[]),...knowledgeChecks];
        base.failed=base.checks.filter(c=>!c.ok);
        base.repositoryKnowledge={generatedAt:manifest?.generatedAt,commit:manifest?.commit,summary:manifest?.summary};
      }catch(error){
        const check={area:'conhecimento',item:'mapa-completo',ok:false,detail:error?.message||'Mapa indisponível'};
        base.checks=[...(base.checks||[]),check];base.failed=[...(base.failed||[]),check];
      }
      return base;
    };
    api.__knowledgeWrapped=true;
    return true;
  }

  function init(){
    load().catch(()=>{});
    let tries=0;
    const timer=setInterval(()=>{tries++;if(wrapAudit()||tries>80)clearInterval(timer);},250);
    setInterval(()=>load(true).catch(()=>{}),REFRESH_MS);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load().catch(()=>{});});
    window.SCPGuardianKnowledge={load,search,audit:auditAllFiles,get manifest(){return manifest;}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

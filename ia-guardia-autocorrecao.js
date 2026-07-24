(function(){
'use strict';

const ADMIN='sathlersamuel@gmail.com';
let db=null,auth=null,user=null,unsubscribe=null,failures=[];

function esc(value=''){
  return String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function toDate(value){
  if(!value)return null;
  if(typeof value.toDate==='function')return value.toDate();
  const date=new Date(value);
  return Number.isNaN(date.getTime())?null:date;
}

function formatDate(value){
  const date=toDate(value);
  return date?date.toLocaleString('pt-BR'):'Sem registro';
}

function isAdmin(){
  return String(user?.email||'').toLowerCase()===ADMIN;
}

function currentCheck(name){
  switch(String(name||'').toLowerCase()){
    case 'dados de vendas':{
      try{
        const sales=JSON.parse(localStorage.getItem('samuel_comissoes_pro')||'[]');
        return {ok:Array.isArray(sales),detail:Array.isArray(sales)?`${sales.length} vendas legíveis`:'Formato inválido'};
      }catch(error){
        return {ok:false,detail:'Os dados locais continuam ilegíveis. Nenhum dado foi apagado para evitar perda de vendas.'};
      }
    }
    case 'internet':
      return {ok:navigator.onLine,detail:navigator.onLine?'Conexão restabelecida':'O aparelho continua sem internet'};
    case 'autenticação':
      return {ok:Boolean(auth?.currentUser),detail:auth?.currentUser?.email||'Usuário ainda não autenticado'};
    case 'tela de vendas':
      return {ok:Boolean(document.getElementById('formVenda')),detail:'Estrutura da tela de vendas'};
    case 'firebase':
      return {ok:Boolean(window.firebase&&firebase.apps?.length),detail:'Inicialização do Firebase'};
    case 'service worker':
      return {ok:'serviceWorker' in navigator,detail:'Compatibilidade PWA'};
    default:
      return {ok:false,detail:'Esta falha não possui correção automática segura'};
  }
}

async function attemptRepair(failure){
  const checks=Array.isArray(failure?.contexto?.checks)?failure.contexto.checks:[];
  const failedChecks=checks.filter(check=>check&&check.ok===false);
  const results=[];

  for(const check of failedChecks){
    const result=currentCheck(check.nome);
    results.push({name:check.nome||'Verificação',...result});
  }

  if(!failedChecks.length){
    const type=String(failure.tipo||'').toLowerCase();
    const message=String(failure.mensagem||'').toLowerCase();
    if(type.includes('diagnostico')&&message.includes('nenhuma falha')){
      return {fixed:true,details:['Diagnóstico saudável removido do histórico.']};
    }
    return {fixed:false,details:['Não existe uma correção automática segura cadastrada para esta ocorrência.']};
  }

  const fixed=results.every(result=>result.ok);
  return {
    fixed,
    details:results.map(result=>`${result.ok?'✓':'✕'} ${result.name}: ${result.detail}`)
  };
}

async function authorizeAndRepair(id){
  if(!isAdmin()){
    alert('Somente o administrador pode autorizar correções.');
    return;
  }
  const failure=failures.find(item=>item.id===id);
  if(!failure)return;

  const description=failure.mensagem||failure.tipo||'Falha sem descrição';
  const authorized=confirm(`Autorizar a IA Guardiã a tentar corrigir esta falha?\n\n${description}\n\nNenhum dado de venda será apagado automaticamente.`);
  if(!authorized)return;

  const button=document.querySelector(`[data-guardian-repair="${CSS.escape(id)}"]`);
  if(button){button.disabled=true;button.textContent='Verificando...';}

  try{
    const result=await attemptRepair(failure);
    const ref=db.collection('monitor_erros').doc(id);

    if(result.fixed){
      await ref.delete();
      alert(`Falha corrigida e removida do histórico.\n\n${result.details.join('\n')}`);
    }else{
      await ref.set({
        status:'pendente',
        ultimaTentativaEm:firebase.firestore.FieldValue.serverTimestamp(),
        ultimaTentativaPor:user.email||'',
        tentativaAutomatica:{
          sucesso:false,
          detalhes:result.details,
          executadaEmLocal:new Date().toISOString()
        }
      },{merge:true});
      alert(`A IA Guardiã não conseguiu corrigir esta falha com segurança. Ela continuará aparecendo no histórico.\n\n${result.details.join('\n')}`);
    }
  }catch(error){
    console.error('IA Guardiã: falha ao executar correção',error);
    alert('Não foi possível concluir a correção agora. A ocorrência continuará aparecendo para nova tentativa.');
  }finally{
    if(button){button.disabled=false;button.textContent='Ver falha';}
  }
}

function renderPending(){
  const box=document.getElementById('guardiaErrors');
  if(!box)return;
  const filter=document.getElementById('guardiaFiltro')?.value||'todos';
  const list=failures
    .filter(item=>item.status!=='resolvido')
    .filter(item=>filter==='todos'||item.gravidade===filter)
    .slice(0,80);

  if(!list.length){
    box.innerHTML='<div class="guardia-vazio">Nenhuma falha pendente encontrada.</div>';
    return;
  }

  box.innerHTML=list.map(item=>{
    const attempt=Array.isArray(item?.tentativaAutomatica?.detalhes)
      ?`<small class="guardia-tentativa">Última tentativa: ${esc(item.tentativaAutomatica.detalhes.join(' • '))}</small>`:'';
    return `<article class="guardia-alerta ${esc(item.gravidade||'atencao')}">
      <div>
        <strong>${esc(item.tipo||'Ocorrência')}</strong>
        <div>${esc(item.mensagem||'Sem descrição')}</div>
        <small>${esc(item.email||item.usuario||'Usuário não identificado')} • ${formatDate(item.criadoEm||item.criadoEmLocal)}</small>
        <small>${esc(item.dispositivo?.nome||item.dispositivo?.sistema||'')} ${item.arquivo?`• ${esc(item.arquivo)}${item.linha?':'+esc(item.linha):''}`:''}</small>
        ${attempt}
        <button type="button" class="guardia-ver-falha" data-guardian-repair="${esc(item.id)}">Ver falha</button>
      </div>
    </article>`;
  }).join('');

  box.querySelectorAll('[data-guardian-repair]').forEach(button=>{
    button.onclick=()=>authorizeAndRepair(button.dataset.guardianRepair);
  });
}

function applyStyles(){
  if(document.getElementById('guardiaAutoFixStyles'))return;
  const style=document.createElement('style');
  style.id='guardiaAutoFixStyles';
  style.textContent=`
    .guardia-ver-falha{margin-top:12px;border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer;background:#0b63ce;color:#fff}
    .guardia-ver-falha:disabled{opacity:.65;cursor:wait}
    .guardia-tentativa{display:block;margin-top:8px;line-height:1.35;color:#f2c46d}
  `;
  document.head.appendChild(style);
}

function startListener(){
  if(!db||!user)return;
  if(unsubscribe)unsubscribe();
  let query=db.collection('monitor_erros').orderBy('criadoEm','desc').limit(120);
  if(!isAdmin())query=db.collection('monitor_erros').where('uid','==',user.uid).limit(50);
  unsubscribe=query.onSnapshot(snapshot=>{
    failures=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    failures.sort((a,b)=>(toDate(b.criadoEm)||toDate(b.criadoEmLocal)||0)-(toDate(a.criadoEm)||toDate(a.criadoEmLocal)||0));
    renderPending();
  },error=>console.warn('IA Guardiã: falha ao carregar correções',error));
}

function init(){
  applyStyles();
  const timer=setInterval(()=>{
    if(!window.firebase||!firebase.apps?.length)return;
    clearInterval(timer);
    auth=firebase.auth();
    db=firebase.firestore();
    auth.onAuthStateChanged(currentUser=>{
      user=currentUser;
      if(user)startListener();
    });
    document.addEventListener('change',event=>{
      if(event.target?.id==='guardiaFiltro')setTimeout(renderPending,0);
    });
  },250);
  setTimeout(()=>clearInterval(timer),20000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

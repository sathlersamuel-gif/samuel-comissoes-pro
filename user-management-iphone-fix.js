(function(){
  'use strict';
  const ADMIN_EMAIL='sathlersamuel@gmail.com';
  const VERSION='2026.07.21.7';
  let db=null;
  let carregando=false;

  function firebasePronto(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return false;
    db=firebase.firestore();
    return true;
  }
  function ehAdmin(){
    return String(firebase.auth().currentUser?.email||'').trim().toLowerCase()===ADMIN_EMAIL;
  }
  function escapar(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function data(v){try{return v?.toDate?v.toDate():v?new Date(v):null}catch(_){return null}}
  function formatar(v){const d=data(v);return d&&!Number.isNaN(d.getTime())?d.toLocaleString('pt-BR'):'Não informado'}
  function status(u){
    if(u.status==='bloqueado')return ['Bloqueado','#991b1b'];
    if(u.status==='pendente')return ['Pendente','#92400e'];
    const fim=data(u.expiraEm);
    if(fim&&fim<Date.now())return ['Vencido','#991b1b'];
    if(fim)return ['Em teste','#174c96'];
    return ['Ativo','#166534'];
  }
  function comLimite(promessa,ms){return Promise.race([promessa,new Promise((_,r)=>setTimeout(()=>r(new Error('Tempo de consulta excedido')),ms))]);}

  function estilos(){
    if(document.getElementById('scpIphoneUserFixStyles'))return;
    const s=document.createElement('style');s.id='scpIphoneUserFixStyles';s.textContent=`
      .scp-iphone-resumo{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:12px 0 16px}
      .scp-iphone-resumo div{background:#0b213d;border:1px solid #244d76;border-radius:16px;padding:14px;color:#fff}
      .scp-iphone-resumo span{display:block;color:#9fb1cb;font-size:11px;font-weight:800;text-transform:uppercase}.scp-iphone-resumo strong{font-size:28px}
      .scp-iphone-card{background:#0a1d35;border:1px solid #244d76;border-radius:18px;padding:15px;margin:0 0 12px;color:#fff}
      .scp-iphone-topo{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.scp-iphone-email{font-weight:900;overflow-wrap:anywhere}.scp-iphone-status{padding:6px 9px;border-radius:999px;font-size:12px;font-weight:900;background:#fff}
      .scp-iphone-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.scp-iphone-info div{background:#102b4a;border-radius:12px;padding:10px}.scp-iphone-info span{display:block;color:#91a6c3;font-size:10px;text-transform:uppercase}.scp-iphone-info strong{display:block;margin-top:3px;font-size:13px}
      .scp-iphone-acoes{display:grid;grid-template-columns:1fr 1fr;gap:8px}.scp-iphone-acoes button{min-height:42px;border:0;border-radius:12px;color:#fff;font-weight:900}.scp-iphone-bloquear{background:#9a6700}.scp-iphone-ativar{background:#0b7a2d}.scp-iphone-excluir{background:#941f2b;grid-column:1/-1}
      .scp-iphone-erro{background:#3b1720;border:1px solid #7f1d1d;color:#fff;border-radius:16px;padding:16px}.scp-iphone-retry{margin-top:12px;width:100%;padding:12px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-weight:900}
    `;document.head.appendChild(s);
  }

  async function alterar(uid,novoStatus){
    await db.collection('usuarios').doc(uid).set({status:novoStatus,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    await carregar(true);
  }
  async function excluir(uid,email){
    if(!confirm(`Excluir definitivamente ${email||'este usuário'}?`))return;
    const lote=db.batch();
    const ref=db.collection('usuarios').doc(uid);
    const bloqueio=db.collection('usuariosExcluidos').doc(uid);
    lote.set(bloqueio,{uid,email:email||'',motivo:'exclusao_administrativa',excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),excluidoPor:ADMIN_EMAIL},{merge:true});
    lote.set(ref,{uid,email:email||'',status:'excluido',vendas:[],vendasExcluidas:[],atualizadoEm:firebase.firestore.FieldValue.serverTimestamp(),excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),excluidoPor:ADMIN_EMAIL},{merge:true});
    await lote.commit();
    await carregar(true);
  }

  function renderizar(lista,usuarios){
    const validos=usuarios.filter(u=>String(u.email||'').toLowerCase()!==ADMIN_EMAIL&&u.status!=='excluido');
    const ativos=validos.filter(u=>!['bloqueado','pendente'].includes(u.status)).length;
    lista.innerHTML=`<div class="scp-iphone-resumo"><div><span>Total</span><strong>${validos.length}</strong></div><div><span>Ativos</span><strong>${ativos}</strong></div></div>`+
      (validos.length?validos.map(u=>{const st=status(u);return `<article class="scp-iphone-card"><div class="scp-iphone-topo"><div><div class="scp-iphone-email">${escapar(u.email||'Sem e-mail')}</div><small>Cadastro: ${escapar(formatar(u.criadoEm))}</small></div><span class="scp-iphone-status" style="color:${st[1]}">${st[0]}</span></div><div class="scp-iphone-info"><div><span>Último acesso</span><strong>${escapar(formatar(u.ultimoAcesso))}</strong></div><div><span>Acessos</span><strong>${Number(u.totalAcessos||0)}</strong></div><div><span>Vendas</span><strong>${Array.isArray(u.vendas)?u.vendas.length:0}</strong></div><div><span>Vencimento</span><strong>${escapar(formatar(u.expiraEm))}</strong></div></div><div class="scp-iphone-acoes"><button class="${u.status==='bloqueado'?'scp-iphone-ativar':'scp-iphone-bloquear'}" data-fix-acao="${u.status==='bloqueado'?'ativo':'bloqueado'}" data-uid="${escapar(u.id)}">${u.status==='bloqueado'?'Desbloquear':'Bloquear'}</button><button class="scp-iphone-ativar" data-fix-acao="ativo" data-uid="${escapar(u.id)}">Ativar</button><button class="scp-iphone-excluir" data-fix-acao="excluir" data-uid="${escapar(u.id)}" data-email="${escapar(u.email||'')}">Excluir</button></div></article>`}).join(''):'<div class="scp-iphone-card">Nenhum usuário cadastrado.</div>');
    lista.querySelectorAll('[data-fix-acao]').forEach(b=>b.onclick=async()=>{try{b.disabled=true;if(b.dataset.fixAcao==='excluir')await excluir(b.dataset.uid,b.dataset.email);else await alterar(b.dataset.uid,b.dataset.fixAcao)}catch(e){alert('Não foi possível concluir esta ação.');console.error(e)}finally{b.disabled=false}});
    const selo=document.getElementById('gestaoUsuariosVersao');if(selo)selo.textContent=`Gestão ${VERSION}`;
  }

  async function carregar(forcar){
    if(carregando&&!forcar)return;
    if(!firebasePronto()||!ehAdmin())return;
    const painel=document.getElementById('painelUsuarios');
    const lista=document.getElementById('listaUsuarios');
    if(!painel||!lista)return;
    carregando=true;estilos();
    lista.innerHTML='<p>Carregando usuários...</p>';
    try{
      let snap;
      try{snap=await comLimite(db.collection('usuarios').get({source:'server'}),8000)}catch(_){snap=await comLimite(db.collection('usuarios').get(),8000)}
      const usuarios=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.email||'').localeCompare(String(b.email||''),'pt-BR'));
      renderizar(lista,usuarios);
    }catch(e){
      console.error('[Gestão iPhone]',e);
      lista.innerHTML=`<div class="scp-iphone-erro"><strong>Não foi possível carregar os usuários.</strong><br><small>${escapar(e.message||'Falha na conexão com o Firebase.')}</small><button class="scp-iphone-retry" type="button">Tentar novamente</button></div>`;
      lista.querySelector('.scp-iphone-retry').onclick=()=>carregar(true);
    }finally{carregando=false;}
  }

  function observar(){
    document.addEventListener('click',e=>{if(e.target.closest?.('#adminUsuariosBtn,#scpManageUsers'))setTimeout(()=>carregar(true),250)},true);
    const obs=new MutationObserver(()=>{const p=document.getElementById('painelUsuarios');const l=document.getElementById('listaUsuarios');if(p&&l&&p.style.display!=='none'&&/Carregando/i.test(l.textContent||''))setTimeout(()=>carregar(),500)});
    obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    firebase.auth().onAuthStateChanged(u=>{if(u&&ehAdmin())setTimeout(()=>carregar(),500)});
  }

  function iniciar(){if(!firebasePronto())return setTimeout(iniciar,250);window.carregarGerenciamentoUsuarios=()=>carregar(true);observar();window.__SCP_IPHONE_USER_FIX__=VERSION;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
(function(){
'use strict';

const ADMIN_EMAIL='sathlersamuel@gmail.com';
const APP_VERSION='1.1.0';
let stopPendentes=null;
let atualizacaoDisponivel=null;

function firebasePronto(){return Boolean(window.firebase&&firebase.apps&&firebase.apps.length)}
function usuario(){try{return firebase.auth().currentUser}catch(e){return null}}
function usuarioAtivo(){return Boolean(usuario())}
function ehAdmin(){
  const email=String(usuario()?.email||'').toLowerCase();
  return email===ADMIN_EMAIL||Boolean(document.getElementById('adminUsuariosBtn'));
}
function escapar(texto){return String(texto||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function dataFirebase(valor){if(!valor)return null;if(typeof valor.toDate==='function')return valor.toDate();const d=new Date(valor);return Number.isNaN(d.getTime())?null:d}
function formatarDataHora(valor){const d=dataFirebase(valor);return d?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(d):'Não informado'}

function estilos(){
  if(document.getElementById('scpSafeTopStyle'))return;
  const s=document.createElement('style');
  s.id='scpSafeTopStyle';
  s.textContent=`
    #firebaseUserBar{align-items:center!important;gap:8px!important}
    #firebaseUserEmail{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;margin-right:auto!important}
    #scpSafeBell,#firebaseUserBar #scpSecurityButton{position:relative!important;flex:0 0 44px!important;width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;border-radius:14px!important;background:#0b2a5a!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:20px!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:none!important;cursor:pointer!important;margin:0!important}
    #firebaseUserBar #scpSecurityTools{position:static!important;display:flex!important;align-items:center!important;flex:0 0 auto!important;margin:0!important;padding:0!important}
    #scpSafeBadge{position:absolute;right:-4px;top:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e32636;color:#fff;border:2px solid #fff;display:none;align-items:center;justify-content:center;font-size:10px;font-weight:900;line-height:1}
    #scpUpdateDot{position:absolute;left:-2px;top:-2px;width:11px;height:11px;border-radius:50%;background:#27a6ff;border:2px solid #fff;display:none}
    #firebaseUserBar #btnSairFirebase{flex:0 0 auto!important;min-height:44px!important;padding:0 16px!important;border-radius:14px!important;background:#e32636!important;color:#fff!important;font-weight:800!important;margin-left:0!important}
    #dashboard .perfil-acoes,#dashboard .profile-actions,#dashboard .perfil-card button.configuracao,#dashboard .perfil-card .engrenagem{display:none!important}
    body[data-scp-theme="claro"] #scpSafeBell,body[data-scp-theme="claro"] #firebaseUserBar #scpSecurityButton{background:#fff!important;color:#17355b!important;border-color:#d7e2ef!important}
    .scp-versao-detalhes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:9px 0 0}
    .scp-versao-item{background:#f4f7fb;border-radius:14px;padding:11px;min-width:0}
    .scp-versao-item span{display:block;font-size:11px;color:#728097;font-weight:800;text-transform:uppercase}
    .scp-versao-item strong{display:block;color:#172b4d;font-size:14px;margin-top:4px;overflow-wrap:anywhere}
    .scp-versao-chip{display:inline-flex;align-items:center;margin-top:5px;padding:4px 8px;border-radius:999px;background:#e8efff;color:#174c96;font-size:11px;font-weight:800}
    .scp-versao-chip.desatualizado{background:#fff2cc;color:#875900}
    #scpUpdatePanel{position:fixed;inset:0;z-index:12000;background:rgba(3,12,28,.74);display:none;align-items:center;justify-content:center;padding:18px}
    #scpUpdatePanel .scp-update-card{width:min(440px,100%);background:#fff;border-radius:24px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.32);color:#071b3d}
    #scpUpdatePanel h3{margin:0 0 8px;font-size:23px}#scpUpdatePanel p{color:#647188;line-height:1.5}
    #scpUpdatePanel .scp-update-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
    #scpUpdatePanel button{border:0;border-radius:13px;padding:13px;font-weight:900;cursor:pointer}.scp-update-later{background:#e9eef6;color:#33435e}.scp-update-now{background:#083b82;color:#fff}
    @media(max-width:520px){#firebaseUserBar{margin:10px 12px!important;padding:9px 10px!important;gap:6px!important}#scpSafeBell,#firebaseUserBar #scpSecurityButton{flex-basis:40px!important;width:40px!important;height:40px!important;min-width:40px!important;border-radius:12px!important}#firebaseUserBar #btnSairFirebase{min-height:40px!important;padding:0 12px!important;font-size:13px!important}#firebaseUserEmail{font-size:12px!important}.scp-versao-detalhes{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function garantirPainelAtualizacao(){
  if(document.getElementById('scpUpdatePanel'))return;
  const painel=document.createElement('div');
  painel.id='scpUpdatePanel';
  painel.innerHTML='<div class="scp-update-card" role="dialog" aria-modal="true" aria-labelledby="scpUpdateTitle"><h3 id="scpUpdateTitle">Nova atualização disponível</h3><p id="scpUpdateText">Existe uma nova versão do Samuel Comissões PRO disponível.</p><div class="scp-update-actions"><button type="button" class="scp-update-later">Agora não</button><button type="button" class="scp-update-now">Atualizar Agora</button></div></div>';
  document.body.appendChild(painel);
  painel.querySelector('.scp-update-later').onclick=()=>painel.style.display='none';
  painel.querySelector('.scp-update-now').onclick=()=>{const info=atualizacaoDisponivel||{};painel.style.display='none';if(typeof info.onUpdate==='function')return info.onUpdate();if(info.url)return location.assign(info.url);document.getElementById('scpSecurityButton')?.click()};
  painel.addEventListener('click',e=>{if(e.target===painel)painel.style.display='none'});
}

function abrirGerenciamento(){
  if(atualizacaoDisponivel){abrirAtualizacao();return}
  const botao=document.getElementById('adminUsuariosBtn');
  if(botao){botao.click();setTimeout(decorarVersoes,500);return}
  const painel=document.getElementById('painelUsuarios');
  if(painel){painel.style.display='block';setTimeout(decorarVersoes,500)}
}
function abrirAtualizacao(){garantirPainelAtualizacao();const texto=document.getElementById('scpUpdateText');if(texto&&atualizacaoDisponivel?.mensagem)texto.textContent=atualizacaoDisponivel.mensagem;document.getElementById('scpUpdatePanel').style.display='flex'}

function montarTopo(){
  const barra=document.getElementById('firebaseUserBar');
  const sair=document.getElementById('btnSairFirebase');
  if(!barra||!sair)return false;
  document.getElementById('scpSafeGear')?.remove();
  let sino=document.getElementById('scpSafeBell');
  if(!sino){sino=document.createElement('button');sino.type='button';sino.id='scpSafeBell';sino.setAttribute('aria-label','Notificações e usuários pendentes');sino.innerHTML='🔔<span id="scpSafeBadge"></span><span id="scpUpdateDot"></span>';sino.onclick=abrirGerenciamento}
  barra.insertBefore(sino,sair);
  const ferramentas=document.getElementById('scpSecurityTools');
  if(ferramentas)barra.insertBefore(ferramentas,sair);
  return true;
}

function atualizarBadge(qtd){const badge=document.getElementById('scpSafeBadge');if(!badge)return;badge.textContent=qtd>99?'99+':String(qtd);badge.style.display=qtd>0?'flex':'none'}
function atualizarIndicadorVersao(){const dot=document.getElementById('scpUpdateDot');if(dot)dot.style.display=atualizacaoDisponivel?'block':'none'}
function acompanharPendentes(){
  if(stopPendentes){stopPendentes();stopPendentes=null}
  if(!usuarioAtivo()){atualizarBadge(0);return}
  try{stopPendentes=firebase.firestore().collection('usuarios').where('status','==','pendente').onSnapshot(snap=>{const qtd=snap.docs.filter(d=>String(d.data().email||'').toLowerCase()!==ADMIN_EMAIL).length;atualizarBadge(qtd)},()=>atualizarBadge(0))}catch(err){atualizarBadge(0)}
}

async function registrarVersao(user){
  if(!user)return;
  try{await firebase.firestore().collection('usuarios').doc(user.uid).set({versaoApp:APP_VERSION,versaoAtualizadaEm:firebase.firestore.FieldValue.serverTimestamp(),ultimoAcesso:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}catch(err){console.warn('Não foi possível registrar a versão:',err)}
}

async function decorarVersoes(){
  const lista=document.getElementById('listaUsuarios');if(!lista)return;
  try{
    const snap=await firebase.firestore().collection('usuarios').get();
    const mapa=new Map(snap.docs.map(d=>[String(d.data().email||'').toLowerCase(),d.data()]));
    lista.querySelectorAll('.usuario-card.moderno,.usuario-card').forEach(card=>{
      const emailEl=card.querySelector('.usuario-email')||card.querySelector('p strong');if(!emailEl)return;
      const dados=mapa.get(String(emailEl.textContent||'').trim().toLowerCase())||{};
      const cabecalho=emailEl.parentElement;
      if((dados.nome||dados.displayName)&&!card.querySelector('.scp-usuario-nome')){const nome=document.createElement('div');nome.className='scp-usuario-nome';nome.style.cssText='font-size:14px;font-weight:900;color:#071b3d;margin-bottom:3px';nome.textContent=dados.nome||dados.displayName;cabecalho.insertBefore(nome,emailEl)}
      card.querySelector('.scp-versao-detalhes')?.remove();
      const versao=String(dados.versaoApp||'Não informada');
      const atualizado=versao===APP_VERSION;
      const detalhes=document.createElement('div');detalhes.className='scp-versao-detalhes';
      detalhes.innerHTML=`<div class="scp-versao-item"><span>Versão instalada</span><strong>${escapar(versao)}</strong><div class="scp-versao-chip${atualizado?'':' desatualizado'}">${atualizado?'Versão Atualizada':'Atualização Pendente'}</div></div><div class="scp-versao-item"><span>Último acesso</span><strong>${escapar(formatarDataHora(dados.ultimoAcesso))}</strong></div>`;
      const grade=card.querySelector('.usuario-grade');if(grade)grade.insertAdjacentElement('afterend',detalhes);else card.appendChild(detalhes);
    });
  }catch(err){console.warn('Não foi possível mostrar as versões:',err)}
}

function prepararAtualizacoes(){window.addEventListener('scp-update-available',e=>{atualizacaoDisponivel=e.detail||{};atualizarIndicadorVersao()});if(window.SCP_UPDATE_AVAILABLE){atualizacaoDisponivel=typeof window.SCP_UPDATE_AVAILABLE==='object'?window.SCP_UPDATE_AVAILABLE:{};atualizarIndicadorVersao()}}

function iniciar(){
  estilos();garantirPainelAtualizacao();prepararAtualizacoes();
  let tentativas=0;const timer=setInterval(()=>{tentativas++;montarTopo();if(tentativas>=80)clearInterval(timer)},150);
  const observar=new MutationObserver(()=>{montarTopo();if(document.getElementById('painelUsuarios')?.style.display==='block')setTimeout(decorarVersoes,100)});observar.observe(document.body,{childList:true,subtree:true});
  const conectar=()=>firebase.auth().onAuthStateChanged(u=>{montarTopo();registrarVersao(u);acompanharPendentes();atualizarIndicadorVersao();if(u)setTimeout(()=>{montarTopo();decorarVersoes()},900)});
  if(firebasePronto())conectar();else{let f=0;const aguarda=setInterval(()=>{f++;if(firebasePronto()){clearInterval(aguarda);conectar()}else if(f>=80)clearInterval(aguarda)},150)}
  document.addEventListener('click',e=>{if(e.target?.id==='adminUsuariosBtn'||e.target?.closest?.('#adminUsuariosBtn'))setTimeout(decorarVersoes,500)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
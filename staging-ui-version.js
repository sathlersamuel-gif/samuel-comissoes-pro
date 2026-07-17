(function(){
'use strict';

const ADMIN_EMAIL='sathlersamuel@gmail.com';
const APP_VERSION='1.2.0-test';
let stopPendentes=null;

function firebasePronto(){return Boolean(window.firebase&&firebase.apps&&firebase.apps.length)}
function usuario(){try{return firebase.auth().currentUser}catch(e){return null}}
function ehAdmin(){return String(usuario()?.email||'').toLowerCase()===ADMIN_EMAIL}
function aplicarModoBeta(){document.body.classList.toggle('scp-beta-admin',ehAdmin())}

function estilos(){
  if(document.getElementById('scpSafeTopStyle'))return;
  const s=document.createElement('style');
  s.id='scpSafeTopStyle';
  s.textContent=`
    body.scp-beta-admin #firebaseUserBar{display:flex!important;align-items:center!important;gap:8px!important}
    body.scp-beta-admin #firebaseUserEmail{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:auto}
    body.scp-beta-admin #scpSafeBell,body.scp-beta-admin #scpSafeGear{position:relative;flex:0 0 44px;width:44px;height:44px;padding:0!important;border-radius:14px!important;background:#0b2a5a!important;color:#fff!important;display:grid;place-items:center;font-size:20px;border:1px solid rgba(255,255,255,.14)!important}
    body.scp-beta-admin #scpSafeBadge{position:absolute;right:-4px;top:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e32636;color:#fff;border:2px solid #fff;display:none;align-items:center;justify-content:center;font-size:10px;font-weight:900;line-height:1}
    body.scp-beta-admin #firebaseUserBar #btnSairFirebase{flex:0 0 auto;min-height:44px;padding:0 16px!important;border-radius:14px!important;background:#e32636!important;color:#fff!important;font-weight:800}
    body.scp-beta-admin #dashboard .perfil-acoes{display:none!important}
    body.scp-beta-admin[data-scp-theme="claro"] #scpSafeBell,body.scp-beta-admin[data-scp-theme="claro"] #scpSafeGear{background:#fff!important;color:#17355b!important;border-color:#d7e2ef!important}
    body.scp-beta-admin .scp-versao-chip{display:inline-flex;align-items:center;margin-top:5px;padding:4px 8px;border-radius:999px;background:#e8efff;color:#174c96;font-size:11px;font-weight:800}
    body.scp-beta-admin .scp-versao-chip.desatualizado{background:#fff2cc;color:#875900}
    @media(max-width:520px){body.scp-beta-admin #firebaseUserBar{margin:10px 12px!important;padding:9px 10px!important;gap:6px!important}body.scp-beta-admin #scpSafeBell,body.scp-beta-admin #scpSafeGear{flex-basis:40px;width:40px;height:40px;border-radius:12px!important}body.scp-beta-admin #firebaseUserBar #btnSairFirebase{min-height:40px;padding:0 12px!important;font-size:13px}body.scp-beta-admin #firebaseUserEmail{font-size:12px}}
  `;
  document.head.appendChild(s);
}

function abrirGerenciamento(){
  const botao=document.getElementById('adminUsuariosBtn');
  if(botao){botao.click();setTimeout(decorarVersoes,500);return}
  const painel=document.getElementById('painelUsuarios');
  if(painel){painel.style.display='block';setTimeout(decorarVersoes,500)}
}
function abrirConfiguracoes(){const botao=document.getElementById('scpSecurityButton');if(botao)botao.click()}

function montarTopo(){
  aplicarModoBeta();
  if(!ehAdmin())return false;
  const barra=document.getElementById('firebaseUserBar');
  const sair=document.getElementById('btnSairFirebase');
  if(!barra||!sair)return false;
  let sino=document.getElementById('scpSafeBell');
  if(!sino){sino=document.createElement('button');sino.type='button';sino.id='scpSafeBell';sino.setAttribute('aria-label','Usuários pendentes');sino.innerHTML='🔔<span id="scpSafeBadge"></span>';sino.onclick=abrirGerenciamento}
  let gear=document.getElementById('scpSafeGear');
  if(!gear){gear=document.createElement('button');gear.type='button';gear.id='scpSafeGear';gear.setAttribute('aria-label','Configurações');gear.textContent='⚙️';gear.onclick=abrirConfiguracoes}
  barra.insertBefore(sino,sair);barra.insertBefore(gear,sair);return true;
}

function atualizarBadge(qtd){const badge=document.getElementById('scpSafeBadge');if(!badge)return;badge.textContent=qtd>99?'99+':String(qtd);badge.style.display=qtd>0?'flex':'none'}
function acompanharPendentes(){
  if(stopPendentes){stopPendentes();stopPendentes=null}
  if(!ehAdmin()){atualizarBadge(0);return}
  try{stopPendentes=firebase.firestore().collection('usuarios').where('status','==','pendente').onSnapshot(snap=>{const qtd=snap.docs.filter(d=>String(d.data().email||'').toLowerCase()!==ADMIN_EMAIL).length;atualizarBadge(qtd)},err=>console.warn('Falha ao contar pendentes:',err))}catch(err){console.warn('Falha ao iniciar contador:',err)}
}

async function registrarVersao(user){
  if(!user)return;
  try{await firebase.firestore().collection('usuarios').doc(user.uid).set({versaoApp:APP_VERSION,versaoAtualizadaEm:firebase.firestore.FieldValue.serverTimestamp(),ultimoAcesso:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}catch(err){console.warn('Não foi possível registrar a versão:',err)}
}

async function decorarVersoes(){
  if(!ehAdmin())return;
  const lista=document.getElementById('listaUsuarios');if(!lista)return;
  try{
    const snap=await firebase.firestore().collection('usuarios').get();
    const mapa=new Map(snap.docs.map(d=>[String(d.data().email||'').toLowerCase(),d.data()]));
    lista.querySelectorAll('.usuario-card.moderno').forEach(card=>{
      if(card.querySelector('.scp-versao-chip'))return;
      const emailEl=card.querySelector('.usuario-email');if(!emailEl)return;
      const dados=mapa.get(String(emailEl.textContent||'').trim().toLowerCase())||{};
      const versao=String(dados.versaoApp||'Não informada');
      const chip=document.createElement('span');chip.className='scp-versao-chip'+(versao!==APP_VERSION?' desatualizado':'');chip.textContent=versao===APP_VERSION?`Versão ${versao} — atualizada`:`Versão ${versao} — pendente`;emailEl.parentElement.appendChild(chip);
    });
  }catch(err){console.warn('Não foi possível mostrar as versões:',err)}
}

function iniciar(){
  estilos();
  let tentativas=0;const timer=setInterval(()=>{tentativas++;if(montarTopo()||tentativas>=40)clearInterval(timer)},150);
  const conectar=()=>firebase.auth().onAuthStateChanged(u=>{aplicarModoBeta();montarTopo();registrarVersao(u);acompanharPendentes();if(ehAdmin())setTimeout(decorarVersoes,800)});
  if(firebasePronto())conectar();else{let f=0;const aguarda=setInterval(()=>{f++;if(firebasePronto()){clearInterval(aguarda);conectar()}else if(f>=40)clearInterval(aguarda)},150)}
  document.addEventListener('click',e=>{if(e.target?.id==='adminUsuariosBtn'||e.target?.closest?.('#adminUsuariosBtn'))setTimeout(decorarVersoes,700)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
(function(){
'use strict';
const CHAVE='controle_vendas_modo_tela';
const MODOS=['automatico','celular','computador'];
const DADOS={automatico:{icone:'▣',titulo:'Modo automático'},celular:{icone:'▯',titulo:'Modo celular'},computador:{icone:'▭',titulo:'Modo computador'}};

function modoSalvo(){const m=localStorage.getItem(CHAVE);return MODOS.includes(m)?m:'automatico'}
function aplicar(modo){
  document.body.classList.remove('modo-automatico','modo-celular','modo-computador');
  document.body.classList.add('modo-'+modo);
  document.documentElement.dataset.modoTela=modo;
  atualizarBotao(modo);
}
function atualizarBotao(modo){
  const b=document.getElementById('botaoModoTela');if(!b)return;
  b.innerHTML=`<span aria-hidden="true">${DADOS[modo].icone}</span><small>${DADOS[modo].titulo}</small>`;
  b.title=DADOS[modo].titulo+' — toque para mudar';
  b.setAttribute('aria-label',DADOS[modo].titulo+'. Toque para mudar.');
}
function proximo(){const atual=modoSalvo(),novo=MODOS[(MODOS.indexOf(atual)+1)%MODOS.length];localStorage.setItem(CHAVE,novo);aplicar(novo)}
function inserirBotao(){
  const acoes=document.querySelector('#dashboard .perfil-acoes');
  if(!acoes||document.getElementById('botaoModoTela'))return;
  const b=document.createElement('button');b.type='button';b.id='botaoModoTela';b.className='botao-modo-tela';b.onclick=proximo;
  acoes.insertBefore(b,acoes.firstChild);atualizarBotao(modoSalvo());
}
function iniciar(){aplicar(modoSalvo());inserirBotao();
  const d=document.getElementById('dashboard');if(d)new MutationObserver(inserirBotao).observe(d,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

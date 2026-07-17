(function(){
'use strict';
const CHAVE='controle_vendas_modo_tela';
const MODOS=['automatico','celular','computador'];

function modoSalvo(){const m=localStorage.getItem(CHAVE);return MODOS.includes(m)?m:'automatico'}
function aplicar(modo){
  const modoValido=MODOS.includes(modo)?modo:'automatico';
  document.body.classList.remove('modo-automatico','modo-celular','modo-computador');
  document.body.classList.add('modo-'+modoValido);
  document.documentElement.dataset.modoTela=modoValido;
}
function selecionar(modo){
  const modoValido=MODOS.includes(modo)?modo:'automatico';
  localStorage.setItem(CHAVE,modoValido);
  aplicar(modoValido);
  document.dispatchEvent(new CustomEvent('scp:modo-visualizacao-alterado',{detail:{modo:modoValido}}));
}
function removerBotaoAntigo(){document.getElementById('botaoModoTela')?.remove()}
function iniciar(){
  aplicar(modoSalvo());
  removerBotaoAntigo();
  const d=document.getElementById('dashboard');
  if(d)new MutationObserver(removerBotaoAntigo).observe(d,{childList:true,subtree:true});
}
window.SCPModoVisualizacao={modos:[...MODOS],obter:modoSalvo,aplicar:selecionar};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

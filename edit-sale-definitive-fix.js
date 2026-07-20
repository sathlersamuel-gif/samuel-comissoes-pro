(function(){
'use strict';
const STORAGE='samuel_comissoes_pro';
const idVenda=v=>String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`);
const ler=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
const numeroBR=valor=>{const s=String(valor??'').replace(/R\$/g,'').trim();if(!s)return 0;if(s.includes(','))return Number(s.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0;return Number(s.replace(/[^\d.-]/g,''))||0};
function instalar(){
  const form=document.getElementById('formVenda');
  if(!form||document.documentElement.dataset.editFix==='3')return;
  document.documentElement.dataset.editFix='3';
  window.editarVenda=function(id){
    const lista=ler();
    const venda=lista.find(v=>idVenda(v)===String(id));
    if(!venda)return;
    form.dataset.editingId=idVenda(venda);
    try{if(typeof abrirTela==='function')abrirTela('novaVenda')}catch(_){ }
    const set=(campo,valor)=>{const el=document.getElementById(campo);if(el)el.value=valor??''};
    set('cliente',venda.cliente);set('telefone',venda.telefone);set('produto',venda.produto||venda.modelo);
    set('tipoVenda',venda.tipo||venda.tipoVenda);
    set('valorVenda',Number(venda.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
    set('porcentagem',String(Number(venda.porcentagem||0).toFixed(1)).replace('.',','));
    set('dataVenda',venda.data);set('observacao',venda.observacao);
    const botao=form.querySelector("button[type='submit']");if(botao)botao.textContent='SALVAR ALTERAÇÕES';
    try{if(typeof calcularComissao==='function')calcularComissao()}catch(_){ }
  };
  window.editarVendaSegura=id=>window.editarVenda(id);
  document.addEventListener('submit',function(e){
    if(e.target!==form)return;
    const editId=form.dataset.editingId;
    if(!editId)return;
    e.preventDefault();e.stopImmediatePropagation();
    const get=id=>document.getElementById(id);
    const lista=ler();
    const p=numeroBR(get('porcentagem')?.value),valor=numeroBR(get('valorVenda')?.value);
    const atualizada={id:editId,cliente:get('cliente')?.value?.trim()||'',telefone:get('telefone')?.value||'',produto:get('produto')?.value?.trim()||'',tipo:get('tipoVenda')?.value||'',valor,porcentagem:p,comissao:valor*p/100,data:get('dataVenda')?.value||new Date().toISOString().slice(0,10),observacao:get('observacao')?.value||''};
    const novaLista=lista.map(v=>idVenda(v)===String(editId)?{...v,...atualizada,id:v.id}:v);
    localStorage.setItem(STORAGE,JSON.stringify(novaLista));
    try{vendas=novaLista}catch(_){ }
    try{if(typeof salvarBanco==='function')salvarBanco()}catch(_){ }
    delete form.dataset.editingId;form.reset();if(get('comissao'))get('comissao').value='';
    const botao=form.querySelector("button[type='submit']");if(botao)botao.textContent='SALVAR VENDA';
    try{if(typeof atualizarDashboard==='function')atualizarDashboard();if(typeof carregarHistorico==='function')carregarHistorico()}catch(_){ }
    alert('Venda atualizada com sucesso!');try{if(typeof voltarDashboard==='function')voltarDashboard()}catch(_){ }
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);else instalar();
})();
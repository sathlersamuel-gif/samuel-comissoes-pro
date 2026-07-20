(function(){
'use strict';
function idVenda(v){return String(v?.id??`${v?.data||''}-${v?.cliente||''}-${v?.valor||''}`)}
function instalar(){
  window.editarVenda=function(id){
    const lista=Array.isArray(window.vendas)?window.vendas:[];
    const venda=lista.find(v=>idVenda(v)===String(id));
    if(!venda)return;
    const form=document.getElementById('formVenda');
    if(!form)return;
    form.dataset.editingId=idVenda(venda);
    try{if(typeof window.abrirTela==='function')window.abrirTela('novaVenda')}catch(_){ }
    const set=(campo,valor)=>{const el=document.getElementById(campo);if(el)el.value=valor??''};
    set('cliente',venda.cliente);
    set('telefone',venda.telefone);
    set('produto',venda.produto||venda.modelo);
    set('tipoVenda',venda.tipo||venda.tipoVenda);
    set('valorVenda',Number(venda.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
    set('porcentagem',String(Number(venda.porcentagem||0).toFixed(1)).replace('.',','));
    set('dataVenda',venda.data);
    set('observacao',venda.observacao);
    const botao=form.querySelector("button[type='submit']");
    if(botao)botao.textContent='SALVAR ALTERAÇÕES';
    try{if(typeof window.calcularComissao==='function')window.calcularComissao()}catch(_){ }
  };
  window.editarVendaSegura=id=>window.editarVenda(id);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,50));else setTimeout(instalar,50);
})();
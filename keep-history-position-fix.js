(function(){
  'use strict';

  function manterMesmoMes(ano,mes,scrollAnterior){
    if(typeof window.abrirMesAno==='function'){
      window.abrirMesAno(Number(ano),Number(mes));
    }
    const detalhes=document.getElementById('detalhesMes');
    const listaMeses=document.getElementById('listaMeses');
    if(detalhes)detalhes.style.display='block';
    if(listaMeses)listaMeses.style.display='none';
    requestAnimationFrame(()=>window.scrollTo(0,scrollAnterior));
  }

  function instalar(){
    const original=window.excluirVendaSegura;
    if(typeof original!=='function'||original.__mantemMesmoMes)return;

    const corrigida=function(id,ano,mes){
      const scrollAnterior=window.scrollY||0;
      const resultado=original.apply(this,arguments);
      setTimeout(()=>manterMesmoMes(ano,mes,scrollAnterior),0);
      setTimeout(()=>manterMesmoMes(ano,mes,scrollAnterior),250);
      return resultado;
    };
    corrigida.__mantemMesmoMes=true;
    window.excluirVendaSegura=corrigida;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0));
  }else{
    setTimeout(instalar,0);
  }
})();

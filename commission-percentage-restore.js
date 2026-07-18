(function(){
  'use strict';

  function numeroBR(valor){
    return Number(String(valor||'0').replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0;
  }

  function moedaBR(valor){
    return Number(valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function instalar(){
    const campo=document.getElementById('porcentagem');
    const valorVenda=document.getElementById('valorVenda');
    const valorComissao=document.getElementById('comissao');
    if(!campo||!valorVenda||!valorComissao)return;

    campo.type='text';
    campo.inputMode='numeric';
    campo.autocomplete='off';
    campo.setAttribute('aria-label','Comissão em porcentagem');

    function calcular(){
      const valor=numeroBR(valorVenda.value);
      const percentual=numeroBR(campo.value);
      valorComissao.value=percentual>0?moedaBR(valor*percentual/100):'';
    }

    function formatarDigitacao(evento){
      const tipo=evento.inputType||'';
      let atual=String(campo.value||'');

      if(tipo.startsWith('delete')){
        atual=atual.replace(/[^\d,]/g,'').replace(/,+/g,',');
        campo.value=atual;
        calcular();
        return;
      }

      const digitos=atual.replace(/\D/g,'').slice(0,3);
      if(!digitos){
        campo.value='';
      }else if(digitos.length===1){
        campo.value=digitos+',';
      }else{
        campo.value=digitos.slice(0,-1)+','+digitos.slice(-1);
      }
      calcular();
    }

    campo.addEventListener('input',formatarDigitacao,true);
    valorVenda.addEventListener('input',calcular,true);

    window.calcularComissao=calcular;
    window.__comissaoPercentualRestaurada=true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);
  else instalar();
})();

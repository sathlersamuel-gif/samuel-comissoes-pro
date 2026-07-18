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
    const tipoVenda=document.getElementById('tipoVenda');
    if(!campo||!valorVenda||!valorComissao||campo.dataset.percentualFinal==='1')return;

    campo.dataset.percentualFinal='1';
    campo.type='text';
    campo.inputMode='numeric';
    campo.autocomplete='off';
    campo.setAttribute('aria-label','Comissão em porcentagem');

    let ultimoValido='';
    let valorAntesTroca='';

    function calcular(){
      const valor=numeroBR(valorVenda.value);
      const percentual=numeroBR(campo.value);
      valorComissao.value=percentual>0?moedaBR(valor*percentual/100):'';
    }

    function normalizarDigitacao(){
      const digitos=String(campo.value||'').replace(/\D/g,'').slice(0,3);
      if(!digitos){
        campo.value='';
        ultimoValido='';
      }else if(digitos.length===1){
        campo.value=digitos+',';
        ultimoValido=campo.value;
      }else{
        campo.value=digitos.slice(0,-1)+','+digitos.slice(-1);
        ultimoValido=campo.value;
      }
      calcular();
    }

    function formatarDigitacao(evento){
      if(evento.isComposing)return;
      normalizarDigitacao();
    }

    function guardarAntesTroca(){
      valorAntesTroca=campo.value;
    }

    function restaurarAposTroca(){
      const preservar=valorAntesTroca||ultimoValido;
      if(preservar&&campo.value!==preservar)campo.value=preservar;
      calcular();
    }

    campo.addEventListener('input',formatarDigitacao,true);
    campo.addEventListener('focus',()=>{ultimoValido=campo.value||ultimoValido;});
    campo.addEventListener('blur',()=>{
      if(/^\d+,$/.test(campo.value))campo.value=campo.value+'0';
      if(campo.value)ultimoValido=campo.value;
      calcular();
    });
    valorVenda.addEventListener('input',calcular,true);

    if(tipoVenda){
      tipoVenda.addEventListener('pointerdown',guardarAntesTroca,true);
      tipoVenda.addEventListener('focus',guardarAntesTroca,true);
      tipoVenda.addEventListener('change',()=>setTimeout(restaurarAposTroca,0),true);
    }

    const form=document.getElementById('formVenda');
    if(form){
      form.addEventListener('reset',()=>{
        ultimoValido='';
        valorAntesTroca='';
        setTimeout(()=>{campo.value='';valorComissao.value='';},0);
      });
    }

    window.calcularComissao=calcular;
    window.__comissaoPercentualRestaurada=true;
    calcular();
  }

  instalar();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);
})();
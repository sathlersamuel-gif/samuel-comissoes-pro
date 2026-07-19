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
    const form=document.getElementById('formVenda');
    if(!campo||!valorVenda||!valorComissao||campo.dataset.percentualFinal==='4')return;

    campo.dataset.percentualFinal='4';
    campo.type='text';
    campo.inputMode='numeric';
    campo.autocomplete='off';
    campo.maxLength=3;
    campo.placeholder='Porcentagem (%)';
    campo.setAttribute('aria-label','Porcentagem da comissão');
    valorComissao.placeholder='Valor a receber';
    valorComissao.setAttribute('aria-label','Valor a receber em reais');

    function calcular(){
      const valor=numeroBR(valorVenda.value);
      const percentual=numeroBR(campo.value);
      valorComissao.value=moedaBR(valor*percentual/100);
    }

    function formatar(){
      const digitos=String(campo.value||'').replace(/\D/g,'').slice(0,2);
      if(!digitos){
        campo.value='';
      }else if(digitos.length===1){
        campo.value=digitos+',';
      }else{
        campo.value=digitos.charAt(0)+','+digitos.charAt(1);
      }
      calcular();
    }

    campo.addEventListener('input',evento=>{
      if(evento.isComposing)return;
      formatar();
    },true);

    campo.addEventListener('keydown',evento=>{
      if((evento.key==='Backspace'||evento.key==='Delete')&&/^\d,$/.test(campo.value)){
        evento.preventDefault();
        campo.value='';
        calcular();
      }
    },true);

    campo.addEventListener('blur',()=>{
      if(/^\d,$/.test(campo.value))campo.value+='0';
      calcular();
    });

    valorVenda.addEventListener('input',calcular,true);

    if(tipoVenda){
      tipoVenda.addEventListener('change',()=>{
        calcular();
      },true);
    }

    if(form){
      form.addEventListener('submit',()=>{
        const percentual=numeroBR(campo.value);
        campo.value=percentual.toFixed(1);
        calcular();
      },true);

      form.addEventListener('reset',()=>{
        setTimeout(()=>{
          campo.value='';
          valorComissao.value='';
        },0);
      });
    }

    window.calcularComissao=calcular;
    window.__comissaoPercentualRestaurada=true;
    calcular();
  }

  instalar();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);
})();
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
    if(!campo||!valorVenda||!valorComissao||campo.dataset.percentualFinal==='2')return;

    campo.dataset.percentualFinal='2';
    campo.type='text';
    campo.inputMode='numeric';
    campo.autocomplete='off';
    campo.setAttribute('aria-label','Comissão em porcentagem');

    function calcular(){
      const valor=numeroBR(valorVenda.value);
      const percentual=numeroBR(campo.value);
      valorComissao.value=percentual>0?moedaBR(valor*percentual/100):'';
    }

    function formatar(){
      const digitos=String(campo.value||'').replace(/\D/g,'').slice(0,3);
      if(!digitos){
        campo.value='';
      }else if(digitos.length===1){
        campo.value=digitos+',';
      }else{
        campo.value=digitos.slice(0,-1)+','+digitos.slice(-1);
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
      if(/^\d+,$/.test(campo.value))campo.value+='0';
      calcular();
    });

    valorVenda.addEventListener('input',calcular,true);

    if(tipoVenda){
      tipoVenda.addEventListener('change',calcular,true);
    }

    const form=document.getElementById('formVenda');
    if(form){
      form.addEventListener('submit',()=>{
        const botao=form.querySelector("button[type='submit']");
        const editando=/ALTERAÇÕES/i.test(botao?.textContent||'');
        if(editando)return;
        const exibido=campo.value;
        campo.value=String(numeroBR(exibido));
        setTimeout(()=>{
          campo.value=exibido;
          calcular();
        },0);
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
(function(){
  'use strict';

  function numeroBR(valor){
    return Number(String(valor || '0').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
  }

  function moedaBR(valor){
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function instalar(){
    const campo = document.getElementById('porcentagem');
    const valorVenda = document.getElementById('valorVenda');
    const valorComissao = document.getElementById('comissao');
    const tipoVenda = document.getElementById('tipoVenda');
    const form = document.getElementById('formVenda');

    if(!campo || !valorVenda || !valorComissao || campo.dataset.percentualFinal === '5') return;

    campo.dataset.percentualFinal = '5';
    campo.type = 'text';
    campo.inputMode = 'numeric';
    campo.autocomplete = 'off';
    campo.maxLength = 3;
    campo.placeholder = 'Porcentagem (%)';
    campo.setAttribute('aria-label', 'Porcentagem da comissão');
    valorComissao.placeholder = 'Valor a receber';
    valorComissao.setAttribute('aria-label', 'Valor a receber em reais');

    let digitos = '';

    function exibir(){
      if(!digitos){
        campo.value = '';
      }else if(digitos.length === 1){
        campo.value = digitos + ',0';
      }else{
        campo.value = digitos.charAt(0) + ',' + digitos.charAt(1);
      }
    }

    function sincronizarDoCampo(){
      const texto = String(campo.value || '').trim();
      if(!texto){
        digitos = '';
        exibir();
        return;
      }

      if(/^\d+[.,]\d$/.test(texto)){
        const partes = texto.replace('.', ',').split(',');
        digitos = (partes[0].charAt(0) + partes[1].charAt(0)).slice(0, 2);
      }else{
        const somenteDigitos = texto.replace(/\D/g, '');
        digitos = somenteDigitos.slice(0, 2);
      }
      exibir();
    }

    function calcular(){
      const valor = numeroBR(valorVenda.value);
      const percentual = numeroBR(campo.value);
      valorComissao.value = moedaBR(valor * percentual / 100);
    }

    campo.addEventListener('keydown', function(evento){
      if(evento.ctrlKey || evento.metaKey || evento.altKey) return;

      if(/^\d$/.test(evento.key)){
        evento.preventDefault();
        if(digitos.length < 2) digitos += evento.key;
        exibir();
        calcular();
        return;
      }

      if(evento.key === 'Backspace' || evento.key === 'Delete'){
        evento.preventDefault();
        digitos = digitos.slice(0, -1);
        exibir();
        calcular();
        return;
      }

      if(['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
      evento.preventDefault();
    }, true);

    campo.addEventListener('paste', function(evento){
      evento.preventDefault();
      const texto = (evento.clipboardData || window.clipboardData).getData('text');
      const normalizado = texto.replace('.', ',');
      if(/^\d+[.,]\d$/.test(normalizado)){
        const partes = normalizado.split(',');
        digitos = (partes[0].charAt(0) + partes[1].charAt(0)).slice(0, 2);
      }else{
        digitos = normalizado.replace(/\D/g, '').slice(0, 2);
      }
      exibir();
      calcular();
    }, true);

    campo.addEventListener('input', function(evento){
      if(evento.isComposing) return;
      sincronizarDoCampo();
      calcular();
    }, true);

    campo.addEventListener('focus', function(){
      sincronizarDoCampo();
      calcular();
    });

    campo.addEventListener('blur', function(){
      sincronizarDoCampo();
      calcular();
    });

    valorVenda.addEventListener('input', calcular, true);

    if(tipoVenda){
      tipoVenda.addEventListener('change', function(){
        const valorMantido = campo.value;
        calcular();
        campo.value = valorMantido;
      }, true);
    }

    if(form){
      form.addEventListener('submit', function(){
        sincronizarDoCampo();
        const percentual = numeroBR(campo.value);
        campo.value = percentual.toFixed(1);
        calcular();
      }, true);

      form.addEventListener('reset', function(){
        setTimeout(function(){
          digitos = '';
          campo.value = '';
          valorComissao.value = '';
        }, 0);
      });
    }

    const observarValorProgramatico = new MutationObserver(function(){
      if(document.activeElement !== campo){
        sincronizarDoCampo();
        calcular();
      }
    });
    observarValorProgramatico.observe(campo, { attributes: true, attributeFilter: ['value'] });

    window.calcularComissao = calcular;
    window.__comissaoPercentualRestaurada = true;
    sincronizarDoCampo();
    calcular();
  }

  instalar();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
})();
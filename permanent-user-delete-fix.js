(function(){
  'use strict';
  const FINAL_URL='user-management-final.js?v=1';

  function carregarControleFinal(){
    if(document.querySelector('script[data-scp-user-final="1"]'))return;
    const script=document.createElement('script');
    script.src=FINAL_URL;
    script.async=false;
    script.dataset.scpUserFinal='1';
    script.onerror=function(){
      console.error('Falha ao carregar o controle final de exclusão de usuários.');
      alert('Não foi possível carregar a correção de exclusão. Atualize o aplicativo e tente novamente.');
    };
    document.head.appendChild(script);
  }

  carregarControleFinal();
})();
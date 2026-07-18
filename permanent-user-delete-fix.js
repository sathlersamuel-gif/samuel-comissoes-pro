(function(){
  'use strict';

  const CORE_URL='user-management-core.js?v=3';

  function carregarNucleo(){
    if(window.__SCP_USER_MANAGEMENT_CORE__)return;
    if(document.querySelector('script[data-scp-user-core="1"]'))return;

    const script=document.createElement('script');
    script.src=CORE_URL;
    script.async=false;
    script.dataset.scpUserCore='1';
    script.onerror=function(){
      console.error('Falha ao carregar o núcleo de gerenciamento de usuários.');
      alert('Não foi possível carregar a correção de exclusão de usuários. Atualize o aplicativo e tente novamente.');
    };
    document.head.appendChild(script);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',carregarNucleo,{once:true});
  }else{
    carregarNucleo();
  }
})();
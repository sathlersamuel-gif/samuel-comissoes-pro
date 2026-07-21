(function(){
  'use strict';
  if (window.__SCP_USER_MANAGEMENT_UNIFIED__) return;
  if (document.querySelector('script[data-scp-user-management="1"]')) return;
  const script = document.createElement('script');
  script.src = 'user-management-unified.js?v=3';
  script.async = false;
  script.dataset.scpUserManagement = '1';
  script.onerror = function(){
    const conteudo = document.getElementById('listaUsuarios') || document.getElementById('umConteudo');
    if (conteudo) conteudo.innerHTML = '<p>Não foi possível carregar o Gerenciamento de Usuários.</p>';
  };
  document.body.appendChild(script);
})();
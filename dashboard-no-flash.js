(function(){
  'use strict';

  const STORAGE='samuel_comissoes_pro';
  const NOME='controle_vendas_nome_usuario';
  const FOTO='controle_vendas_foto_usuario';
  const OCULTAR='controle_vendas_ocultar_receber';

  function assinatura(){
    let email='';
    try{email=window.firebase?.auth?.().currentUser?.email||'';}catch(e){}
    return [
      localStorage.getItem(STORAGE)||'[]',
      localStorage.getItem(NOME)||'',
      localStorage.getItem(FOTO)||'',
      localStorage.getItem(OCULTAR)||'',
      email
    ].join('|');
  }

  function instalar(){
    const original=window.atualizarDashboard;
    if(typeof original!=='function')return setTimeout(instalar,50);
    if(original.__semFlash)return;

    let ultimaAssinatura=assinatura();

    function atualizarSemPiscar(){
      const dashboard=document.getElementById('dashboard');
      const atual=assinatura();

      if(dashboard&&dashboard.childElementCount>0&&atual===ultimaAssinatura){
        return;
      }

      const resultado=original.apply(this,arguments);
      ultimaAssinatura=assinatura();
      return resultado;
    }

    atualizarSemPiscar.__semFlash=true;
    window.atualizarDashboard=atualizarSemPiscar;
  }

  instalar();
})();
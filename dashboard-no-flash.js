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
    const atualizarOriginal=window.atualizarDashboard;
    const abrirOriginal=window.abrirTela;
    if(typeof atualizarOriginal!=='function'||typeof abrirOriginal!=='function'){
      return setTimeout(instalar,50);
    }
    if(abrirOriginal.__trocaSemFlash)return;

    let ultimaAssinatura='';
    let trocando=false;

    function atualizarAntesDeMostrar(){
      const dashboard=document.getElementById('dashboard');
      const atual=assinatura();
      if(!dashboard||dashboard.childElementCount===0||atual!==ultimaAssinatura){
        atualizarOriginal();
        ultimaAssinatura=assinatura();
      }
    }

    function abrirSemFlash(id){
      if(id!=='dashboard'){
        return abrirOriginal.apply(this,arguments);
      }

      if(document.getElementById('dashboard')?.classList.contains('ativa')){
        atualizarAntesDeMostrar();
        return;
      }

      if(trocando)return;
      trocando=true;

      atualizarAntesDeMostrar();

      requestAnimationFrame(()=>{
        abrirOriginal.call(this,'dashboard');
        trocando=false;
      });
    }

    abrirSemFlash.__trocaSemFlash=true;
    window.abrirTela=abrirSemFlash;
    ultimaAssinatura=assinatura();
  }

  instalar();
})();
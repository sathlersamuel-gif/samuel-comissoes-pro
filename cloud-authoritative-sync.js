(function(){
  'use strict';

  const STORAGE='samuel_comissoes_pro';
  const SYNC_VERSION='2026.07.18.2';

  function aplicarVendas(lista,uid){
    const dados=Array.isArray(lista)?lista:[];
    try{vendas=dados;}catch(erro){console.error('[Sincronização] Não foi possível atualizar as vendas em memória.',erro);}
    try{
      localStorage.setItem(STORAGE,JSON.stringify(dados));
      if(uid)localStorage.setItem(`${STORAGE}:${uid}`,JSON.stringify(dados));
      localStorage.setItem('scp_usuario_atual',uid||'');
      localStorage.setItem('scp_sync_version',SYNC_VERSION);
    }catch(erro){console.warn('[Sincronização] Falha ao atualizar o armazenamento local.',erro);}
    try{if(typeof atualizarDashboard==='function')atualizarDashboard();}catch(_){ }
    try{if(typeof carregarHistorico==='function')carregarHistorico();}catch(_){ }
  }

  function limparSessaoLocal(){
    aplicarVendas([],null);
    try{localStorage.removeItem(STORAGE);}catch(_){ }
  }

  function instalar(){
    if(window.__SCP_CLOUD_AUTHORITATIVE_SYNC__)return;
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return setTimeout(instalar,50);

    const auth=firebase.auth();
    const db=firebase.firestore();
    const original=auth.onAuthStateChanged.bind(auth);

    auth.onAuthStateChanged=function(proximo,erro,concluido){
      return original(async function(user){
        if(!user){
          limparSessaoLocal();
          return typeof proximo==='function'?proximo(user):undefined;
        }

        try{
          const snap=await db.collection('usuarios').doc(user.uid).get();
          const dados=snap.exists?snap.data():{};
          const vendasNuvem=Array.isArray(dados.vendas)?dados.vendas:[];
          aplicarVendas(vendasNuvem,user.uid);
          console.log(`[Sincronização ${SYNC_VERSION}] Firebase carregado como fonte principal.`,{uid:user.uid,total:vendasNuvem.length});
        }catch(falha){
          console.error('[Sincronização] Não foi possível carregar os dados da nuvem.',falha);
          const chave=`${STORAGE}:${user.uid}`;
          try{
            const copia=JSON.parse(localStorage.getItem(chave)||'[]');
            aplicarVendas(Array.isArray(copia)?copia:[],user.uid);
          }catch(_){aplicarVendas([],user.uid);}
        }

        return typeof proximo==='function'?proximo(user):undefined;
      },erro,concluido);
    };

    window.__SCP_CLOUD_AUTHORITATIVE_SYNC__=SYNC_VERSION;
  }

  instalar();
})();
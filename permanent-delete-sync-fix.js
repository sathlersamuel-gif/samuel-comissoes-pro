(function(){
  'use strict';

  const STORAGE='samuel_comissoes_pro';
  const DELETED_STORAGE='samuel_comissoes_pro_excluidas';
  let reconciliando=false;

  function idDaVenda(venda){
    return String(venda?.id ?? `${venda?.data||''}-${venda?.cliente||''}-${venda?.valor||''}`);
  }

  function lerVendas(){
    try{
      const dados=JSON.parse(localStorage.getItem(STORAGE)||'[]');
      return Array.isArray(dados)?dados:[];
    }catch(_){return [];}
  }

  function lerExcluidas(){
    try{
      const dados=JSON.parse(localStorage.getItem(DELETED_STORAGE)||'[]');
      return Array.isArray(dados)?dados:[];
    }catch(_){return [];}
  }

  function normalizarExcluidas(lista){
    const mapa=new Map();
    (lista||[]).forEach(item=>{
      const registro=typeof item==='object'&&item!==null?item:{id:item};
      const id=String(registro.id||'');
      if(!id)return;
      const anterior=mapa.get(id);
      if(!anterior||String(registro.excluidaEm||'')>String(anterior.excluidaEm||'')){
        mapa.set(id,{id,excluidaEm:registro.excluidaEm||new Date().toISOString()});
      }
    });
    return [...mapa.values()];
  }

  function salvarExcluidas(lista){
    localStorage.setItem(DELETED_STORAGE,JSON.stringify(normalizarExcluidas(lista)));
  }

  function filtrarExcluidas(lista,excluidas){
    const ids=new Set(normalizarExcluidas(excluidas).map(item=>String(item.id)));
    return (Array.isArray(lista)?lista:[]).filter(venda=>!ids.has(idDaVenda(venda)));
  }

  function atualizarTelas(){
    try{if(typeof atualizarDashboard==='function')atualizarDashboard();}catch(_){}
    try{if(typeof carregarHistorico==='function')carregarHistorico();}catch(_){}
    try{if(typeof window.atualizarRelatorio==='function')window.atualizarRelatorio();}catch(_){}
  }

  function registrarIA(tipo,mensagem,contexto){
    try{
      if(window.SCPMonitor?.registrar)window.SCPMonitor.registrar(tipo,mensagem,contexto);
    }catch(_){}
  }

  async function salvarNuvem(vendasLimpas,excluidas){
    if(!window.firebase||!firebase.apps?.length)return;
    const user=firebase.auth().currentUser;
    if(!user)return;
    await firebase.firestore().collection('usuarios').doc(user.uid).set({
      vendas:vendasLimpas,
      vendasExcluidas:normalizarExcluidas(excluidas),
      atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }

  async function reconciliar(){
    if(reconciliando||!window.firebase||!firebase.apps?.length)return;
    const user=firebase.auth().currentUser;
    if(!user)return;
    reconciliando=true;
    try{
      const ref=firebase.firestore().collection('usuarios').doc(user.uid);
      const snap=await ref.get();
      const nuvem=snap.exists?snap.data():{};
      const excluidas=normalizarExcluidas([...lerExcluidas(),...(nuvem.vendasExcluidas||[])]);
      salvarExcluidas(excluidas);

      const locais=Array.isArray(window.vendas)?window.vendas:lerVendas();
      const mapa=new Map();
      [...(nuvem.vendas||[]),...locais].forEach(venda=>mapa.set(idDaVenda(venda),venda));
      const unificadas=filtrarExcluidas([...mapa.values()],excluidas);

      const haviaRetorno=[...mapa.values()].length!==unificadas.length;
      window.vendas=unificadas;
      localStorage.setItem(STORAGE,JSON.stringify(unificadas));
      await ref.set({
        vendas:unificadas,
        vendasExcluidas:excluidas,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      atualizarTelas();
      if(haviaRetorno)registrarIA('integridade-dados','Venda excluída tentou retornar durante a sincronização e foi bloqueada',{quantidadeBloqueada:[...mapa.values()].length-unificadas.length});
    }catch(erro){
      console.error('Erro ao proteger exclusões definitivas:',erro);
      registrarIA('sincronizacao-exclusao','Falha ao reconciliar vendas excluídas',{erro:String(erro?.message||erro)});
    }finally{
      reconciliando=false;
    }
  }

  function instalarExclusaoDefinitiva(){
    window.excluirVenda=async function(id){
      if(!confirm('Excluir esta venda definitivamente?'))return;
      const idTexto=String(id);
      const excluidas=normalizarExcluidas([...lerExcluidas(),{id:idTexto,excluidaEm:new Date().toISOString()}]);
      salvarExcluidas(excluidas);

      const atuais=Array.isArray(window.vendas)?window.vendas:lerVendas();
      const limpas=atuais.filter(venda=>idDaVenda(venda)!==idTexto);
      window.vendas=limpas;
      localStorage.setItem(STORAGE,JSON.stringify(limpas));
      atualizarTelas();

      try{
        await salvarNuvem(limpas,excluidas);
        registrarIA('exclusao-definitiva','Venda excluída definitivamente e sincronizada',{vendaId:idTexto});
      }catch(erro){
        console.error('Venda excluída localmente, mas a nuvem será atualizada quando a conexão voltar:',erro);
        registrarIA('sincronizacao-exclusao','Exclusão salva localmente e pendente de sincronização',{vendaId:idTexto,erro:String(erro?.message||erro)});
      }
    };
  }

  function iniciar(){
    instalarExclusaoDefinitiva();
    if(window.firebase&&firebase.apps?.length){
      firebase.auth().onAuthStateChanged(user=>{
        if(!user)return;
        setTimeout(reconciliar,700);
        setTimeout(reconciliar,2500);
      });
    }
    window.addEventListener('online',reconciliar);
    window.addEventListener('focus',()=>setTimeout(reconciliar,300));
    setInterval(reconciliar,5*60*1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

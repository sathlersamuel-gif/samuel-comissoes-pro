(function(){
  'use strict';

  const LOCAL_ACTIVE='scp_guardian_active_cache';
  let instalado=false;

  function instalar(){
    if(instalado||!window.firebase||!firebase.apps?.length)return false;
    let db;
    try{db=firebase.firestore();}catch(_){return false;}
    if(!db||db.__scpGuardianBridge)return false;

    const collectionOriginal=db.collection.bind(db);
    db.collection=function(nome){
      const collection=collectionOriginal(nome);
      if(nome!=='configuracoes')return collection;

      const docOriginal=collection.doc.bind(collection);
      collection.doc=function(id){
        const doc=docOriginal(id);
        if(id!=='ia_guardia')return doc;

        const setOriginal=doc.set.bind(doc);
        doc.set=function(data,options){
          if(data&&Object.prototype.hasOwnProperty.call(data,'ativa')){
            localStorage.setItem(LOCAL_ACTIVE,data.ativa?'1':'0');
          }
          return setOriginal(data,options).catch(error=>{
            console.warn('IA Guardiã: configuração salva no aparelho e aguardando sincronização.',error);
            return undefined;
          });
        };
        return doc;
      };
      return collection;
    };

    db.__scpGuardianBridge=true;
    instalado=true;
    return true;
  }

  if(!instalar()){
    const timer=setInterval(()=>{if(instalar())clearInterval(timer);},200);
    setTimeout(()=>clearInterval(timer),20000);
  }
})();

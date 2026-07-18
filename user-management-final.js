(function(){
  'use strict';
  const ADMIN='sathlersamuel@gmail.com';
  const VERSION='2026.07.18.4';
  window.__SCP_USER_MANAGEMENT_CORE__=VERSION;
  let auth,db,busy=false,last=0;

  function start(){
    if(!window.firebase||!firebase.apps||!firebase.apps.length)return setTimeout(start,150);
    auth=firebase.auth();db=firebase.firestore();
    protectDeletedAccount();
    filterDeleted();
  }

  function isAdmin(){return String(auth?.currentUser?.email||'').toLowerCase()===ADMIN;}
  function deleteButton(target){return target?.closest?.('#listaUsuarios [data-acao="excluir"][data-uid],#listaUsuarios .btn-excluir-novo[data-uid]')||null;}

  async function removeUser(button){
    if(busy||Date.now()-last<700)return;last=Date.now();
    const uid=String(button.dataset.uid||'').trim();
    const email=String(button.dataset.email||'este usuário').trim().toLowerCase();
    if(!uid)return alert('Não foi possível identificar este usuário.');
    if(!isAdmin())return alert('Somente o administrador pode excluir usuários.');
    if(!confirm(`Tem certeza que deseja excluir ${email}?\n\nO usuário será removido definitivamente da lista e não poderá retornar ao acessar novamente.`))return;
    busy=true;const old=button.textContent;button.disabled=true;button.textContent='Excluindo...';
    try{
      const ref=db.collection('usuarios').doc(uid);
      const snap=await ref.get();
      const data=snap.exists?snap.data():{};
      await ref.set({
        uid,
        email:String(data.email||email||'').trim().toLowerCase(),
        status:'excluido',
        vendas:[],
        vendasExcluidas:[],
        totalAcessos:0,
        ultimoAcesso:firebase.firestore.FieldValue.delete(),
        ultimoDispositivo:firebase.firestore.FieldValue.delete(),
        expiraEm:firebase.firestore.FieldValue.delete(),
        acessoIniciadoEm:firebase.firestore.FieldValue.delete(),
        periodoQuantidade:firebase.firestore.FieldValue.delete(),
        periodoUnidade:firebase.firestore.FieldValue.delete(),
        excluidoEm:firebase.firestore.FieldValue.serverTimestamp(),
        excluidoPor:ADMIN,
        atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      const check=await ref.get();
      if(!check.exists||check.data().status!=='excluido')throw new Error('O Firebase não confirmou a exclusão.');
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{if(String(el.dataset.uid)===uid)el.closest('article,.usuario-card')?.remove();});
      alert('Usuário excluído definitivamente.');
      setTimeout(filterDeleted,50);
    }catch(error){console.error('[Gestão final]',error);alert(`Não foi possível excluir o usuário. ${error.message||''}`.trim());}
    finally{busy=false;if(document.body.contains(button)){button.disabled=false;button.textContent=old;}const panel=document.getElementById('painelUsuarios');if(panel)panel.style.display='block';}
  }

  function intercept(event){
    const button=deleteButton(event.target);if(!button)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();removeUser(button);
  }
  document.addEventListener('pointerup',intercept,true);
  document.addEventListener('click',intercept,true);
  document.addEventListener('touchend',intercept,{capture:true,passive:false});

  async function filterDeleted(){
    if(!db||!isAdmin())return;
    try{
      const snap=await db.collection('usuarios').where('status','==','excluido').get();
      const ids=new Set(snap.docs.map(d=>d.id));
      document.querySelectorAll('#listaUsuarios [data-uid]').forEach(el=>{if(ids.has(String(el.dataset.uid)))el.closest('article,.usuario-card')?.remove();});
    }catch(error){console.error('[Gestão final] Falha ao filtrar excluídos',error);}
  }

  new MutationObserver(()=>setTimeout(filterDeleted,20)).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#adminUsuariosBtn')){setTimeout(filterDeleted,100);setTimeout(filterDeleted,700);}},true);

  function protectDeletedAccount(){
    auth.onAuthStateChanged(async user=>{
      if(!user||String(user.email||'').toLowerCase()===ADMIN)return;
      try{
        const snap=await db.collection('usuarios').doc(user.uid).get();
        if(!snap.exists||snap.data().status!=='excluido')return;
        const overlay=document.getElementById('firebaseAuthOverlay');
        const text=document.getElementById('authTexto');
        const message=document.getElementById('authMensagem');
        const bar=document.getElementById('firebaseUserBar');
        if(text)text.textContent='Esta conta foi excluída pelo administrador.';
        if(message){message.textContent='Acesso removido permanentemente.';message.style.color='#b00020';}
        if(overlay)overlay.style.display='flex';if(bar)bar.style.display='none';
        setTimeout(()=>auth.signOut().catch(()=>{}),400);
      }catch(error){console.error('[Gestão final] Falha ao proteger conta excluída',error);}
    });
  }

  start();
})();
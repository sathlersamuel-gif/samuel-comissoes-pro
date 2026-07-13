(function(){
  function aplicar(){
    if(!document.getElementById('adminNavFixStyle')){
      const s=document.createElement('style');
      s.id='adminNavFixStyle';
      s.textContent=`
        #painelUsuarios{
          padding-top:calc(env(safe-area-inset-top, 0px) + 34px)!important;
          overscroll-behavior:contain;
        }
        #painelUsuarios .painel-conteudo{
          padding-top:10px!important;
        }
        #painelUsuarios .painel-topo{
          position:relative!important;
          z-index:10002!important;
          min-height:56px!important;
          align-items:center!important;
          margin-bottom:22px!important;
        }
        #painelUsuarios #fecharPainelUsuarios{
          position:relative!important;
          top:auto!important;
          left:auto!important;
          width:auto!important;
          min-width:118px!important;
          height:52px!important;
          padding:0 18px!important;
          margin:0!important;
          border-radius:14px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          font-size:18px!important;
          line-height:1!important;
          touch-action:manipulation!important;
          -webkit-tap-highlight-color:transparent!important;
          pointer-events:auto!important;
        }
        #painelUsuarios .painel-topo h2{
          margin:0!important;
          line-height:1.2!important;
        }
      `;
      document.head.appendChild(s);
    }

    const painel=document.getElementById('painelUsuarios');
    const botao=document.getElementById('fecharPainelUsuarios');
    if(!painel||!botao) return;

    const fechar=function(ev){
      if(ev){ev.preventDefault();ev.stopPropagation();}
      painel.style.setProperty('display','none','important');
    };

    botao.onclick=fechar;
    if(botao.dataset.navFix!=='1'){
      botao.addEventListener('touchend',fechar,{passive:false});
      botao.addEventListener('pointerup',fechar);
      botao.dataset.navFix='1';
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',aplicar);
  else aplicar();

  new MutationObserver(aplicar).observe(document.documentElement,{childList:true,subtree:true});
})();

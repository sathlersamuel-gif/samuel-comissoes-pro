(function(){
  'use strict';

  function addStyles(){
    if(document.getElementById('guardianActionsOrganizerStyle'))return;
    const style=document.createElement('style');
    style.id='guardianActionsOrganizerStyle';
    style.textContent=`
      #iaGuardia .guardia-acoes.guardian-organized{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      #iaGuardia .guardia-acoes.guardian-organized>button{width:100%;min-height:52px;margin:0}
      #iaGuardia .guardian-more{grid-column:1/-1;border:1px solid rgba(255,255,255,.2);border-radius:14px;background:rgba(255,255,255,.08);overflow:hidden}
      #iaGuardia .guardian-more summary{cursor:pointer;list-style:none;padding:14px 16px;color:#fff;font-weight:800;text-align:center}
      #iaGuardia .guardian-more summary::-webkit-details-marker{display:none}
      #iaGuardia .guardian-more summary:after{content:'⌄';margin-left:8px}
      #iaGuardia .guardian-more[open] summary:after{content:'⌃'}
      #iaGuardia .guardian-more-content{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 12px 12px}
      #iaGuardia .guardian-more-content button{width:100%;min-height:46px;margin:0;border-radius:12px;padding:10px 12px;font-weight:800}
      @media(max-width:620px){
        #iaGuardia .guardia-acoes.guardian-organized{grid-template-columns:1fr}
        #iaGuardia .guardian-more{grid-column:1}
        #iaGuardia .guardian-more-content{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function organize(){
    const host=document.querySelector('#iaGuardia .guardia-acoes');
    const audit=document.getElementById('guardianFullAudit');
    const repair=document.getElementById('guardianAutoFix');
    if(!host||!audit||!repair||host.classList.contains('guardian-organized'))return false;

    addStyles();
    host.classList.add('guardian-organized');

    audit.textContent='Verificar aplicativo';
    repair.textContent='Ver falhas e autorizar correção';

    const more=document.createElement('details');
    more.className='guardian-more';
    more.innerHTML='<summary>Mais opções</summary><div class="guardian-more-content"></div>';
    const content=more.querySelector('.guardian-more-content');

    const advancedIds=['guardiaDiagnostico','guardiaNome','guardiaAtualizar','guardianRequestFix','guardianCopyReport'];
    advancedIds.forEach(id=>{
      const button=document.getElementById(id);
      if(button)content.appendChild(button);
    });

    host.insertBefore(audit,host.firstChild);
    host.insertBefore(repair,audit.nextSibling);
    host.appendChild(more);
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(organize()||attempts>=80)clearInterval(timer);
  },250);
  organize();
})();
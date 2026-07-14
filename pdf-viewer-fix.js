(function(){
  const abrirOriginal=window.open.bind(window);

  function fecharVisualizador(){
    const visualizador=document.getElementById('visualizadorPdfApp');
    if(!visualizador) return;
    const iframe=visualizador.querySelector('iframe');
    const url=iframe?.dataset?.blobUrl;
    visualizador.remove();
    document.body.style.overflow='';
    if(url) setTimeout(function(){URL.revokeObjectURL(url);},500);
  }

  function abrirNoApp(url){
    fecharVisualizador();

    const visualizador=document.createElement('div');
    visualizador.id='visualizadorPdfApp';
    visualizador.innerHTML=`
      <div class="pdf-app-topo">
        <button type="button" id="voltarPdfApp">← Voltar às vendas</button>
        <strong>Relatório em PDF</strong>
      </div>
      <iframe title="Relatório em PDF" data-blob-url="${url}"></iframe>
    `;

    const estilo=document.createElement('style');
    estilo.textContent=`
      #visualizadorPdfApp{position:fixed;inset:0;z-index:50000;background:#061326;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
      #visualizadorPdfApp .pdf-app-topo{height:58px;flex:0 0 58px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:12px;padding:8px 12px;background:#081a31;border-bottom:1px solid #1b3b63;color:#fff}
      #visualizadorPdfApp .pdf-app-topo button{border:1px solid #2a5b91;background:#0d2a4c;color:#fff;border-radius:12px;padding:10px 13px;font-weight:800;font-size:14px}
      #visualizadorPdfApp .pdf-app-topo strong{text-align:center;padding-right:105px;font-size:15px}
      #visualizadorPdfApp iframe{width:100%;height:100%;border:0;background:#fff;flex:1}
      @media(max-width:430px){#visualizadorPdfApp .pdf-app-topo strong{padding-right:0;text-align:left;font-size:13px}}
    `;
    visualizador.appendChild(estilo);
    document.body.appendChild(visualizador);
    document.body.style.overflow='hidden';

    const iframe=visualizador.querySelector('iframe');
    iframe.src=url;
    visualizador.querySelector('#voltarPdfApp').addEventListener('click',fecharVisualizador);
    return {close:fecharVisualizador,closed:false,focus:function(){}};
  }

  window.open=function(url,alvo,recursos){
    if(typeof url==='string'&&url.startsWith('blob:')){
      return abrirNoApp(url);
    }
    return abrirOriginal(url,alvo,recursos);
  };
})();
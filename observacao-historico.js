(function(){
  function dataLocal(texto){
    const partes=String(texto||'').split('-').map(Number);
    if(partes.length!==3||partes.some(Number.isNaN)) return null;
    return new Date(partes[0],partes[1]-1,partes[2]);
  }

  function escapar(texto){
    return String(texto||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function obterVendas(){
    try{
      const dados=JSON.parse(localStorage.getItem('samuel_comissoes_pro')||'[]');
      return Array.isArray(dados)?dados:[];
    }catch(erro){
      console.error('Erro ao carregar observações:',erro);
      return [];
    }
  }

  function aplicarObservacoes(ano,mes){
    const conteudo=document.getElementById('listaVendasMes');
    if(!conteudo) return;

    const lista=obterVendas()
      .filter(function(venda){
        const data=dataLocal(venda.data);
        return data&&data.getFullYear()===Number(ano)&&data.getMonth()===Number(mes);
      })
      .sort(function(a,b){return String(a.data||'').localeCompare(String(b.data||''));});

    const cards=conteudo.querySelectorAll('.card');
    cards.forEach(function(card,indice){
      const anterior=card.querySelector('.observacao-destaque');
      if(anterior) anterior.remove();
      const venda=lista[indice];
      const observacao=String(venda&&venda.observacao||'').trim();
      if(!observacao) return;

      const bloco=document.createElement('div');
      bloco.className='observacao-destaque';
      bloco.innerHTML='<strong>📝 Observação</strong><span>'+escapar(observacao)+'</span>';
      const acoes=card.querySelector("div[style*='display:flex']");
      card.insertBefore(bloco,acoes||null);
    });
  }

  function instalar(){
    if(typeof window.abrirMesAno!=='function'){
      setTimeout(instalar,80);
      return;
    }

    if(window.abrirMesAno.__observacaoInstalada) return;
    const original=window.abrirMesAno;
    const nova=function(ano,mes){
      original.call(this,ano,mes);
      setTimeout(function(){aplicarObservacoes(ano,mes);},20);
    };
    nova.__observacaoInstalada=true;
    window.abrirMesAno=nova;

    if(!document.getElementById('estiloObservacaoHistorico')){
      const estilo=document.createElement('style');
      estilo.id='estiloObservacaoHistorico';
      estilo.textContent='.observacao-destaque{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,193,7,.10);border:1px solid rgba(255,193,7,.35);color:#fff}.observacao-destaque strong{display:block;font-size:12px;color:#ffd66b;margin-bottom:4px}.observacao-destaque span{display:block;font-size:13px;line-height:1.35;color:#e8eef8;white-space:pre-wrap;overflow-wrap:anywhere}';
      document.head.appendChild(estilo);
    }
  }

  document.addEventListener('DOMContentLoaded',instalar);
})();
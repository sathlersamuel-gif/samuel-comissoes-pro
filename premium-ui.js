(function(){
  const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const moeda=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const dataLocal=t=>{const p=String(t||"").split("-").map(Number);return p.length===3?new Date(p[0],p[1]-1,p[2]):null};
  const esc=t=>String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  function icone(produto){
    const p=String(produto||"").toLowerCase();
    if(p.includes("motor de popa")) return "⚙️";
    if(p.includes("barco")) return "🚤";
    if(p.includes("reboque")) return "🛻";
    if(p.includes("carta")||p.includes("consórcio")) return "📄";
    return "🏍️";
  }
  window.abrirMesAno=function(ano,mes){
    const listaMeses=document.getElementById("listaMeses");
    const detalhes=document.getElementById("detalhesMes");
    const titulo=document.getElementById("tituloMes");
    const conteudo=document.getElementById("listaVendasMes");
    if(!detalhes||!conteudo)return;
    const lista=(window.vendas||vendas||[]).filter(v=>{const d=dataLocal(v.data);return d&&d.getFullYear()===Number(ano)&&d.getMonth()===Number(mes)}).sort((a,b)=>String(b.data).localeCompare(String(a.data)));
    if(titulo)titulo.textContent=`${MESES[mes]} de ${ano}`;
    const totalVendido=lista.reduce((s,v)=>s+Number(v.valor||0),0);
    const totalComissao=lista.reduce((s,v)=>s+Number(v.comissao||0),0);
    conteudo.innerHTML=`<div class="resumo-mes"><strong>Total vendido: ${moeda(totalVendido)}</strong><br><span style="color:#20df82">Comissão: ${moeda(totalComissao)}</span></div>${lista.map(v=>{
      const produto=v.produto||v.modelo||"Produto";
      const tipo=v.tipo||v.tipoVenda||"";
      const data=dataLocal(v.data)?.toLocaleDateString("pt-BR")||"";
      return `<div class="venda-card"><div class="produto-thumb">${icone(produto)}</div><div><div class="venda-topo"><strong>${esc(v.cliente)}</strong><span class="venda-valor">${moeda(v.valor)}</span></div><div class="venda-modelo">${esc(produto)}</div><span class="tag-negociacao">${esc(tipo)}</span><div class="venda-meta"><span>${data}</span><span>Comissão: ${moeda(v.comissao)}</span></div></div><div class="venda-acoes"><button type="button" onclick="editarVendaSegura(${Number(v.id)})">✏️ Editar</button><button type="button" onclick="excluirVendaSegura(${Number(v.id)},${ano},${mes})">🗑️ Excluir</button></div></div>`;
    }).join("")}`;
    if(listaMeses)listaMeses.style.display="none";
    detalhes.style.display="block";
  };
})();
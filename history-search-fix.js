(function(){
  'use strict';

  const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function normalizar(valor){
    return String(valor||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .trim();
  }

  function escapar(valor){
    return String(valor||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function moeda(valor){
    return Number(valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function dataLocal(texto){
    const p=String(texto||'').split('-').map(Number);
    if(p.length!==3||p.some(Number.isNaN))return null;
    return new Date(p[0],p[1]-1,p[2]);
  }

  function instalarEstilo(){
    if(document.getElementById('historySearchFixStyle'))return;
    const style=document.createElement('style');
    style.id='historySearchFixStyle';
    style.textContent=`
      #listaMeses.resultados-pesquisa{display:flex!important;flex-direction:column;gap:11px}
      .resultado-historico{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 12px;align-items:start;background:linear-gradient(145deg,#0d223d,#08182c);border:1px solid #183757;border-radius:17px;padding:14px;color:#fff;overflow:hidden}
      .resultado-historico-info{min-width:0}
      .resultado-historico-info strong{display:block;font-size:16px;overflow-wrap:anywhere}
      .resultado-historico-info p{margin:5px 0 0;color:#b7c6da;font-size:13px;overflow-wrap:anywhere}
      .resultado-historico-info small{display:block;margin-top:7px;color:#8fa3bd;font-size:11px}
      .resultado-historico-valor{max-width:44vw;color:#20df82;font-weight:900;white-space:nowrap;text-align:right;font-size:clamp(12px,3.5vw,16px)}
      .resultado-historico-acoes{grid-column:1/-1;display:flex;gap:8px}
      .resultado-historico-acoes button{flex:1;border:0;border-radius:10px;padding:10px;color:#fff;background:#15365c}
      .resultado-historico-acoes button:last-child{background:#5a1c29}
      .historico-sem-resultado{padding:20px;text-align:center;color:#9fb0c8;border:1px dashed #26496f;border-radius:15px}
    `;
    document.head.appendChild(style);
  }

  function pesquisar(){
    const campo=document.getElementById('pesquisaHistorico');
    const lista=document.getElementById('listaMeses');
    const detalhes=document.getElementById('detalhesMes');
    if(!campo||!lista)return;

    const termo=normalizar(campo.value);
    if(!termo){
      lista.classList.remove('resultados-pesquisa');
      if(detalhes)detalhes.style.display='none';
      lista.style.display='';
      if(typeof carregarHistorico==='function')carregarHistorico();
      return;
    }

    if(detalhes)detalhes.style.display='none';
    lista.style.display='flex';
    lista.classList.add('resultados-pesquisa');

    const encontrados=(Array.isArray(vendas)?vendas:[]).filter(venda=>{
      const texto=[venda.cliente,venda.produto,venda.modelo,venda.telefone,venda.tipo,venda.tipoVenda,venda.observacao].map(normalizar).join(' ');
      return texto.includes(termo);
    }).sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));

    if(!encontrados.length){
      lista.innerHTML='<div class="historico-sem-resultado">Nenhuma venda encontrada.</div>';
      return;
    }

    lista.innerHTML=encontrados.map(venda=>{
      const data=dataLocal(venda.data);
      const ano=data?data.getFullYear():new Date().getFullYear();
      const mes=data?data.getMonth():new Date().getMonth();
      return `<div class="resultado-historico">
        <div class="resultado-historico-info">
          <strong>${escapar(venda.cliente)}</strong>
          <p>${escapar(venda.produto||venda.modelo)}</p>
          <small>${escapar(venda.telefone||'')} ${data?'• '+data.toLocaleDateString('pt-BR'):''}</small>
        </div>
        <div class="resultado-historico-valor">${moeda(venda.valor)}</div>
        <div class="resultado-historico-acoes">
          <button type="button" onclick="editarVendaSegura(${Number(venda.id)})">✏️ Editar</button>
          <button type="button" onclick="excluirVendaSegura(${Number(venda.id)},${ano},${mes});setTimeout(()=>document.getElementById('pesquisaHistorico')?.dispatchEvent(new Event('input')),0)">🗑️ Excluir</button>
        </div>
      </div>`;
    }).join('');
  }

  function instalar(){
    instalarEstilo();
    const campo=document.getElementById('pesquisaHistorico');
    if(!campo)return setTimeout(instalar,80);
    if(campo.dataset.buscaAtiva==='1')return;
    campo.dataset.buscaAtiva='1';
    campo.addEventListener('input',pesquisar);
    campo.addEventListener('search',pesquisar);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);
  else instalar();
})();

(function(){
'use strict';
const STORAGE='samuel_comissoes_pro';
const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const normalizar=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const vendas=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'[]')}catch(e){return[]}};
const dataVenda=v=>{const p=String(v.data||v.dataVenda||'').slice(0,10).split('-').map(Number);return p.length===3&&p.every(Number.isFinite)?new Date(p[0],p[1]-1,p[2]):null};
const valor=v=>Number(v.valor??v.valorVenda??0)||0;
const comissao=v=>Number(v.comissao??v.valorComissao??0)||0;
const tipo=v=>normalizar(v.tipo||v.tipoVenda||v.tipoNegociacao);
let modo='linha';

function dados(periodo){
 const n=new Date(),meses=[];
 for(let i=periodo-1;i>=0;i--){
  const d=new Date(n.getFullYear(),n.getMonth()-i,1);
  const lista=vendas().filter(v=>{const dv=dataVenda(v);return dv&&dv.getFullYear()===d.getFullYear()&&dv.getMonth()===d.getMonth()});
  meses.push({rotulo:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),mes:d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),qtd:lista.length,total:lista.reduce((s,v)=>s+valor(v),0),comissao:lista.reduce((s,v)=>s+comissao(v),0),lista});
 }
 return meses;
}
function resumoTipos(lista){
 const nomes=[['financiamento','Financiamento'],['consorcio','Consórcio'],['a vista','À vista'],['cartao','Cartão']];
 return nomes.map(([chave,nome])=>{const l=lista.filter(v=>tipo(v)===chave||tipo(v).startsWith(chave));return{nome,qtd:l.length}});
}
function grafico(meses){
 const max=Math.max(1,...meses.map(m=>m.qtd));
 const largura=320,altura=180,base=145,topo=24,esq=24,dir=300;
 const passo=meses.length>1?(dir-esq)/(meses.length-1):0;
 const pontos=meses.map((m,i)=>({x:esq+i*passo,y:base-(m.qtd/max)*(base-topo),...m}));
 const linha=pontos.map(p=>p.x+','+p.y).join(' ');
 const area=`${esq},${base} ${linha} ${dir},${base}`;
 const grades=[24,64,104,145].map(y=>`<line x1="${esq}" y1="${y}" x2="${dir}" y2="${y}" class="avc-grade"/>`).join('');
 const labels=pontos.map((p,i)=>`<text x="${p.x}" y="166" class="avc-eixo">${p.rotulo}</text>`).join('');
 const defs='<defs><linearGradient id="avcArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#208cff" stop-opacity=".62"/><stop offset="1" stop-color="#208cff" stop-opacity="0"/></linearGradient><linearGradient id="avcBarra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39a5ff"/><stop offset="1" stop-color="#0d4ca0"/></linearGradient></defs>';
 let marcas='';
 if(modo==='barras'){
  const bw=Math.max(8,Math.min(18,220/meses.length));
  marcas=pontos.map((p,i)=>`<rect class="avc-barra avc-interativo" data-i="${i}" x="${p.x-bw/2}" y="${p.y}" width="${bw}" height="${base-p.y}" rx="4" style="animation-delay:${i*.06}s"/><text x="${p.x}" y="${p.y-7}" class="avc-num">${p.qtd}</text>`).join('');
 }else{
  marcas=(modo==='area'?`<polygon points="${area}" class="avc-area"/>`:'')+`<polyline points="${linha}" class="avc-linha"/>`+pontos.map((p,i)=>`<circle class="avc-ponto avc-interativo" data-i="${i}" cx="${p.x}" cy="${p.y}" r="5" style="animation-delay:${.25+i*.08}s"/><text x="${p.x}" y="${p.y-10}" class="avc-num">${p.qtd}</text>`).join('');
 }
 return `<svg viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Evolução mensal das vendas">${defs}${grades}${marcas}${labels}</svg>`;
}
function criar(){
 let tela=document.getElementById('analiseVendasCompleta');
 if(!tela){tela=document.createElement('section');tela.id='analiseVendasCompleta';tela.hidden=true;document.body.appendChild(tela)}
 return tela;
}
function ajustarFaturamento(tela){
 const valorFaturamento=tela.querySelector('.avc-faturamento strong');
 if(!valorFaturamento)return;
 Object.assign(valorFaturamento.style,{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',whiteSpace:'nowrap',overflow:'visible',overflowWrap:'normal',wordBreak:'normal',textOverflow:'clip',textAlign:'center',fontSize:'30px'});
 const ajustar=()=>{
  const larguraDisponivel=valorFaturamento.parentElement.clientWidth-26;
  let tamanho=30;
  valorFaturamento.style.fontSize=tamanho+'px';
  while(valorFaturamento.scrollWidth>larguraDisponivel&&tamanho>8){tamanho-=.5;valorFaturamento.style.fontSize=tamanho+'px'}
 };
 requestAnimationFrame(ajustar);
}
function render(periodo=12){
 const tela=criar(),meses=dados(periodo),todos=meses.flatMap(m=>m.lista),total=todos.reduce((s,v)=>s+valor(v),0),com=todos.reduce((s,v)=>s+comissao(v),0),media=todos.length/periodo;
 const melhor=meses.reduce((a,b)=>b.qtd>a.qtd?b:a,meses[0]);
 const anterior=meses[meses.length-2]?.qtd||0,atual=meses[meses.length-1]?.qtd||0,crescimento=anterior?Math.round((atual-anterior)/anterior*100):(atual?100:0);
 const tipos=resumoTipos(todos),maxTipo=Math.max(1,...tipos.map(t=>t.qtd));
 tela.innerHTML=`<div class="avc-cabecalho"><button type="button" class="avc-voltar" aria-label="Voltar">←</button><div><h1>📈 Evolução de vendas</h1><p>Análise completa do desempenho</p></div><select class="avc-periodo" aria-label="Período"><option value="6" ${periodo===6?'selected':''}>6 meses</option><option value="12" ${periodo===12?'selected':''}>12 meses</option></select></div><div class="avc-metricas"><article class="avc-metrica"><small>TOTAL DE VENDAS</small><strong>${todos.length}</strong><span>vendas realizadas</span></article><article class="avc-metrica"><small>MÉDIA / MÊS</small><strong>${media.toFixed(1).replace('.',',')}</strong><span>vendas por mês</span></article><article class="avc-metrica"><small>MELHOR MÊS</small><strong>${melhor?.mes?.split(' de ')[0]||'—'}</strong><span>${melhor?.qtd||0} vendas</span></article><article class="avc-metrica avc-faturamento"><small>FATURAMENTO</small><strong>${moeda(total)}</strong><span>Comissão: ${moeda(com)}</span></article></div><section class="avc-bloco"><div class="avc-titulo"><h2>EVOLUÇÃO MENSAL</h2><div class="avc-alternadores"><button type="button" data-modo="linha" class="${modo==='linha'?'ativo':''}">Linha</button><button type="button" data-modo="area" class="${modo==='area'?'ativo':''}">Área</button><button type="button" data-modo="barras" class="${modo==='barras'?'ativo':''}">Barras</button></div></div><div class="avc-grafico">${grafico(meses)}<div class="avc-dica"></div></div><p class="avc-instrucao">Toque nos pontos do gráfico para ver os detalhes do mês.</p></section><section class="avc-bloco"><div class="avc-titulo"><h2>INSIGHTS</h2></div><div class="avc-insights"><article class="avc-insight"><span>🚀</span><div><b>${crescimento>=0?'Crescimento':'Atenção ao desempenho'}</b><p>O mês atual está ${Math.abs(crescimento)}% ${crescimento>=0?'acima':'abaixo'} do mês anterior.</p></div></article><article class="avc-insight"><span>🏆</span><div><b>Melhor desempenho</b><p>${melhor?.mes||'Sem dados'} foi o melhor período, com ${melhor?.qtd||0} vendas.</p></div></article><article class="avc-insight"><span>💡</span><div><b>Tendência</b><p>${crescimento>=0?'A evolução recente indica uma tendência positiva.':'Vale acompanhar os próximos meses e reforçar as oportunidades.'}</p></div></article></div></section><section class="avc-bloco"><div class="avc-titulo"><h2>TIPOS DE NEGOCIAÇÃO</h2></div><div class="avc-tipos">${tipos.map(t=>`<div class="avc-tipo"><label>${t.nome}</label><strong>${t.qtd}</strong><div class="avc-progresso"><i style="--percentual:${(t.qtd/maxTipo)*100}%"></i></div></div>`).join('')}</div></section>`;
 ajustarFaturamento(tela);
 tela.querySelector('.avc-voltar').onclick=fechar;
 tela.querySelector('.avc-periodo').onchange=e=>render(Number(e.target.value));
 tela.querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>{modo=b.dataset.modo;render(periodo)});
 const dica=tela.querySelector('.avc-dica'),graf=tela.querySelector('.avc-grafico');
 tela.querySelectorAll('.avc-interativo').forEach(el=>el.addEventListener('click',()=>{const m=meses[Number(el.dataset.i)];dica.innerHTML=`<strong>${m.mes}</strong>${m.qtd} vendas<br>${moeda(m.total)}<br>Comissão: ${moeda(m.comissao)}`;const r=el.getBoundingClientRect(),g=graf.getBoundingClientRect();dica.style.left=Math.max(5,Math.min(g.width-150,r.left-g.left-65))+'px';dica.style.top=Math.max(5,r.top-g.top-92)+'px';dica.style.display='block'}));
}
function abrir(){render(12);const tela=criar();tela.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>tela.scrollTop=0)}
function fechar(){const tela=criar();tela.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',e=>{const b=e.target.closest('.evolucao-v2 .secao-titulo button');if(!b)return;e.preventDefault();e.stopPropagation();abrir()},true);
window.abrirAnaliseVendas=abrir;
})();
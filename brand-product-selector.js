(function(){
'use strict';

const PRODUTOS={
  yamaha:[
    "Yamaha NEO'S Connected","Yamaha ZR Hybrid Connected","Yamaha Fluo ABS Hybrid Connected","Yamaha Aerox ABS Connected","Yamaha NMAX ABS Connected","Yamaha XMAX 300 Connected",
    "Yamaha Factor","Yamaha Factor DX","Yamaha Fazer FZ15 ABS Connected","Yamaha Fazer FZ25 Connected","Yamaha Crosser 150 S ABS","Yamaha Crosser 150 Z ABS","Yamaha Crosser Z ABS Wolverine","Yamaha Lander Connected","Yamaha Ténéré 700",
    "Yamaha R15 ABS","Yamaha R15 ABS 70th","Yamaha R3 ABS Connected","Yamaha R3 ABS 70th","Yamaha MT-03 Connected","Yamaha MT-07 Connected",
    "Yamaha TT-R 230","Yamaha PW50","Yamaha YZ65","Yamaha YZ85LW","Yamaha YZ125","Yamaha YZ250","Yamaha YZ250F","Yamaha YZ450F","Yamaha WR250F","Yamaha WR450F",
    "Motor de Popa Yamaha 4 HP 2T","Motor de Popa Yamaha 6 HP 4T","Motor de Popa Yamaha 15 HP 2T","Motor de Popa Yamaha 20 HP 4T","Motor de Popa Yamaha 25 HP 4T","Motor de Popa Yamaha 30 HP 2T","Motor de Popa Yamaha 40 HP 2T","Motor de Popa Yamaha 40 HP 4T","Motor de Popa Yamaha 60 HP 4T","Motor de Popa Yamaha 90 HP 4T","Motor de Popa Yamaha 115 HP 4T","Motor de Popa Yamaha 150 HP 4T CID","Motor de Popa Yamaha 200 HP 4T CID","Motor de Popa Yamaha 200 HP 4T SDI","Motor de Popa Yamaha 250 HP 4T","Motor de Popa Yamaha 300 HP 4T","Motor de Popa Yamaha 350 HP 4T SDI","Motor de Popa Yamaha 450 HP 4T SDI","Motor de Popa Yamaha VMAX 115 HP 4T","Motor de Popa Yamaha VMAX 150 HP 4T","Motor de Popa Yamaha VMAX 175 HP 4T","Motor de Popa Yamaha VMAX 200 HP 4T","Motor de Popa Yamaha VMAX 250 HP 4T","Motor de Popa Yamaha Comercial 200 HP 4T","Motor de Popa Yamaha Comercial 300 HP 4T",
    "Barco 6 m Fox Aquaforce","Reboque","Carta de Crédito Contemplada","Consórcio Yamaha","Outro Produto"
  ],
  honda:[
    "Honda CG 50 Anos","Honda CG 160 Start","Honda CG 160 Fan","Honda CG 160 Titan","Honda CG 160 Cargo",
    "Honda Pop 110i ES","Honda Biz 125 ES","Honda Biz 125 EX","Honda Biz 125",
    "Honda Elite 125","Honda PCX 160 CBS","Honda PCX 160 ABS","Honda PCX 160 DLX ABS","Honda PCX",
    "Honda ADV 160","Honda ADV","Honda X-ADV 750","Honda X-ADV",
    "Honda CB 300F Twister CBS","Honda CB 300F Twister ABS","Honda CB 300F Twister",
    "Honda CB 500 Hornet","Honda CB 650R E-Clutch","Honda CB 750 Hornet","Honda CB 1000R","Honda CB 1000R Black Edition",
    "Honda XR 300L Tornado","Honda XR 300L Tornado Special Edition","Honda Tornado Special Edition",
    "Honda NXR 160 Bros CBS","Honda NXR 160 Bros ABS","Honda NXR 160 Bros",
    "Honda XRE 300 Sahara Standard","Honda XRE 300 Sahara Rally","Honda XRE 300 Sahara Adventure","Honda XRE 300 Sahara",
    "Honda XRE 190 Standard","Honda XRE 190 Adventure","Honda XRE 190",
    "Honda NX 500","Honda NC 750X MT","Honda NC 750X DCT","Honda NC 750X",
    "Honda XL750 Transalp","Honda CRF1100L Africa Twin MT","Honda CRF1100L Africa Twin DCT","Honda CRF1100L Africa Twin Adventure Sports","Honda CRF1100L Africa Twin",
    "Honda CRF 300F","Honda CRF 250F","Honda CRF 250R","Honda CRF 250RX","Honda CRF 450R","Honda CRF 450RX","Honda Linha CRF 250","Honda Linha CRF 450",
    "Honda TRX 420FM FourTrax 4x4","Honda TRX 420FM 4x4",
    "Honda CBR 1000RR-R Fireblade SP","Honda GL 1800 Gold Wing Tour",
    "Carta de Crédito Contemplada","Outro Produto"
  ]
};

function normalizar(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

function iniciar(){
  const telefone=document.getElementById('telefone');
  const produto=document.getElementById('produto');
  const form=document.getElementById('formVenda');
  if(!telefone||!produto||!form||document.getElementById('seletorMarcaMoto'))return;

  let marca=localStorage.getItem('scp_marca_produto')||'yamaha';
  if(!PRODUTOS[marca])marca='yamaha';

  const seletor=document.createElement('div');
  seletor.id='seletorMarcaMoto';
  seletor.innerHTML='<span class="marca-titulo">Selecione a Marca da Moto</span><div class="marca-opcoes"><button type="button" class="marca-opcao" data-marca="yamaha"><span>YAMAHA</span><span class="marca-check"></span></button><button type="button" class="marca-opcao" data-marca="honda"><span>HONDA</span><span class="marca-check"></span></button></div>';
  telefone.insertAdjacentElement('afterend',seletor);

  const wrapper=document.createElement('div');
  wrapper.id='produtoMarcaWrapper';
  produto.parentNode.insertBefore(wrapper,produto);
  wrapper.appendChild(produto);
  const sugestoes=document.createElement('div');
  sugestoes.id='sugestoesProdutoMarca';
  wrapper.appendChild(sugestoes);

  produto.removeAttribute('list');
  produto.setAttribute('autocomplete','off');

  function atualizarBotoes(){
    seletor.querySelectorAll('.marca-opcao').forEach(btn=>{
      const ativa=btn.dataset.marca===marca;
      btn.classList.toggle('ativa',ativa);
      btn.setAttribute('aria-pressed',String(ativa));
      btn.querySelector('.marca-check').textContent=ativa?'✓':'';
    });
    produto.placeholder=`Pesquise ou digite o Produto/Modelo ${marca==='honda'?'Honda':'Yamaha'}`;
  }

  function listaFiltrada(){
    const termo=normalizar(produto.value.trim());
    const base=PRODUTOS[marca]||[];
    if(!termo)return base.slice(0,18);
    return base.filter(item=>normalizar(item).includes(termo)).slice(0,30);
  }

  function renderizar(){
    const itens=listaFiltrada();
    sugestoes.innerHTML='';
    if(!itens.length){
      sugestoes.innerHTML='<div class="sem-resultado">Modelo não encontrado. Você pode continuar digitando e salvar manualmente.</div>';
    }else{
      itens.forEach(item=>{
        const botao=document.createElement('button');
        botao.type='button';
        botao.textContent=item;
        botao.onclick=()=>{produto.value=item;sugestoes.classList.remove('aberto');produto.dispatchEvent(new Event('change',{bubbles:true}));};
        sugestoes.appendChild(botao);
      });
    }
    sugestoes.classList.add('aberto');
  }

  seletor.addEventListener('click',evento=>{
    const botao=evento.target.closest('.marca-opcao');
    if(!botao)return;
    marca=botao.dataset.marca;
    localStorage.setItem('scp_marca_produto',marca);
    produto.value='';
    atualizarBotoes();
    produto.focus();
    renderizar();
  });

  produto.addEventListener('focus',renderizar);
  produto.addEventListener('input',renderizar);
  produto.addEventListener('keydown',evento=>{if(evento.key==='Escape')sugestoes.classList.remove('aberto');});
  document.addEventListener('pointerdown',evento=>{if(!wrapper.contains(evento.target)&&!seletor.contains(evento.target))sugestoes.classList.remove('aberto');});

  form.addEventListener('submit',()=>{
    try{sessionStorage.setItem('scp_ultima_marca_venda',marca);}catch(_){ }
  },true);

  atualizarBotoes();
  window.SCPProdutosPorMarca={produtos:PRODUTOS,getMarca:()=>marca};
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
// ===============================
// Samuel Comissões PRO v2
// app.js - Parte 1
// ===============================

const STORAGE_KEY = "samuel_comissoes_pro";

let vendas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ---------- Navegação ----------

function abrirTela(id) {

    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.remove("ativa");
    });

    document.getElementById(id).classList.add("ativa");

    if (id === "dashboard") atualizarDashboard();

    if (id === "historico") carregarHistorico();
}

function voltarDashboard() {
    abrirTela("dashboard");
}

// ---------- Formatação ----------

const campoValor = document.getElementById("valorVenda");
const campoPorcentagem = document.getElementById("porcentagem");
const campoComissao = document.getElementById("comissao");

if (campoValor) {

    campoValor.addEventListener("input", formatarValor);

}

if (campoPorcentagem) {

    campoPorcentagem.addEventListener("input", calcularComissao);

}

function formatarValor(e) {

    let valor = e.target.value.replace(/\D/g, "");

    valor = (Number(valor) / 100).toFixed(2);

    valor = valor.replace(".", ",");

    valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    e.target.value = valor;

    calcularComissao();
}

function valorNumerico(texto) {

    if (!texto) return 0;

    return Number(
        texto
            .replace(/\./g, "")
            .replace(",", ".")
    );

}

function calcularComissao() {

    const valor = valorNumerico(campoValor.value);

    const porcentagem = Number(campoPorcentagem.value) || 0;

    const comissao = valor * (porcentagem / 100);

    campoComissao.value =
        comissao.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}

// ---------- Cadastro ----------

const formulario = document.getElementById("formVenda");

if (formulario) {

    formulario.addEventListener("submit", salvarVenda);

}

function salvarVenda(e) {

    e.preventDefault();

    const venda = {

        id: Date.now(),

        cliente: document.getElementById("cliente").value,

        telefone: document.getElementById("telefone").value,

        produto: document.getElementById("produto").value,

        tipo: document.getElementById("tipoVenda").value,

        valor: valorNumerico(document.getElementById("valorVenda").value),

        porcentagem: Number(document.getElementById("porcentagem").value),

        comissao: valorNumerico(
            campoComissao.value
                .replace("R$", "")
                .trim()
        ),

        data: document.getElementById("dataVenda").value,

        observacao: document.getElementById("observacao").value

    };

    vendas.push(venda);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(vendas)
    );

    alert("Venda salva com sucesso!");

    formulario.reset();

    campoComissao.value = "";

    atualizarDashboard();

    abrirTela("dashboard");
}

// ---------- Dashboard ----------

function atualizarDashboard() {

    let total = 0;

    let comissao = 0;

    vendas.forEach(venda => {

        total += venda.valor;

        comissao += venda.comissao;

    });

    document.getElementById("dashboardTotal").innerHTML =
        total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("dashboardComissao").innerHTML =
        comissao.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    document.getElementById("dashboardQtd").innerHTML =
        vendas.length;

}

atualizarDashboard();
// =====================================
// PARTE 2 - HISTÓRICO E PESQUISA
// =====================================

function carregarHistorico() {

    const lista = document.getElementById("listaMeses");

    if (!lista) return;

    const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    lista.innerHTML = "";

    meses.forEach((mes, indice) => {

        const quantidade = vendas.filter(v => {

            if (!v.data) return false;

            const data = new Date(v.data);

            return data.getMonth() === indice;

        }).length;

        const card = document.createElement("div");

        card.className = "mes";

        card.innerHTML = `
            <strong>${mes}</strong>
            <br>
            ${quantidade} venda(s)
        `;

        card.onclick = () => abrirMes(indice);

        lista.appendChild(card);

    });

}

// =====================================

function abrirMes(numeroMes){

    const nomesMeses=[
        "Janeiro","Fevereiro","Março","Abril",
        "Maio","Junho","Julho","Agosto",
        "Setembro","Outubro","Novembro","Dezembro"
    ];

    const vendasMes=vendas.filter(v=>{

        if(!v.data) return false;

        return new Date(v.data).getMonth()==numeroMes;

    });

    let html=`

    <div class="barra">

        <button onclick="abrirTela('historico')">

        ← Voltar

        </button>

        <h2>${nomesMeses[numeroMes]}</h2>

    </div>

    `;

    let total=0;

    let comissao=0;

    if(vendasMes.length===0){

        html+="<p>Nenhuma venda neste mês.</p>";

    }else{

        vendasMes.forEach(v=>{

            total+=v.valor;

            comissao+=v.comissao;

            html+=`

            <div class="card">

            <b>${v.cliente}</b>

            <br>

            ${v.produto}

            <br>

            ${v.tipo}

            <br>

            ${new Date(v.data).toLocaleDateString("pt-BR")}

            <br><br>

            <b>

            ${v.valor.toLocaleString("pt-BR",{
                style:"currency",
                currency:"BRL"
            })}

            </b>

            <br>

            Comissão

            ${v.comissao.toLocaleString("pt-BR",{
                style:"currency",
                currency:"BRL"
            })}

            <br><br>

            <button onclick="editarVenda(${v.id})">

            ✏️ Editar

            </button>

            <button onclick="excluirVenda(${v.id})">

            🗑️ Excluir

            </button>

            </div>

            `;

        });

        html+=`

        <div class="card">

        <h3>Total vendido</h3>

        <p>

        ${total.toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        })}

        </p>

        <br>

        <h3>Comissão total</h3>

        <p>

        ${comissao.toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        })}

        </p>

        <br>

        <h3>Quantidade de vendas</h3>

        <p>${vendasMes.length}</p>

        </div>

        `;

    }

    document.getElementById("historico").innerHTML=html;

}

// =====================================

const pesquisa=document.getElementById("pesquisaHistorico");

if(pesquisa){

pesquisa.addEventListener("input",function(){

const texto=this.value.toLowerCase();

document.querySelectorAll(".mes").forEach(card=>{

card.style.display=
card.innerText.toLowerCase().includes(texto)
?"block":"none";

});

});

}

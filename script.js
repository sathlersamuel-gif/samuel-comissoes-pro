const STORAGE_KEY = "samuel_comissoes_pro_v2";

let vendas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const $ = (id) => document.getElementById(id);

function salvarBanco() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
}

function abrirTela(id) {

    document.querySelectorAll(".tela").forEach(t => {
        t.classList.remove("ativa");
    });

    const tela = $(id);

    if (tela) tela.classList.add("ativa");

    if (id === "dashboard") atualizarDashboard();

}

function voltarDashboard() {
    abrirTela("dashboard");
}

function moeda(numero) {

    return Number(numero || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}

function numero(valor) {

    if (!valor) return 0;

    return Number(
        valor
            .replace(/\./g, "")
            .replace(",", ".")
            .replace(/[^\d.-]/g, "")
    ) || 0;

}

const campoValor = $("valorVenda");
const campoPorcentagem = $("porcentagem");
const campoComissao = $("comissao");

if (campoValor) {

    campoValor.addEventListener("input", () => {

        let v = campoValor.value.replace(/\D/g, "");

        v = (Number(v) / 100).toFixed(2);

        v = v.replace(".", ",");

        v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        campoValor.value = v;

        calcularComissao();

    });

}

if (campoPorcentagem) {

    campoPorcentagem.addEventListener("input", calcularComissao);

}

function calcularComissao() {

    if (!campoValor || !campoPorcentagem || !campoComissao) return;

    const valor = numero(campoValor.value);

    const porcentagem = parseFloat(campoPorcentagem.value) || 0;

    campoComissao.value = moeda(
        valor * porcentagem / 100
    );

}

function atualizarDashboard() {

    let total = 0;
    let totalComissao = 0;

    vendas.forEach(v => {

        total += Number(v.valor);
        totalComissao += Number(v.comissao);

    });

    if ($("dashboardTotal"))
        $("dashboardTotal").textContent = moeda(total);

    if ($("dashboardComissao"))
        $("dashboardComissao").textContent = moeda(totalComissao);

    if ($("dashboardQtd"))
        $("dashboardQtd").textContent = vendas.length;

}

document.addEventListener("DOMContentLoaded", () => {

    atualizarDashboard();

    abrirTela("dashboard");

});
const formulario = document.getElementById("formVenda");

if (formulario) {

    formulario.addEventListener("submit", salvarVenda);

}

function salvarVenda(e) {

    e.preventDefault();

    const venda = {

        id: Date.now(),

        cliente: $("cliente").value,

        telefone: $("telefone").value,

        produto: $("produto").value,

        tipo: $("tipoVenda").value,

        valor: numero($("valorVenda").value),

        porcentagem: parseFloat($("porcentagem").value) || 0,

        comissao:
            numero(
                $("comissao").value
                    .replace("R$", "")
                    .trim()
            ),

        data: $("dataVenda").value,

        observacao: $("observacao").value

    };

    vendas.push(venda);

    salvarBanco();

    atualizarDashboard();

    formulario.reset();

    $("comissao").value = "";

    alert("Venda salva com sucesso!");

    voltarDashboard();

}
function carregarHistorico() {

    const lista = $("listaMeses");

    if (!lista) return;

    const meses = [
        "Janeiro","Fevereiro","Março","Abril",
        "Maio","Junho","Julho","Agosto",
        "Setembro","Outubro","Novembro","Dezembro"
    ];

    lista.innerHTML = "";

    meses.forEach((mes, indice) => {

        const quantidade = vendas.filter(v => {

            if (!v.data) return false;

            return new Date(v.data).getMonth() === indice;

        }).length;

        const div = document.createElement("div");

        div.className = "mes";

        div.innerHTML = <strong>${mes}</strong><br>${quantidade} venda(s);

        div.onclick = () => abrirMes(indice);

        lista.appendChild(div);

    });

}

function abrirMes(mes) {

    const nomes = [
        "Janeiro","Fevereiro","Março","Abril",
        "Maio","Junho","Julho","Agosto",
        "Setembro","Outubro","Novembro","Dezembro"
    ];

    const lista = $("listaMeses");

    if (!lista) return;

    let total = 0;
    let totalComissao = 0;

    let html = <h3>${nomes[mes]}</h3>;

    const vendasMes = vendas.filter(v => {

        if (!v.data) return false;

        return new Date(v.data).getMonth() === mes;

    });

    vendasMes.forEach(v => {

        total += Number(v.valor);
        totalComissao += Number(v.comissao);

        html += `
        <div class="card">
            <b>${v.cliente}</b><br>
            ${v.produto}<br>
            ${moeda(v.valor)}<br>
            Comissão: ${moeda(v.comissao)}
        </div>
        `;

    });

    html += `
    <div class="card">
        <strong>Total vendido</strong><br>
        ${moeda(total)}<br><br>

        <strong>Comissão total</strong><br>
        ${moeda(totalComissao)}<br><br>

        <strong>Quantidade</strong><br>
        ${vendasMes.length}
    </div>

    <button onclick="carregarHistorico()">
        ← Voltar aos meses
    </button>
    `;

    lista.innerHTML = html;

}

document.addEventListener("DOMContentLoaded", carregarHistorico);
function excluirVenda(id){

    if(!confirm("Excluir esta venda?")) return;

    vendas = vendas.filter(v => v.id !== id);

    salvarBanco();

    atualizarDashboard();

    carregarHistorico();

}

function editarVenda(id){

    const venda = vendas.find(v => v.id === id);

    if(!venda) return;

    abrirTela("novaVenda");

    $("cliente").value = venda.cliente;
    $("telefone").value = venda.telefone;
    $("produto").value = venda.produto;
    $("tipoVenda").value = venda.tipo;
    $("valorVenda").value = venda.valor.toLocaleString("pt-BR",{
        minimumFractionDigits:2
    });
    $("porcentagem").value = venda.porcentagem;
    $("dataVenda").value = venda.data;
    $("observacao").value = venda.observacao;

    calcularComissao();

    excluirVenda(id);

}
const pesquisa = $("pesquisaHistorico");

if (pesquisa) {

    pesquisa.addEventListener("input", function () {

        const texto = this.value.toLowerCase();

        document.querySelectorAll(".mes").forEach(item => {

            item.style.display =
                item.innerText.toLowerCase().includes(texto)
                ? "block"
                : "none";

        });

    });

}

const btnBackup = $("exportarBackup");

if (btnBackup) {

    btnBackup.onclick = function () {

        const blob = new Blob(
            [JSON.stringify(vendas, null, 2)],
            { type: "application/json" }
        );

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);

        link.download = "backup_comissoes.json";

        link.click();

    };

}

const btnPDF = $("exportarPDF");

if (btnPDF) {

    btnPDF.onclick = function () {

        alert("Exportação em PDF será implementada na próxima versão.");

    };

}

atualizarDashboard();
carregarHistorico();

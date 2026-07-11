const STORAGE = "samuel_comissoes_pro";

let vendas = JSON.parse(localStorage.getItem(STORAGE)) || [];

const $ = (id) => document.getElementById(id);

function salvarBanco() {
    localStorage.setItem(STORAGE, JSON.stringify(vendas));
}

function abrirTela(id) {

    document.querySelectorAll(".tela").forEach(t => {
        t.classList.remove("ativa");
    });

    const tela = $(id);

    if (tela) {
        tela.classList.add("ativa");
    }

    if (id === "dashboard") {
        atualizarDashboard();
    }

    if (id === "historico") {
        carregarHistorico();
    }

}

function voltarDashboard() {
    abrirTela("dashboard");
}

function moeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {
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

    campoValor.addEventListener("input", function () {

        let valor = this.value.replace(/\D/g, "");

        valor = (Number(valor) / 100).toFixed(2);

        valor = valor.replace(".", ",");

        valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        this.value = valor;

        calcularComissao();

    });

}

if (campoPorcentagem) {

    campoPorcentagem.addEventListener("input", calcularComissao);

}

function calcularComissao() {

    if (!campoValor) return;

    const valor = numero(campoValor.value);

    const porcentagem = parseFloat(campoPorcentagem.value) || 0;

    campoComissao.value = moeda(
        valor * porcentagem / 100
    );

}

function atualizarDashboard() {

    let total = 0;
    let comissao = 0;

    vendas.forEach(v => {

        total += Number(v.valor);

        comissao += Number(v.comissao);

    });

    if ($("dashboardTotal"))
        $("dashboardTotal").textContent = moeda(total);

    if ($("dashboardComissao"))
        $("dashboardComissao").textContent = moeda(comissao);

    if ($("dashboardQtd"))
        $("dashboardQtd").textContent = vendas.length;

}

document.addEventListener("DOMContentLoaded", () => {

    atualizarDashboard();

});
const formulario = $("formVenda");

if (formulario) {

    formulario.addEventListener("submit", function (e) {

        e.preventDefault();

        const venda = {
            id: Date.now(),
            cliente: $("cliente").value,
            telefone: $("telefone").value,
            produto: $("produto").value,
            tipo: $("tipoVenda").value,
            valor: numero($("valorVenda").value),
            porcentagem: parseFloat($("porcentagem").value) || 0,
            comissao: numero(
                $("comissao").value.replace("R$", "").trim()
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

    });

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

    meses.forEach((mes, i) => {

        const qtd = vendas.filter(v => {

            if (!v.data) return false;

            return new Date(v.data).getMonth() === i;

        }).length;

        lista.innerHTML += `
            <div class="mes" onclick="abrirMes(${i})">
                <strong>${mes}</strong><br>
                ${qtd} venda(s)
            </div>
        `;

    });

}

function abrirMes(mes) {

    alert("Tela do mês será adicionada na Parte 4.");

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

abrirTela("dashboard");

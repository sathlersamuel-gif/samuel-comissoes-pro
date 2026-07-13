(function () {
    const $el = (id) => document.getElementById(id);
    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function valorPercentual(texto) {
        return Number(String(texto || "0").replace(",", ".")) || 0;
    }

    function formatarCampoPercentual(evento) {
        const campo = evento.currentTarget;
        let valor = String(campo.value || "").replace(".", ",").replace(/[^\d,]/g, "");

        if (evento.inputType && evento.inputType.startsWith("delete") && /^\d$/.test(valor)) {
            campo.value = "";
            recalcularComissao();
            return;
        }

        if (!valor) {
            campo.value = "";
            recalcularComissao();
            return;
        }

        const partes = valor.split(",");
        let inteiro = partes.shift().replace(/\D/g, "").slice(0, 2);
        let decimal = partes.join("").replace(/\D/g, "").slice(0, 2);

        if (!inteiro) inteiro = "0";
        campo.value = `${inteiro},${decimal}`;
        recalcularComissao();
    }

    function recalcularComissao() {
        const campoValor = $el("valorVenda");
        const campoPercentual = $el("porcentagem");
        const campoComissao = $el("comissao");
        if (!campoValor || !campoPercentual || !campoComissao) return;

        const valorVenda = typeof numero === "function"
            ? numero(campoValor.value)
            : Number(String(campoValor.value).replace(/\./g, "").replace(",", ".")) || 0;

        const total = valorVenda * valorPercentual(campoPercentual.value) / 100;
        campoComissao.value = typeof moeda === "function"
            ? moeda(total)
            : total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function prepararCampoComissao() {
        const campo = $el("porcentagem");
        const formulario = $el("formVenda");
        if (!campo) return;

        campo.setAttribute("type", "text");
        campo.setAttribute("inputmode", "decimal");
        campo.setAttribute("autocomplete", "off");
        campo.addEventListener("input", formatarCampoPercentual);

        campo.addEventListener("focus", function () {
            if (this.value && !this.value.includes(",")) {
                this.value = String(this.value).replace(".", ",");
            }
        });

        if (formulario) {
            formulario.addEventListener("submit", function () {
                campo.value = String(campo.value || "0").replace(",", ".");
            }, true);
        }

        if (typeof editarVenda === "function") {
            const editarOriginal = editarVenda;
            window.editarVenda = function (id) {
                editarOriginal(id);
                const atual = $el("porcentagem");
                if (atual && atual.value) atual.value = String(atual.value).replace(".", ",");
                recalcularComissao();
            };
        }
    }

    function dataLocal(dataTexto) {
        const partes = String(dataTexto || "").split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function formatarData(dataTexto) {
        const data = dataLocal(dataTexto);
        return data ? data.toLocaleDateString("pt-BR") : "";
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function vendasDoAno(ano) {
        return (vendas || []).filter((venda) => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === Number(ano);
        });
    }

    function preencherAnos() {
        const seletor = $el("anoRelatorio");
        if (!seletor) return;

        const anoAtual = new Date().getFullYear();
        const anos = [...new Set((vendas || [])
            .map(v => dataLocal(v.data))
            .filter(Boolean)
            .map(data => data.getFullYear()))];

        if (!anos.includes(anoAtual)) anos.push(anoAtual);
        anos.sort((a, b) => b - a);
        seletor.innerHTML = anos.map(ano => `<option value="${ano}">${ano}</option>`).join("");
    }

    function preencherMeses() {
        const seletor = $el("mesRelatorio");
        if (!seletor) return;
        const atual = new Date().getMonth();
        seletor.innerHTML = nomesMeses.map((nome, indice) =>
            `<option value="${indice}" ${indice === atual ? "selected" : ""}>${nome}</option>`
        ).join("");
    }

    function escapar(texto) {
        return String(texto || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function tabelaMes(lista, mes, ano) {
        const ordenadas = [...lista].sort((a, b) => String(a.data).localeCompare(String(b.data)));
        const totalMes = ordenadas.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        const linhas = ordenadas.map(venda => `
            <tr>
                <td>${escapar(formatarData(venda.data))}</td>
                <td>${escapar(venda.cliente)}</td>
                <td>${escapar(venda.modelo || venda.produto)}</td>
                <td>${escapar(venda.tipo || venda.tipoVenda)}</td>
                <td class="valor">${formatarMoeda(venda.valor)}</td>
            </tr>`).join("");

        return `
            <section class="mes-pdf">
                <h2>${nomesMeses[mes]} de ${ano}</h2>
                <table>
                    <thead><tr><th>Data</th><th>Cliente</th><th>Produto/Modelo</th><th>Negociação</th><th>Valor</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
                <div class="subtotal">Total de ${nomesMeses[mes]}: ${formatarMoeda(totalMes)}</div>
            </section>`;
    }

    function imprimirRelatorio(titulo, conteudo, totalGeral) {
        const janela = window.open("", "_blank");
        if (!janela) {
            alert("O navegador bloqueou a impressão. Permita pop-ups e tente novamente.");
            return;
        }

        janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapar(titulo)}</title>
        <style>
            body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{text-align:center;color:#003b8e;margin:0 0 24px}
            h2{background:#003b8e;color:#fff;padding:9px 12px;font-size:17px;margin:24px 0 8px}
            table{width:100%;border-collapse:collapse;page-break-inside:auto}tr{page-break-inside:avoid}
            th,td{border:1px solid #555;padding:7px;font-size:11px;text-align:left}th{background:#eee}.valor{text-align:right;white-space:nowrap}
            .subtotal,.total-geral{text-align:right;font-weight:bold;margin-top:10px}.total-geral{font-size:19px;border-top:2px solid #003b8e;padding-top:12px}
            .mes-pdf{page-break-inside:avoid}@media print{body{margin:10mm}.mes-pdf{page-break-after:auto}}
        </style></head><body><h1>${escapar(titulo)}</h1>${conteudo}<div class="total-geral">Total geral: ${formatarMoeda(totalGeral)}</div></body></html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => janela.print(), 400);
    }

    function exportarMes() {
        const ano = Number($el("anoRelatorio")?.value);
        const mes = Number($el("mesRelatorio")?.value);
        const lista = vendasDoAno(ano).filter(venda => dataLocal(venda.data).getMonth() === mes);

        if (!lista.length) {
            alert(`Nenhuma venda encontrada em ${nomesMeses[mes]} de ${ano}.`);
            return;
        }

        const total = lista.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        imprimirRelatorio(`Relatório mensal — ${nomesMeses[mes]} de ${ano}`, tabelaMes(lista, mes, ano), total);
    }

    function exportarAno() {
        const ano = Number($el("anoRelatorio")?.value);
        const listaAno = vendasDoAno(ano);

        if (!listaAno.length) {
            alert(`Nenhuma venda encontrada no ano de ${ano}.`);
            return;
        }

        let conteudo = "";
        for (let mes = 0; mes < 12; mes++) {
            const listaMes = listaAno.filter(venda => dataLocal(venda.data).getMonth() === mes);
            if (listaMes.length) conteudo += tabelaMes(listaMes, mes, ano);
        }

        const total = listaAno.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        imprimirRelatorio(`Relatório anual — ${ano}`, conteudo, total);
    }

    function prepararRelatorios() {
        preencherAnos();
        preencherMeses();
        $el("exportarPDFMes")?.addEventListener("click", exportarMes);
        $el("exportarPDFTodos")?.addEventListener("click", exportarAno);
    }

    document.addEventListener("DOMContentLoaded", function () {
        prepararCampoComissao();
        prepararRelatorios();
    });
})();

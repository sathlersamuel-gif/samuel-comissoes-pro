(function () {
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    let vendaEmEdicao = null;

    const $id = (id) => document.getElementById(id);

    function dataLocal(texto) {
        const partes = String(texto || "").split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function moedaLocal(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function escapar(texto) {
        return String(texto || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function valorNumero(valor) {
        if (typeof valor === "number") return valor;
        return Number(String(valor || "0")
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()) || 0;
    }

    function formatarValorCampo(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function preencherRelatorios() {
        const seletorAno = $id("anoRelatorio");
        const seletorMes = $id("mesRelatorio");
        if (!seletorAno || !seletorMes) return;

        const anoAtual = new Date().getFullYear();
        const anos = [...new Set((vendas || [])
            .map(venda => dataLocal(venda.data))
            .filter(Boolean)
            .map(data => data.getFullYear()))];

        if (!anos.includes(anoAtual)) anos.push(anoAtual);
        anos.sort((a, b) => b - a);

        seletorAno.innerHTML = anos.map(ano =>
            `<option value="${ano}">${ano}</option>`
        ).join("");

        const mesAtual = new Date().getMonth();
        seletorMes.innerHTML = MESES.map((mes, indice) =>
            `<option value="${indice}" ${indice === mesAtual ? "selected" : ""}>${mes}</option>`
        ).join("");
    }

    function tabelaMes(lista, ano, mes) {
        const ordenadas = [...lista].sort((a, b) => String(a.data).localeCompare(String(b.data)));
        const total = ordenadas.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);

        const linhas = ordenadas.map(venda => `
            <tr>
                <td>${escapar(dataLocal(venda.data)?.toLocaleDateString("pt-BR") || "")}</td>
                <td>${escapar(venda.cliente)}</td>
                <td>${escapar(venda.produto || venda.modelo)}</td>
                <td>${escapar(venda.tipo || venda.tipoVenda)}</td>
                <td class="valor">${moedaLocal(venda.valor)}</td>
            </tr>`).join("");

        return {
            total,
            html: `<section class="mes-pdf">
                <h2>${MESES[mes]} de ${ano}</h2>
                <table>
                    <thead><tr><th>Data</th><th>Cliente</th><th>Produto/Modelo</th><th>Negociação</th><th>Valor</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
                <div class="subtotal">Total de ${MESES[mes]}: ${moedaLocal(total)}</div>
            </section>`
        };
    }

    function imprimir(titulo, conteudo, total) {
        const janela = window.open("", "_blank");
        if (!janela) {
            alert("Permita a abertura de janelas para exportar o relatório.");
            return;
        }

        janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapar(titulo)}</title>
        <style>
            body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{text-align:center;color:#003b8e}
            h2{background:#003b8e;color:#fff;padding:9px 12px;font-size:17px;margin:24px 0 8px}
            table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:7px;font-size:11px;text-align:left}
            th{background:#eee}.valor{text-align:right;white-space:nowrap}.subtotal,.total-geral{text-align:right;font-weight:bold;margin-top:10px}
            .total-geral{font-size:19px;border-top:2px solid #003b8e;padding-top:12px}.mes-pdf{page-break-inside:avoid}
        </style></head><body><h1>${escapar(titulo)}</h1>${conteudo}<div class="total-geral">Total geral: ${moedaLocal(total)}</div></body></html>`);
        janela.document.close();
        setTimeout(() => janela.print(), 500);
    }

    function exportarMes() {
        const ano = Number($id("anoRelatorio")?.value);
        const mes = Number($id("mesRelatorio")?.value);
        const lista = (vendas || []).filter(venda => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === ano && data.getMonth() === mes;
        });

        if (!lista.length) {
            alert(`Nenhuma venda encontrada em ${MESES[mes]} de ${ano}.`);
            return;
        }

        const tabela = tabelaMes(lista, ano, mes);
        imprimir(`Relatório mensal — ${MESES[mes]} de ${ano}`, tabela.html, tabela.total);
    }

    function exportarAno() {
        const ano = Number($id("anoRelatorio")?.value);
        const listaAno = (vendas || []).filter(venda => dataLocal(venda.data)?.getFullYear() === ano);

        if (!listaAno.length) {
            alert(`Nenhuma venda encontrada no ano de ${ano}.`);
            return;
        }

        let conteudo = "";
        let total = 0;
        for (let mes = 0; mes < 12; mes++) {
            const listaMes = listaAno.filter(venda => dataLocal(venda.data)?.getMonth() === mes);
            if (!listaMes.length) continue;
            const tabela = tabelaMes(listaMes, ano, mes);
            conteudo += tabela.html;
            total += tabela.total;
        }

        imprimir(`Relatório anual — ${ano}`, conteudo, total);
    }

    window.abrirMesAno = function (ano, mes) {
        const listaMeses = $id("listaMeses");
        const detalhes = $id("detalhesMes");
        const titulo = $id("tituloMes");
        const conteudo = $id("listaVendasMes");
        if (!detalhes || !conteudo) return;

        const lista = (vendas || []).filter(venda => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === Number(ano) && data.getMonth() === Number(mes);
        }).sort((a, b) => String(a.data).localeCompare(String(b.data)));

        if (titulo) titulo.textContent = `${MESES[mes]} de ${ano}`;
        const totalVendido = lista.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        const totalComissao = lista.reduce((soma, venda) => soma + Number(venda.comissao || 0), 0);

        conteudo.innerHTML = `
            <div style="margin-bottom:14px;font-weight:bold">
                Total vendido: ${moedaLocal(totalVendido)}<br>
                Comissão: ${moedaLocal(totalComissao)}
            </div>
            ${lista.map(venda => `
                <div class="card" style="margin-bottom:12px;text-align:left">
                    <strong>${escapar(venda.cliente)}</strong><br>
                    ${escapar(venda.produto || venda.modelo)}<br>
                    ${escapar(venda.tipo || venda.tipoVenda)}<br>
                    ${dataLocal(venda.data)?.toLocaleDateString("pt-BR") || ""} — ${moedaLocal(venda.valor)}
                    <div style="display:flex;gap:8px;margin-top:10px">
                        <button type="button" onclick="editarVendaSegura(${Number(venda.id)})">✏️ Editar</button>
                        <button type="button" onclick="excluirVendaSegura(${Number(venda.id)}, ${ano}, ${mes})">🗑️ Excluir</button>
                    </div>
                </div>`).join("")}`;

        if (listaMeses) listaMeses.style.display = "none";
        detalhes.style.display = "block";
    };

    window.editarVendaSegura = function (id) {
        const venda = (vendas || []).find(item => Number(item.id) === Number(id));
        if (!venda) return;

        vendaEmEdicao = Number(id);
        abrirTela("novaVenda");
        $id("cliente").value = venda.cliente || "";
        $id("telefone").value = venda.telefone || "";
        $id("produto").value = venda.produto || venda.modelo || "";
        $id("tipoVenda").value = venda.tipo || venda.tipoVenda || "À Vista";
        $id("valorVenda").value = formatarValorCampo(venda.valor);
        $id("porcentagem").value = String(venda.porcentagem || "").replace(".", ",");
        $id("dataVenda").value = venda.data || "";
        $id("observacao").value = venda.observacao || "";
        if (typeof calcularComissao === "function") calcularComissao();

        const botao = document.querySelector("#formVenda button[type='submit']");
        if (botao) botao.textContent = "SALVAR ALTERAÇÕES";
    };

    window.excluirVendaSegura = function (id, ano, mes) {
        if (!confirm("Excluir esta venda?")) return;
        vendas = (vendas || []).filter(item => Number(item.id) !== Number(id));
        salvarBanco();
        atualizarDashboard();
        carregarHistorico();
        preencherRelatorios();
        abrirMesAno(ano, mes);
    };

    function salvarEdicao(evento) {
        if (vendaEmEdicao === null) return;

        evento.preventDefault();
        evento.stopImmediatePropagation();

        const indice = (vendas || []).findIndex(item => Number(item.id) === Number(vendaEmEdicao));
        if (indice < 0) return;

        const porcentagem = valorNumero($id("porcentagem").value);
        const valor = valorNumero($id("valorVenda").value);

        vendas[indice] = {
            ...vendas[indice],
            cliente: $id("cliente").value.trim(),
            telefone: $id("telefone").value.trim(),
            produto: $id("produto").value.trim(),
            tipo: $id("tipoVenda").value,
            valor,
            porcentagem,
            comissao: valor * porcentagem / 100,
            data: $id("dataVenda").value || new Date().toISOString().slice(0, 10),
            observacao: $id("observacao").value.trim()
        };

        salvarBanco();
        atualizarDashboard();
        carregarHistorico();
        preencherRelatorios();
        $id("formVenda").reset();
        $id("comissao").value = "";
        vendaEmEdicao = null;

        const botao = document.querySelector("#formVenda button[type='submit']");
        if (botao) botao.textContent = "SALVAR VENDA";

        alert("Venda atualizada com sucesso!");
        abrirTela("historico");
    }

    document.addEventListener("DOMContentLoaded", function () {
        preencherRelatorios();
        $id("exportarPDFMes")?.addEventListener("click", exportarMes);
        $id("exportarPDFTodos")?.addEventListener("click", exportarAno);
        $id("formVenda")?.addEventListener("submit", salvarEdicao, true);
    });
})();
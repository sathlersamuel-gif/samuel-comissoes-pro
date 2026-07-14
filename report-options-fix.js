(function () {
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const $ = (id) => document.getElementById(id);

    function dataLocal(texto) {
        const partes = String(texto || "").split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function moeda(valor) {
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

    function tabelaMes(lista, ano, mes, quebraPagina) {
        const ordenadas = [...lista].sort((a, b) => String(a.data).localeCompare(String(b.data)));
        const total = ordenadas.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        const linhas = ordenadas.map(venda => `
            <tr>
                <td>${escapar(dataLocal(venda.data)?.toLocaleDateString("pt-BR") || "")}</td>
                <td>${escapar(venda.cliente)}</td>
                <td>${escapar(venda.produto || venda.modelo)}</td>
                <td>${escapar(venda.tipo || venda.tipoVenda)}</td>
                <td class="valor">${moeda(venda.valor)}</td>
            </tr>`).join("");

        return {
            total,
            html: `<section class="mes-pdf ${quebraPagina ? "nova-folha" : ""}">
                <h2>${MESES[mes]} de ${ano}</h2>
                <table>
                    <thead><tr><th>Data</th><th>Cliente</th><th>Produto/Modelo</th><th>Negociação</th><th>Valor</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
                <div class="subtotal">Total de ${MESES[mes]}: ${moeda(total)}</div>
            </section>`
        };
    }

    function imprimir(titulo, conteudo, total, anual) {
        document.getElementById("areaImpressaoRelatorio")?.remove();
        document.getElementById("estiloImpressaoRelatorio")?.remove();

        const area = document.createElement("div");
        area.id = "areaImpressaoRelatorio";
        area.innerHTML = `<h1>${escapar(titulo)}</h1>${conteudo}<div class="total-geral">Total geral: ${moeda(total)}</div>`;
        document.body.appendChild(area);

        const estilo = document.createElement("style");
        estilo.id = "estiloImpressaoRelatorio";
        estilo.textContent = `
            #areaImpressaoRelatorio{display:none}
            @media print{
                body > *:not(#areaImpressaoRelatorio){display:none !important}
                #areaImpressaoRelatorio{display:block !important;font-family:Arial,sans-serif;color:#111;background:#fff;margin:0;padding:10mm}
                #areaImpressaoRelatorio h1{text-align:center;color:#003b8e;margin:0 0 28px;font-size:24px}
                #areaImpressaoRelatorio h2{background:#003b8e;color:#fff;padding:9px 12px;font-size:17px;margin:0 0 8px}
                #areaImpressaoRelatorio table{width:100%;border-collapse:collapse}
                #areaImpressaoRelatorio th,#areaImpressaoRelatorio td{border:1px solid #555;padding:7px;font-size:11px;text-align:left}
                #areaImpressaoRelatorio th{background:#eee}
                #areaImpressaoRelatorio .valor{text-align:right;white-space:nowrap}
                #areaImpressaoRelatorio .subtotal,#areaImpressaoRelatorio .total-geral{text-align:right;font-weight:bold;margin-top:10px}
                #areaImpressaoRelatorio .total-geral{font-size:19px;border-top:2px solid #003b8e;padding-top:12px;margin-top:18px}
                #areaImpressaoRelatorio .mes-pdf{break-inside:avoid;page-break-inside:avoid;margin-bottom:24px}
                ${anual ? "#areaImpressaoRelatorio .nova-folha{break-before:page;page-break-before:always}" : ""}
            }`;
        document.head.appendChild(estilo);

        const limpar = () => {
            setTimeout(() => {
                area.remove();
                estilo.remove();
            }, 500);
        };

        window.addEventListener("afterprint", limpar, { once: true });
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
        setTimeout(limpar, 60000);
    }

    function exportarMensal(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();

        const ano = Number($("anoRelatorio")?.value);
        const mes = Number($("mesRelatorio")?.value);
        const lista = (window.vendas || []).filter(venda => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === ano && data.getMonth() === mes;
        });

        if (!lista.length) {
            alert(`Nenhuma venda encontrada em ${MESES[mes]} de ${ano}.`);
            return;
        }

        const tabela = tabelaMes(lista, ano, mes, false);
        imprimir(`Relatório mensal — ${MESES[mes]} de ${ano}`, tabela.html, tabela.total, false);
    }

    function exportarAnual(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();

        const ano = Number($("anoRelatorio")?.value);
        const listaAno = (window.vendas || []).filter(venda => dataLocal(venda.data)?.getFullYear() === ano);

        if (!listaAno.length) {
            alert(`Nenhuma venda encontrada no ano de ${ano}.`);
            return;
        }

        let conteudo = "";
        let total = 0;
        let primeiroMes = true;

        for (let mes = 0; mes < 12; mes++) {
            const listaMes = listaAno.filter(venda => dataLocal(venda.data)?.getMonth() === mes);
            if (!listaMes.length) continue;
            const tabela = tabelaMes(listaMes, ano, mes, !primeiroMes);
            primeiroMes = false;
            conteudo += tabela.html;
            total += tabela.total;
        }

        imprimir(`Relatório anual — ${ano}`, conteudo, total, true);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const mensal = $("exportarPDFMes");
        const anual = $("exportarPDFTodos");

        if (mensal) {
            mensal.textContent = "📄 Exportar relatório mensal";
            mensal.addEventListener("click", exportarMensal, true);
        }

        if (anual) {
            anual.textContent = "📚 Exportar relatório anual completo";
            anual.addEventListener("click", exportarAnual, true);
        }
    });
})();
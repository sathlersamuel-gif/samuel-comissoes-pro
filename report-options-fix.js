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
            .replace(/"/g, "&quot;")
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

    function montarDocumento(titulo, conteudo, total, anual) {
        return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title>
        <style>
            body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{text-align:center;color:#003b8e;margin-bottom:28px}
            h2{background:#003b8e;color:#fff;padding:9px 12px;font-size:17px;margin:0 0 8px}
            table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:7px;font-size:11px;text-align:left}
            th{background:#eee}.valor{text-align:right;white-space:nowrap}.subtotal,.total-geral{text-align:right;font-weight:bold;margin-top:10px}
            .total-geral{font-size:19px;border-top:2px solid #003b8e;padding-top:12px;margin-top:18px}.mes-pdf{page-break-inside:avoid;margin-bottom:24px}
            ${anual ? ".nova-folha{page-break-before:always}" : ""}
            @media print{body{margin:10mm}}
        </style></head><body><h1>${escapar(titulo)}</h1>${conteudo}<div class="total-geral">Total geral: ${moeda(total)}</div></body></html>`;
    }

    function imprimir(titulo, conteudo, total, anual) {
        const html = montarDocumento(titulo, conteudo, total, anual);
        let iframe = document.getElementById("iframeImpressaoRelatorio");
        if (iframe) iframe.remove();

        iframe = document.createElement("iframe");
        iframe.id = "iframeImpressaoRelatorio";
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "0";
        iframe.style.opacity = "0";
        document.body.appendChild(iframe);

        const documento = iframe.contentDocument || iframe.contentWindow.document;
        documento.open();
        documento.write(html);
        documento.close();

        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (erro) {
                console.error("Falha ao imprimir relatório:", erro);
                alert("Não foi possível abrir a impressão. Tente novamente pelo Safari ou Chrome.");
            }
            setTimeout(() => iframe.remove(), 2000);
        }, 350);
    }

    function exportarMensal(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();

        const ano = Number($("anoRelatorio")?.value);
        const mes = Number($("mesRelatorio")?.value);
        const lista = (vendas || []).filter(venda => {
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
        const listaAno = (vendas || []).filter(venda => dataLocal(venda.data)?.getFullYear() === ano);

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
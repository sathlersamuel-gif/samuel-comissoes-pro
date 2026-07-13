(function () {
    const botaoImportar = document.getElementById("importarBackup");

    if (botaoImportar) {
        botaoImportar.addEventListener("click", function () {
            const seletorArquivo = document.createElement("input");
            seletorArquivo.type = "file";
            seletorArquivo.accept = ".json,application/json";

            seletorArquivo.addEventListener("change", function (evento) {
                const arquivo = evento.target.files && evento.target.files[0];
                if (!arquivo) return;

                const leitor = new FileReader();
                leitor.onload = function () {
                    try {
                        const conteudo = JSON.parse(String(leitor.result || ""));
                        const vendasImportadas = Array.isArray(conteudo)
                            ? conteudo
                            : conteudo && Array.isArray(conteudo.vendas)
                                ? conteudo.vendas
                                : null;

                        if (!vendasImportadas || !vendasImportadas.every(v => v && typeof v === "object")) {
                            throw new Error("Backup inválido");
                        }

                        if (!confirm("Foram encontradas " + vendasImportadas.length + " venda(s). Deseja substituir os dados atuais por este backup?")) return;

                        vendas = vendasImportadas;
                        salvarBanco();
                        atualizarDashboard();
                        carregarHistorico();
                        alert("Backup importado com sucesso! " + vendas.length + " venda(s) restaurada(s).");
                        abrirTela("dashboard");
                    } catch (erro) {
                        alert("Não foi possível importar o backup. Selecione um arquivo JSON exportado pelo aplicativo.");
                        console.error(erro);
                    }
                };

                leitor.onerror = function () {
                    alert("Não foi possível ler o arquivo selecionado.");
                };

                leitor.readAsText(arquivo, "UTF-8");
            });

            seletorArquivo.click();
        });
    }

    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function percentualNumero(valor) {
        return Number(String(valor || "0").replace(",", ".")) || 0;
    }

    function prepararCampoComissao() {
        const campo = document.getElementById("porcentagem");
        const campoValor = document.getElementById("valorVenda");
        const campoComissao = document.getElementById("comissao");
        const formulario = document.getElementById("formVenda");
        if (!campo || !campoValor || !campoComissao) return;

        campo.type = "text";
        campo.inputMode = "decimal";
        campo.autocomplete = "off";

        function recalcular() {
            const valorVenda = typeof numero === "function"
                ? numero(campoValor.value)
                : Number(String(campoValor.value).replace(/\./g, "").replace(",", ".")) || 0;
            campoComissao.value = moeda(valorVenda * percentualNumero(campo.value) / 100);
        }

        campo.addEventListener("input", function (evento) {
            let valor = String(this.value || "").replace(".", ",").replace(/[^\d,]/g, "");

            if (!valor) {
                this.value = "";
                recalcular();
                return;
            }

            if (evento.inputType && evento.inputType.startsWith("delete") && /^\d$/.test(valor)) {
                this.value = "";
                recalcular();
                return;
            }

            const partes = valor.split(",");
            const inteiro = (partes.shift() || "0").replace(/\D/g, "").slice(0, 2) || "0";
            const decimal = partes.join("").replace(/\D/g, "").slice(0, 2);
            this.value = inteiro + "," + decimal;
            recalcular();
        });

        campoValor.addEventListener("input", recalcular);

        if (formulario) {
            formulario.addEventListener("submit", function () {
                campo.value = String(campo.value || "0").replace(",", ".");
            }, true);
        }
    }

    function dataValida(texto) {
        const partes = String(texto || "").split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function formatarData(texto) {
        const data = dataValida(texto);
        return data ? data.toLocaleDateString("pt-BR") : "";
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

    function imprimir(titulo, conteudo, total) {
        const janela = window.open("", "_blank");
        if (!janela) {
            alert("Permita pop-ups para imprimir o relatório.");
            return;
        }

        janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapar(titulo)}</title>
        <style>
        body{font-family:Arial,sans-serif;color:#111;margin:24px}h1{text-align:center;color:#003b8e}h2{background:#003b8e;color:#fff;padding:9px 12px;font-size:17px;margin:24px 0 8px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:7px;font-size:11px;text-align:left}th{background:#eee}.valor{text-align:right;white-space:nowrap}
        .subtotal,.total-geral{text-align:right;font-weight:bold;margin-top:10px}.total-geral{font-size:19px;border-top:2px solid #003b8e;padding-top:12px}.mes-pdf{page-break-inside:avoid}
        </style></head><body><h1>${escapar(titulo)}</h1>${conteudo}<div class="total-geral">Total geral: ${formatarMoeda(total)}</div></body></html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => janela.print(), 500);
    }

    function prepararRelatorios() {
        const botaoAntigo = document.getElementById("exportarPDF");
        if (!botaoAntigo) return;

        const anos = [...new Set((vendas || []).map(v => dataValida(v.data)).filter(Boolean).map(d => d.getFullYear()))];
        const anoAtual = new Date().getFullYear();
        if (!anos.includes(anoAtual)) anos.push(anoAtual);
        anos.sort((a, b) => b - a);

        const bloco = document.createElement("div");
        bloco.innerHTML = `
            <select id="anoRelatorio">${anos.map(a => `<option value="${a}">${a}</option>`).join("")}</select>
            <select id="mesRelatorio">${nomesMeses.map((m, i) => `<option value="${i}" ${i === new Date().getMonth() ? "selected" : ""}>${m}</option>`).join("")}</select>
            <button id="exportarPDFMes">📄 Exportar mês selecionado</button>
            <button id="exportarPDFTodos">📚 Exportar todos os meses do ano</button>`;

        botaoAntigo.replaceWith(bloco);

        document.getElementById("exportarPDFMes").addEventListener("click", function () {
            const ano = Number(document.getElementById("anoRelatorio").value);
            const mes = Number(document.getElementById("mesRelatorio").value);
            const lista = (vendas || []).filter(v => {
                const d = dataValida(v.data);
                return d && d.getFullYear() === ano && d.getMonth() === mes;
            });
            if (!lista.length) return alert("Nenhuma venda encontrada nesse mês.");
            const total = lista.reduce((s, v) => s + Number(v.valor || 0), 0);
            imprimir(`Relatório mensal — ${nomesMeses[mes]} de ${ano}`, tabelaMes(lista, mes, ano), total);
        });

        document.getElementById("exportarPDFTodos").addEventListener("click", function () {
            const ano = Number(document.getElementById("anoRelatorio").value);
            const listaAno = (vendas || []).filter(v => {
                const d = dataValida(v.data);
                return d && d.getFullYear() === ano;
            });
            if (!listaAno.length) return alert("Nenhuma venda encontrada nesse ano.");

            let conteudo = "";
            for (let mes = 0; mes < 12; mes++) {
                const listaMes = listaAno.filter(v => dataValida(v.data).getMonth() === mes);
                if (listaMes.length) conteudo += tabelaMes(listaMes, mes, ano);
            }
            const total = listaAno.reduce((s, v) => s + Number(v.valor || 0), 0);
            imprimir(`Relatório anual — ${ano}`, conteudo, total);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        prepararCampoComissao();
        prepararRelatorios();
    });
})();
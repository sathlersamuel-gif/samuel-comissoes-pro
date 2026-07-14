(function () {
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const STORAGE = "samuel_comissoes_pro";
    const $ = (id) => document.getElementById(id);

    function obterVendas() {
        try {
            const dados = JSON.parse(localStorage.getItem(STORAGE) || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            console.error("Erro ao carregar vendas:", erro);
            return [];
        }
    }

    function dataLocal(texto) {
        const valor = String(texto || "").slice(0, 10);
        const partes = valor.split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function texto(valor) {
        return String(valor ?? "").trim();
    }

    function nomeArquivo(valor) {
        return String(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();
    }

    function verificarBiblioteca() {
        if (!window.jspdf?.jsPDF) {
            alert("Não foi possível carregar o gerador de PDF. Verifique sua internet e tente novamente.");
            return false;
        }
        return true;
    }

    function criarDocumento(titulo) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        doc.setProperties({
            title: titulo,
            subject: "Relatório de vendas",
            author: "Controle de Vendas PRO"
        });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(0, 59, 142);
        doc.text("CONTROLE DE VENDAS PRO", 14, 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(titulo, 14, 23);
        doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 29);

        return doc;
    }

    function linhasTabela(lista) {
        return [...lista]
            .sort((a, b) => texto(a.data).localeCompare(texto(b.data)))
            .map((venda) => {
                const data = dataLocal(venda.data);
                return [
                    data ? data.toLocaleDateString("pt-BR") : "",
                    texto(venda.cliente),
                    texto(venda.produto || venda.modelo),
                    texto(venda.tipo || venda.tipoVenda),
                    moeda(venda.valor)
                ];
            });
    }

    function adicionarTabela(doc, lista, tituloMes, inicioY) {
        const total = lista.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 59, 142);
        doc.text(tituloMes, 14, inicioY);

        doc.autoTable({
            startY: inicioY + 4,
            head: [["Data", "Cliente", "Produto/Modelo", "Negociação", "Valor"]],
            body: linhasTabela(lista),
            theme: "grid",
            styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 2.5,
                textColor: [20, 20, 20]
            },
            headStyles: {
                fillColor: [0, 59, 142],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            },
            columnStyles: {
                0: { cellWidth: 24 },
                1: { cellWidth: 54 },
                2: { cellWidth: 78 },
                3: { cellWidth: 48 },
                4: { cellWidth: 38, halign: "right" }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: function () {
                const pagina = doc.internal.getNumberOfPages();
                const largura = doc.internal.pageSize.getWidth();
                const altura = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Página ${pagina}`, largura - 14, altura - 7, { align: "right" });
            }
        });

        const fimY = doc.lastAutoTable.finalY + 7;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(`Total de ${tituloMes}: ${moeda(total)}`, 283, fimY, { align: "right" });

        return { total, fimY };
    }

    async function compartilharPeloSistema(arquivoPDF) {
        if (!navigator.share) return false;

        try {
            if (navigator.canShare && !navigator.canShare({ files: [arquivoPDF] })) return false;

            await navigator.share({
                title: "Relatório de vendas",
                text: "Relatório em PDF do Controle de Vendas PRO",
                files: [arquivoPDF]
            });
            return true;
        } catch (erro) {
            if (erro?.name === "AbortError") return true;
            console.warn("Não foi possível abrir o compartilhamento do sistema:", erro);
            return false;
        }
    }

    async function entregarPDF(doc, arquivo) {
        const blob = doc.output("blob");
        const arquivoPDF = new File([blob], arquivo, { type: "application/pdf" });

        // Android e iPhone usam primeiro o mesmo compartilhamento nativo do sistema.
        // Assim o usuário pode escolher WhatsApp, Drive, e-mail, imprimir ou salvar.
        if (await compartilharPeloSistema(arquivoPDF)) return;

        // Compatibilidade com APKs Android que oferecem uma ponte nativa de compartilhamento.
        const base64 = doc.output("datauristring");
        if (window.AndroidPdf && typeof window.AndroidPdf.compartilharPdf === "function") {
            try {
                window.AndroidPdf.compartilharPdf(base64, arquivo);
                return;
            } catch (erro) {
                console.error("Erro ao compartilhar PDF pelo Android:", erro);
            }
        }

        // Ponte antiga: mantida apenas como último recurso para não quebrar versões anteriores.
        if (window.AndroidPdf && typeof window.AndroidPdf.imprimirPdf === "function") {
            try {
                window.AndroidPdf.imprimirPdf(base64, arquivo);
                return;
            } catch (erro) {
                console.error("Erro ao abrir PDF pelo Android:", erro);
            }
        }

        // Último recurso: abre o PDF pronto, sem transformar o relatório em imagem.
        const url = URL.createObjectURL(blob);
        const novaJanela = window.open(url, "_blank");

        if (!novaJanela) {
            const link = document.createElement("a");
            link.href = url;
            link.download = arquivo;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        setTimeout(() => URL.revokeObjectURL(url), 180000);
    }

    async function exportarMensal(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        if (!verificarBiblioteca()) return;

        const ano = Number($("anoRelatorio")?.value);
        const mes = Number($("mesRelatorio")?.value);
        const lista = obterVendas().filter((venda) => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === ano && data.getMonth() === mes;
        });

        if (!lista.length) {
            alert(`Nenhuma venda encontrada em ${MESES[mes]} de ${ano}.`);
            return;
        }

        const titulo = `Relatório mensal — ${MESES[mes]} de ${ano}`;
        const doc = criarDocumento(titulo);
        const resultado = adicionarTabela(doc, lista, `${MESES[mes]} de ${ano}`, 38);

        doc.setDrawColor(0, 59, 142);
        doc.setLineWidth(0.6);
        doc.line(180, resultado.fimY + 5, 283, resultado.fimY + 5);
        doc.setFontSize(13);
        doc.text(`TOTAL GERAL: ${moeda(resultado.total)}`, 283, resultado.fimY + 13, { align: "right" });

        await entregarPDF(doc, `relatorio_${nomeArquivo(MESES[mes])}_${ano}.pdf`);
    }

    async function exportarAnual(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        if (!verificarBiblioteca()) return;

        const ano = Number($("anoRelatorio")?.value);
        const listaAno = obterVendas().filter((venda) => dataLocal(venda.data)?.getFullYear() === ano);

        if (!listaAno.length) {
            alert(`Nenhuma venda encontrada no ano de ${ano}.`);
            return;
        }

        const doc = criarDocumento(`Relatório anual completo — ${ano}`);
        let totalGeral = 0;
        let primeiroMes = true;

        for (let mes = 0; mes < 12; mes++) {
            const listaMes = listaAno.filter((venda) => dataLocal(venda.data)?.getMonth() === mes);
            if (!listaMes.length) continue;

            if (!primeiroMes) doc.addPage("a4", "landscape");
            const resultado = adicionarTabela(doc, listaMes, `${MESES[mes]} de ${ano}`, primeiroMes ? 38 : 18);
            totalGeral += resultado.total;
            primeiroMes = false;
        }

        let y = doc.lastAutoTable.finalY + 18;
        const altura = doc.internal.pageSize.getHeight();
        if (y > altura - 20) {
            doc.addPage("a4", "landscape");
            y = 25;
        }

        doc.setDrawColor(0, 59, 142);
        doc.setLineWidth(0.8);
        doc.line(165, y - 7, 283, y - 7);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(0, 59, 142);
        doc.text(`TOTAL GERAL DO ANO: ${moeda(totalGeral)}`, 283, y, { align: "right" });

        await entregarPDF(doc, `relatorio_anual_${ano}.pdf`);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const mensal = $("exportarPDFMes");
        const anual = $("exportarPDFTodos");

        if (mensal) {
            mensal.replaceWith(mensal.cloneNode(true));
            $("exportarPDFMes").addEventListener("click", exportarMensal, true);
        }

        if (anual) {
            anual.replaceWith(anual.cloneNode(true));
            $("exportarPDFTodos").addEventListener("click", exportarAnual, true);
        }
    });
})();
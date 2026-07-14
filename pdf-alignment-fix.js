(function () {
    function aplicar() {
        const jsPDF = window.jspdf?.jsPDF;
        if (!jsPDF?.API || jsPDF.API.__alinhamentoSamuelAplicado) return;

        const api = jsPDF.API;
        const autoTableOriginal = api.autoTable;
        const lineOriginal = api.line;

        if (typeof autoTableOriginal === "function") {
            api.autoTable = function (opcoes) {
                const cabecalho = opcoes?.head?.[0];
                if (Array.isArray(cabecalho) && cabecalho.length === 5) {
                    opcoes = {
                        ...opcoes,
                        margin: { ...(opcoes.margin || {}), left: 14, right: 14 },
                        styles: {
                            ...(opcoes.styles || {}),
                            valign: "middle",
                            overflow: "linebreak",
                            minCellHeight: 7
                        },
                        columnStyles: {
                            ...(opcoes.columnStyles || {}),
                            0: { ...(opcoes.columnStyles?.[0] || {}), cellWidth: 25 },
                            1: { ...(opcoes.columnStyles?.[1] || {}), cellWidth: 50 },
                            2: { ...(opcoes.columnStyles?.[2] || {}), cellWidth: 85 },
                            3: { ...(opcoes.columnStyles?.[3] || {}), cellWidth: 50 },
                            4: { ...(opcoes.columnStyles?.[4] || {}), cellWidth: 59, halign: "right" }
                        }
                    };
                }
                return autoTableOriginal.call(this, opcoes);
            };
        }

        if (typeof lineOriginal === "function") {
            api.line = function (x1, y1, x2, y2) {
                if ((x1 === 180 || x1 === 165) && x2 === 283) x1 = 14;
                return lineOriginal.apply(this, [x1, y1, x2, y2].concat([].slice.call(arguments, 4)));
            };
        }

        api.__alinhamentoSamuelAplicado = true;
    }

    document.addEventListener("DOMContentLoaded", aplicar);
    aplicar();
})();

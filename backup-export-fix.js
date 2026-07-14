(function () {
    const STORAGE = "samuel_comissoes_pro";

    function dadosBackup() {
        let vendas = [];
        try {
            const dados = JSON.parse(localStorage.getItem(STORAGE) || "[]");
            vendas = Array.isArray(dados) ? dados : [];
        } catch (erro) {
            console.error("Erro ao preparar backup:", erro);
        }

        return JSON.stringify({
            aplicativo: "Controle de Vendas PRO",
            versaoBackup: 1,
            geradoEm: new Date().toISOString(),
            vendas
        }, null, 2);
    }

    async function exportarBackup(evento) {
        evento?.preventDefault();
        evento?.stopImmediatePropagation();

        const conteudo = dadosBackup();
        const nome = `backup_controle_vendas_${new Date().toISOString().slice(0, 10)}.json`;

        if (window.AndroidPdf && typeof window.AndroidPdf.compartilharBackup === "function") {
            try {
                window.AndroidPdf.compartilharBackup(conteudo, nome);
                return;
            } catch (erro) {
                console.error("Falha ao exportar backup pelo Android:", erro);
            }
        }

        const blob = new Blob([conteudo], { type: "application/json" });
        const arquivo = new File([blob], nome, { type: "application/json" });

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [arquivo] }))) {
                await navigator.share({ title: "Backup do Controle de Vendas PRO", files: [arquivo] });
                return;
            }
        } catch (erro) {
            if (erro?.name === "AbortError") return;
            console.warn("Compartilhamento de backup indisponível:", erro);
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nome;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    function conectar() {
        const botao = document.getElementById("exportarBackup");
        if (!botao) return;
        const novo = botao.cloneNode(true);
        botao.replaceWith(novo);
        novo.addEventListener("click", exportarBackup, true);
    }

    document.addEventListener("DOMContentLoaded", conectar);
})();

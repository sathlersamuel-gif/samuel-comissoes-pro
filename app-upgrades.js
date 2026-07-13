(function () {
    const DB_NAME = "samuel_comissoes_pro_db";
    const DB_VERSION = 1;
    const STORE_NAME = "dados";
    const STORAGE_KEY = "samuel_comissoes_pro";
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function abrirBanco() {
        return new Promise((resolve, reject) => {
            const requisicao = indexedDB.open(DB_NAME, DB_VERSION);

            requisicao.onupgradeneeded = function () {
                const banco = requisicao.result;
                if (!banco.objectStoreNames.contains(STORE_NAME)) {
                    banco.createObjectStore(STORE_NAME);
                }
            };

            requisicao.onsuccess = () => resolve(requisicao.result);
            requisicao.onerror = () => reject(requisicao.error);
        });
    }

    async function salvarNoBancoInterno(lista) {
        try {
            const banco = await abrirBanco();
            const transacao = banco.transaction(STORE_NAME, "readwrite");
            transacao.objectStore(STORE_NAME).put(lista, "vendas");
        } catch (erro) {
            console.warn("Não foi possível salvar a cópia interna:", erro);
        }
    }

    async function lerBancoInterno() {
        try {
            const banco = await abrirBanco();
            return await new Promise((resolve, reject) => {
                const transacao = banco.transaction(STORE_NAME, "readonly");
                const requisicao = transacao.objectStore(STORE_NAME).get("vendas");
                requisicao.onsuccess = () => resolve(requisicao.result || []);
                requisicao.onerror = () => reject(requisicao.error);
            });
        } catch (erro) {
            console.warn("Não foi possível ler a cópia interna:", erro);
            return [];
        }
    }

    function reforcarSalvamento() {
        if (typeof salvarBanco !== "function") return;

        const salvarOriginal = salvarBanco;
        window.salvarBanco = function () {
            salvarOriginal();
            salvarNoBancoInterno(vendas || []);
        };
    }

    async function restaurarCopiaInternaSeNecessario() {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const interno = await lerBancoInterno();

        if (Array.isArray(local) && local.length > 0) {
            salvarNoBancoInterno(local);
            return;
        }

        if (Array.isArray(interno) && interno.length > 0) {
            vendas = interno;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
            if (typeof atualizarDashboard === "function") atualizarDashboard();
            if (typeof carregarHistorico === "function") carregarHistorico();
        }
    }

    function dataLocal(dataTexto) {
        const partes = String(dataTexto || "").split("-").map(Number);
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

    window.carregarHistorico = function () {
        const lista = document.getElementById("listaMeses");
        const detalhes = document.getElementById("detalhesMes");
        if (!lista) return;

        if (detalhes) detalhes.style.display = "none";
        lista.style.display = "block";

        const vendasValidas = (vendas || []).filter(venda => dataLocal(venda.data));
        const anos = [...new Set(vendasValidas.map(venda => dataLocal(venda.data).getFullYear()))]
            .sort((a, b) => b - a);

        if (!anos.length) {
            lista.innerHTML = "<p style='text-align:center;padding:24px'>Nenhuma venda cadastrada.</p>";
            return;
        }

        lista.innerHTML = anos.map(ano => {
            const meses = MESES.map((nome, mes) => {
                const vendasMes = vendasValidas.filter(venda => {
                    const data = dataLocal(venda.data);
                    return data.getFullYear() === ano && data.getMonth() === mes;
                });

                if (!vendasMes.length) return "";

                const total = vendasMes.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
                return `
                    <button class="mes" onclick="abrirMesAno(${ano}, ${mes})" style="width:100%;text-align:left;margin-bottom:10px">
                        <strong>${nome}</strong><br>
                        ${vendasMes.length} venda(s) — ${moedaLocal(total)}
                    </button>`;
            }).join("");

            return `
                <section style="margin-bottom:24px">
                    <h2 style="margin:10px 0;color:#003b8e">${ano}</h2>
                    ${meses}
                </section>`;
        }).join("");
    };

    window.abrirMesAno = function (ano, mes) {
        const listaMeses = document.getElementById("listaMeses");
        const detalhes = document.getElementById("detalhesMes");
        const titulo = document.getElementById("tituloMes");
        const conteudo = document.getElementById("listaVendasMes");
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
                    ${dataLocal(venda.data).toLocaleDateString("pt-BR")} — ${moedaLocal(venda.valor)}
                </div>`).join("")}`;

        if (listaMeses) listaMeses.style.display = "none";
        detalhes.style.display = "block";
    };

    window.fecharDetalhes = function () {
        const listaMeses = document.getElementById("listaMeses");
        const detalhes = document.getElementById("detalhesMes");
        if (listaMeses) listaMeses.style.display = "block";
        if (detalhes) detalhes.style.display = "none";
    };

    function melhorarExportacaoBackup() {
        const botao = document.getElementById("exportarBackup");
        if (!botao) return;

        botao.onclick = function () {
            const agora = new Date();
            const backup = {
                aplicativo: "Samuel Comissões PRO",
                versao: 2,
                exportadoEm: agora.toISOString(),
                totalVendas: (vendas || []).length,
                vendas: vendas || []
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `backup-samuel-comissoes-${agora.toISOString().slice(0, 10)}.json`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        };
    }

    document.addEventListener("DOMContentLoaded", function () {
        reforcarSalvamento();
        restaurarCopiaInternaSeNecessario();
        melhorarExportacaoBackup();
        carregarHistorico();
    });
})();
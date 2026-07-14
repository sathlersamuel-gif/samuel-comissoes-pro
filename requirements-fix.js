(function () {
    const STORAGE_KEY = "samuel_comissoes_pro";
    let edicaoId = null;
    const $id = id => document.getElementById(id);

    function dataLocal(texto) {
        const partes = String(texto || "").split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function valorNumero(valor) {
        if (typeof valor === "number") return valor;
        return Number(String(valor || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
    }

    function percentualNumero(valor) {
        return Number(String(valor || "0").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
    }

    function moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function escapar(texto) {
        return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function persistir() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas || []));
        if (typeof salvarBanco === "function") salvarBanco();
    }

    window.atualizarDashboard = function () {
        const hoje = new Date();
        const lista = (vendas || []).filter(venda => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
        });
        const total = lista.reduce((soma, venda) => soma + Number(venda.valor || 0), 0);
        const comissao = lista.reduce((soma, venda) => soma + Number(venda.comissao || 0), 0);
        if ($id("dashboardTotal")) $id("dashboardTotal").textContent = moeda(total);
        if ($id("dashboardComissao")) $id("dashboardComissao").textContent = moeda(comissao);
        if ($id("dashboardQtd")) $id("dashboardQtd").textContent = String(lista.length);
    };

    const carregarHistoricoOriginal = window.carregarHistorico;
    window.carregarHistorico = function () {
        if (typeof carregarHistoricoOriginal === "function") carregarHistoricoOriginal();
        aplicarBusca();
    };

    function aplicarBusca() {
        const termo = String($id("pesquisaHistorico")?.value || "").trim().toLowerCase();
        document.querySelectorAll("#listaMeses .mes").forEach(botao => {
            if (!termo) { botao.style.display = "block"; return; }
            const textoBotao = botao.textContent.toLowerCase();
            const numeros = (botao.getAttribute("onclick") || "").match(/abrirMesAno\((\d+),\s*(\d+)\)/);
            if (!numeros) { botao.style.display = textoBotao.includes(termo) ? "block" : "none"; return; }
            const ano = Number(numeros[1]);
            const mes = Number(numeros[2]);
            const encontrou = (vendas || []).some(venda => {
                const data = dataLocal(venda.data);
                if (!data || data.getFullYear() !== ano || data.getMonth() !== mes) return false;
                return [venda.cliente, venda.produto, venda.modelo, venda.telefone, venda.tipo]
                    .some(valor => String(valor || "").toLowerCase().includes(termo));
            });
            botao.style.display = encontrou || textoBotao.includes(termo) ? "block" : "none";
        });
    }

    function limparFormulario() {
        $id("formVenda")?.reset();
        if ($id("comissao")) $id("comissao").value = "";
        edicaoId = null;
        const botao = document.querySelector("#formVenda button[type='submit']");
        if (botao) botao.textContent = "SALVAR VENDA";
    }

    window.editarVendaSegura = function (id) {
        const venda = (vendas || []).find(item => Number(item.id) === Number(id));
        if (!venda) return;
        edicaoId = Number(id);
        abrirTela("novaVenda");
        $id("cliente").value = venda.cliente || "";
        $id("telefone").value = venda.telefone || "";
        $id("produto").value = venda.produto || venda.modelo || "";
        $id("tipoVenda").value = venda.tipo || venda.tipoVenda || "À Vista";
        $id("valorVenda").value = Number(venda.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        $id("porcentagem").value = String(venda.porcentagem || "").replace(".", ",");
        $id("dataVenda").value = venda.data || "";
        $id("observacao").value = venda.observacao || "";
        if (typeof calcularComissao === "function") calcularComissao();
        const botao = document.querySelector("#formVenda button[type='submit']");
        if (botao) botao.textContent = "SALVAR ALTERAÇÕES";
    };

    function salvarVenda(evento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        const foiEdicao = edicaoId !== null;
        const valor = valorNumero($id("valorVenda")?.value);
        const porcentagem = percentualNumero($id("porcentagem")?.value);
        const agora = new Date();
        const dados = {
            cliente: $id("cliente")?.value.trim() || "",
            telefone: $id("telefone")?.value.trim() || "",
            produto: $id("produto")?.value.trim() || "",
            tipo: $id("tipoVenda")?.value || "À Vista",
            valor,
            porcentagem,
            comissao: valor * porcentagem / 100,
            data: $id("dataVenda")?.value || agora.toISOString().slice(0, 10),
            horario: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            atualizadoEm: agora.toISOString(),
            observacao: $id("observacao")?.value.trim() || ""
        };
        if (foiEdicao) {
            const indice = (vendas || []).findIndex(item => Number(item.id) === edicaoId);
            if (indice >= 0) vendas[indice] = { ...vendas[indice], ...dados };
        } else {
            vendas.push({ id: Date.now(), criadoEm: agora.toISOString(), ...dados });
        }
        persistir();
        atualizarDashboard();
        if (typeof carregarHistoricoOriginal === "function") carregarHistoricoOriginal();
        limparFormulario();
        alert(foiEdicao ? "Venda atualizada com sucesso!" : "Venda salva com sucesso!");
        abrirTela("dashboard");
    }

    const abrirMesOriginal = window.abrirMesAno;
    window.abrirMesAno = function (ano, mes) {
        if (typeof abrirMesOriginal === "function") abrirMesOriginal(ano, mes);
        const conteudo = $id("listaVendasMes");
        if (!conteudo) return;
        const lista = (vendas || []).filter(venda => {
            const data = dataLocal(venda.data);
            return data && data.getFullYear() === Number(ano) && data.getMonth() === Number(mes);
        }).sort((a, b) => String(a.data).localeCompare(String(b.data)));
        conteudo.querySelectorAll(".card").forEach((card, indice) => {
            const venda = lista[indice];
            if (!venda || !venda.horario) return;
            const extras = document.createElement("div");
            extras.style.marginTop = "6px";
            extras.style.fontSize = "13px";
            extras.innerHTML = `Horário: ${escapar(venda.horario)}`;
            const botoes = card.querySelector("div[style*='display:flex']");
            card.insertBefore(extras, botoes || null);
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        atualizarDashboard();
        $id("pesquisaHistorico")?.addEventListener("input", aplicarBusca);
        $id("formVenda")?.addEventListener("submit", salvarVenda, true);
        if ($id("dataVenda")) $id("dataVenda").value = $id("dataVenda").value || new Date().toISOString().slice(0, 10);
    });
})();
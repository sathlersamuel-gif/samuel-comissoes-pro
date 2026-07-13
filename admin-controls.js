(function () {
    const ADMIN_EMAIL = "sathlersamuel@gmail.com";
    const WHATSAPP_ADMIN = "5569984810587";

    function getFirebase() {
        if (!window.firebase || !firebase.apps.length) return null;
        return {
            auth: firebase.auth(),
            db: firebase.firestore()
        };
    }

    function garantirEstilos() {
        if (document.getElementById("adminControlsStyles")) return;
        const style = document.createElement("style");
        style.id = "adminControlsStyles";
        style.textContent = `
            .btn-excluir-usuario{background:#7f1d1d!important}
            .status-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;text-transform:capitalize}
            .status-ativo{background:#dcfce7;color:#166534}.status-pendente{background:#fef3c7;color:#92400e}.status-bloqueado{background:#fee2e2;color:#991b1b}
            #btnWhatsappBloqueado{display:none;width:100%;margin:12px 0 8px;border:none;border-radius:14px;padding:15px;background:#25d366;color:#fff;font-size:16px;font-weight:800;text-decoration:none;text-align:center}
            #painelUsuarios{padding-top:calc(18px + env(safe-area-inset-top))!important;-webkit-overflow-scrolling:touch}
            #painelUsuarios .painel-topo{position:sticky;top:0;z-index:20;background:#f3f6fb;padding:6px 0 14px;margin-bottom:12px!important}
            #fecharPainelUsuarios{min-width:112px!important;width:auto!important;min-height:50px!important;padding:12px 18px!important;border-radius:14px!important;font-size:17px!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
            #fecharPainelUsuarios:active{transform:scale(.97)}
            @media (display-mode:standalone){#painelUsuarios{padding-top:calc(22px + env(safe-area-inset-top))!important}}
        `;
        document.head.appendChild(style);
    }

    async function excluirUsuario(uid, email) {
        const fb = getFirebase();
        if (!fb) return alert("Firebase ainda não carregou.");
        const atual = fb.auth.currentUser;
        if (!atual || String(atual.email || "").toLowerCase() !== ADMIN_EMAIL) {
            return alert("Somente o administrador pode excluir usuários.");
        }

        const confirmado = confirm(`Excluir o cadastro de ${email || "este usuário"}?\n\nOs dados salvos desse usuário serão removidos. Ele poderá enviar um novo pedido de acesso depois.`);
        if (!confirmado) return;

        try {
            await fb.db.collection("usuarios").doc(uid).delete();
            alert("Usuário excluído com sucesso.");
            const painel = document.getElementById("painelUsuarios");
            if (painel && painel.style.display !== "none" && typeof window.aprovarUsuario === "function") {
                const botaoGerenciar = document.getElementById("adminUsuariosBtn");
                if (botaoGerenciar) botaoGerenciar.click();
            }
        } catch (erro) {
            console.error("Erro ao excluir usuário:", erro);
            alert("Não foi possível excluir o usuário.");
        }
    }

    function aprimorarListaUsuarios() {
        const lista = document.getElementById("listaUsuarios");
        if (!lista) return;

        lista.querySelectorAll(".usuario-card").forEach(card => {
            if (card.dataset.adminAprimorado === "1") return;

            const emailEl = card.querySelector("p strong");
            const email = emailEl ? emailEl.textContent.trim() : "";
            const botoes = card.querySelector(".usuario-acoes");
            if (!botoes) return;

            const aprovar = botoes.querySelector("[onclick*='aprovarUsuario']");
            const uidMatch = aprovar && aprovar.getAttribute("onclick").match(/'([^']+)'/);
            const uid = uidMatch ? uidMatch[1] : "";
            if (!uid) return;

            const statusP = Array.from(card.querySelectorAll("p")).find(p => p.textContent.includes("Status:"));
            if (statusP) {
                const status = statusP.textContent.replace("Status:", "").trim().toLowerCase();
                statusP.innerHTML = `Status atual: <span class="status-chip status-${status}">${status === "ativo" ? "Aprovado" : status}</span>`;
            }

            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.className = "btn-excluir-usuario";
            excluir.textContent = "🗑️ Excluir";
            excluir.addEventListener("click", () => excluirUsuario(uid, email));
            botoes.appendChild(excluir);
            card.dataset.adminAprimorado = "1";
        });
    }

    function prepararWhatsappBloqueado() {
        const card = document.getElementById("firebaseAuthCard");
        if (!card || document.getElementById("btnWhatsappBloqueado")) return;

        const link = document.createElement("a");
        link.id = "btnWhatsappBloqueado";
        link.href = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent("Olá, Samuel. Meu acesso ao Samuel Comissões PRO está bloqueado. Gostaria de regularizar.")}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "💬 Falar com Samuel no WhatsApp";

        const botaoSair = document.getElementById("btnSairPendente");
        card.insertBefore(link, botaoSair || null);
    }

    function atualizarWhatsappBloqueado() {
        const texto = document.getElementById("authTexto");
        const link = document.getElementById("btnWhatsappBloqueado");
        if (!texto || !link) return;
        const bloqueado = texto.textContent.toLowerCase().includes("bloqueado");
        link.style.display = bloqueado ? "block" : "none";
    }

    function garantirVoltarPainel() {
        const painel = document.getElementById("painelUsuarios");
        const botao = document.getElementById("fecharPainelUsuarios");
        if (!painel || !botao || botao.dataset.voltarCorrigido === "1") return;

        const fechar = (evento) => {
            if (evento) {
                evento.preventDefault();
                evento.stopPropagation();
            }
            painel.style.display = "none";
            window.scrollTo({ top: 0, behavior: "instant" });
        };

        botao.dataset.voltarCorrigido = "1";
        botao.addEventListener("click", fechar, { passive: false });
        botao.addEventListener("touchend", fechar, { passive: false });

        let inicioX = 0;
        painel.addEventListener("touchstart", e => {
            inicioX = e.changedTouches[0].clientX;
        }, { passive: true });
        painel.addEventListener("touchend", e => {
            const fimX = e.changedTouches[0].clientX;
            if (inicioX < 35 && fimX - inicioX > 90) fechar(e);
        }, { passive: false });
    }

    function iniciar() {
        garantirEstilos();
        prepararWhatsappBloqueado();
        aprimorarListaUsuarios();
        atualizarWhatsappBloqueado();
        garantirVoltarPainel();

        const observer = new MutationObserver(() => {
            prepararWhatsappBloqueado();
            aprimorarListaUsuarios();
            atualizarWhatsappBloqueado();
            garantirVoltarPainel();
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
(function () {
    const STORAGE_KEY = "samuel_install_guide_seen_v1";

    function standalone() {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }

    function plataforma() {
        const ua = navigator.userAgent || "";
        if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
        if (/Android/i.test(ua)) return "android";
        return "outro";
    }

    function estilos() {
        if (document.getElementById("installGuideStyles")) return;
        const style = document.createElement("style");
        style.id = "installGuideStyles";
        style.textContent = `
            #installGuide{position:fixed;inset:0;z-index:30000;background:rgba(2,9,22,.92);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px}
            #installGuideCard{width:min(430px,100%);background:linear-gradient(160deg,#0b1f3b,#081426);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
            #installGuideCard h2{font-size:24px;margin:0 0 8px}#installGuideCard>p{color:#c7d2e5;line-height:1.45;margin-bottom:18px}
            .install-step{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.06);border-radius:15px;padding:13px;margin-bottom:10px}
            .install-step b{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#1769e0;flex:none}.install-step span{line-height:1.4;color:#e7edf7}
            #installGuideClose,#installGuideAction{width:100%;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:800;margin-top:10px;cursor:pointer}
            #installGuideClose{background:#1769e0;color:#fff}#installGuideAction{background:#25d366;color:#fff;display:none}
            #installHelpBtn{width:100%;border:none;border-radius:12px;padding:12px;background:#eef3fb;color:#003b8e;font-weight:800;margin-top:2px;cursor:pointer}
            .install-note{font-size:12px;color:#91a4bd;text-align:center;margin-top:12px}
        `;
        document.head.appendChild(style);
    }

    function conteudo() {
        const tipo = plataforma();
        if (tipo === "ios") {
            return `
                <div class="install-step"><b>1</b><span>Abra este link pelo <strong>Safari</strong>.</span></div>
                <div class="install-step"><b>2</b><span>Toque no botão <strong>Compartilhar</strong> na barra do Safari.</span></div>
                <div class="install-step"><b>3</b><span>Escolha <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>.</span></div>`;
        }
        if (tipo === "android") {
            return `
                <div class="install-step"><b>1</b><span>Abra o menu do navegador.</span></div>
                <div class="install-step"><b>2</b><span>Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</span></div>
                <div class="install-step"><b>3</b><span>Confirme a instalação.</span></div>`;
        }
        return `<div class="install-step"><b>1</b><span>Abra o menu do navegador e procure por <strong>Instalar</strong> ou <strong>Adicionar à tela inicial</strong>.</span></div>`;
    }

    function criarModal() {
        if (document.getElementById("installGuide")) return;
        const modal = document.createElement("div");
        modal.id = "installGuide";
        modal.innerHTML = `
            <div id="installGuideCard">
                <h2>📲 Acesso mais rápido</h2>
                <p>Adicione o Samuel Comissões PRO à Tela de Início para abrir em tela cheia e acessar com apenas um toque.</p>
                <div id="installGuideSteps">${conteudo()}</div>
                <button id="installGuideAction">Instalar agora</button>
                <button id="installGuideClose">Entendi, continuar</button>
                <div class="install-note">Você poderá abrir esta orientação novamente na tela de acesso.</div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById("installGuideClose").onclick = () => {
            localStorage.setItem(STORAGE_KEY, "1");
            modal.style.display = "none";
        };
        modal.addEventListener("click", event => {
            if (event.target === modal) modal.style.display = "none";
        });
    }

    function abrirGuia() {
        criarModal();
        document.getElementById("installGuide").style.display = "flex";
    }

    function adicionarBotaoLogin() {
        const card = document.getElementById("firebaseAuthCard");
        if (!card || document.getElementById("installHelpBtn")) return;
        const botao = document.createElement("button");
        botao.id = "installHelpBtn";
        botao.type = "button";
        botao.textContent = "📲 Como adicionar à Tela de Início";
        botao.onclick = abrirGuia;
        const mensagem = document.getElementById("authMensagem");
        card.insertBefore(botao, mensagem || null);
    }

    function iniciar() {
        estilos();
        criarModal();
        adicionarBotaoLogin();

        const observer = new MutationObserver(adicionarBotaoLogin);
        observer.observe(document.body, { childList: true, subtree: true });

        if (!standalone() && localStorage.getItem(STORAGE_KEY) !== "1") {
            setTimeout(abrirGuia, 1100);
        }
    }

    window.abrirGuiaInstalacao = abrirGuia;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
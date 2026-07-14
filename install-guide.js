(function () {
    const STORAGE_KEY = "samuel_install_guide_seen_v2";
    const WHATSAPP_URL = "https://wa.me/5569984810587?text=Ol%C3%A1%20Samuel%2C%20preciso%20de%20ajuda%20com%20o%20Comiss%C3%B5es%20PRO.";
    const APK_URL = "https://raw.githubusercontent.com/sathlersamuel-gif/samuel-comissoes-pro/main/downloads/Samuel-Comissoes-PRO.apk";

    function standalone() {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }

    function plataforma() {
        const ua = navigator.userAgent || "";
        if (/SamuelComissoesPRO-Android/i.test(ua)) return "apk";
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
            #installGuideCard{width:min(430px,100%);max-height:90vh;overflow:auto;background:linear-gradient(160deg,#0b1f3b,#081426);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
            #installGuideCard h2{font-size:24px;margin:0 0 8px}#installGuideCard>p{color:#c7d2e5;line-height:1.45;margin-bottom:18px}
            .install-step{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.06);border-radius:15px;padding:13px;margin-bottom:10px}
            .install-step b{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#1769e0;flex:none}.install-step span{line-height:1.4;color:#e7edf7}
            #installGuideClose,#installAndroidBtn,#installWhatsBtn{width:100%;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:800;margin-top:10px;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px}
            #installGuideClose{background:#1769e0;color:#fff}#installAndroidBtn{background:#18a957;color:#fff}#installWhatsBtn{background:#25d366;color:#fff}
            #installHelpBtn{width:100%;border:none;border-radius:12px;padding:12px;background:#eef3fb;color:#003b8e;font-weight:800;margin-top:8px;cursor:pointer}
            .install-note{font-size:12px;color:#91a4bd;text-align:center;margin-top:12px}
        `;
        document.head.appendChild(style);
    }

    function conteudo() {
        const tipo = plataforma();
        if (tipo === "ios") {
            return `
                <div class="install-step"><b>1</b><span>Abra este link pelo <strong>Safari</strong>.</span></div>
                <div class="install-step"><b>2</b><span>Toque no botão <strong>Compartilhar</strong>.</span></div>
                <div class="install-step"><b>3</b><span>Escolha <strong>Adicionar à Tela de Início</strong>.</span></div>`;
        }
        if (tipo === "android") {
            return `<div class="install-step"><b>✓</b><span>Toque no botão verde abaixo para baixar o aplicativo Android.</span></div>`;
        }
        if (tipo === "apk") {
            return `<div class="install-step"><b>✓</b><span>Você já está usando o aplicativo Android.</span></div>`;
        }
        return `<div class="install-step"><b>1</b><span>No iPhone, use o Safari. No Android, toque no botão de download abaixo.</span></div>`;
    }

    function criarModal() {
        if (document.getElementById("installGuide")) return;
        const modal = document.createElement("div");
        modal.id = "installGuide";
        modal.innerHTML = `
            <div id="installGuideCard">
                <h2>📲 Instalar Comissões PRO</h2>
                <p>Escolha a forma de acesso para abrir como aplicativo.</p>
                <div id="installGuideSteps">${conteudo()}</div>
                <a id="installAndroidBtn" href="${APK_URL}" download="Samuel-Comissoes-PRO.apk">🤖 Baixar aplicativo para Android</a>
                <a id="installWhatsBtn" href="${WHATSAPP_URL}" target="_blank" rel="noopener">💬 Falar com Samuel no WhatsApp</a>
                <button id="installGuideClose">Continuar no sistema</button>
                <div class="install-note">No iPhone, adicione pela Tela de Início do Safari.</div>
            </div>`;
        document.body.appendChild(modal);
        if (plataforma() === "apk") document.getElementById("installAndroidBtn").style.display = "none";
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
        botao.textContent = "📲 Instalar aplicativo / Ajuda";
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
        if (!standalone() && plataforma() !== "apk" && localStorage.getItem(STORAGE_KEY) !== "1") {
            setTimeout(abrirGuia, 900);
        }
    }

    window.abrirGuiaInstalacao = abrirGuia;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
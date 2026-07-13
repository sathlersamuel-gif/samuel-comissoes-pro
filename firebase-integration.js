(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyC7kLlmbU3mAWeyDj_oPKAWsJTU1QU_QjQ",
        authDomain: "samuel-comissoes-pro.firebaseapp.com",
        projectId: "samuel-comissoes-pro",
        storageBucket: "samuel-comissoes-pro.firebasestorage.app",
        messagingSenderId: "217399693317",
        appId: "1:217399693317:web:fa4d7971cf4e869cbc4c6c",
        measurementId: "G-BVHF6K0X81"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    auth.useDeviceLanguage();

    let usuarioAtual = null;
    let sincronizando = false;

    function criarTelaAcesso() {
        if (document.getElementById("firebaseAuthOverlay")) return;
        const estilo = document.createElement("style");
        estilo.textContent = `
            #firebaseAuthOverlay{position:fixed;inset:0;background:#f3f6fb;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
            #firebaseAuthCard{width:min(420px,100%);background:#fff;border-radius:20px;padding:24px;box-shadow:0 12px 35px rgba(0,0,0,.18)}
            #firebaseAuthCard h2{color:#003b8e;text-align:center;margin-bottom:8px}
            #firebaseAuthCard p{text-align:center;color:#666;margin-bottom:18px}
            #firebaseAuthCard input{width:100%;margin-bottom:12px}
            .auth-primary,.auth-secondary,.auth-link{width:100%;border:none;border-radius:12px;padding:14px;font-size:16px;font-weight:bold;margin-bottom:10px;cursor:pointer}
            .auth-primary{background:#003b8e;color:#fff}.auth-secondary{background:#0b7a2d;color:#fff}.auth-link{background:#eef3fb;color:#003b8e}
            #authMensagem{min-height:22px;text-align:center;font-size:14px;color:#b00020;margin-top:5px;overflow-wrap:anywhere}
            #firebaseUserBar{display:none;background:#fff;padding:10px 14px;border-radius:12px;margin:12px 18px;box-shadow:0 2px 8px rgba(0,0,0,.08);font-size:14px;align-items:center;justify-content:space-between;gap:10px}
            #firebaseUserBar button{border:none;background:#d62828;color:#fff;padding:8px 12px;border-radius:8px}
        `;
        document.head.appendChild(estilo);

        const overlay = document.createElement("div");
        overlay.id = "firebaseAuthOverlay";
        overlay.innerHTML = `
            <div id="firebaseAuthCard">
                <h2>Samuel Comissões PRO</h2>
                <p>Entre para acessar e sincronizar seus dados.</p>
                <input id="authEmail" type="email" placeholder="Seu e-mail" autocomplete="email">
                <input id="authSenha" type="password" placeholder="Sua senha" autocomplete="current-password">
                <button id="btnEntrar" class="auth-primary">Entrar</button>
                <button id="btnCadastrar" class="auth-secondary">Criar conta</button>
                <button id="btnRecuperar" class="auth-link">Esqueci minha senha</button>
                <div id="authMensagem"></div>
            </div>`;
        document.body.appendChild(overlay);

        const barra = document.createElement("div");
        barra.id = "firebaseUserBar";
        barra.innerHTML = `<span id="firebaseUserEmail"></span><button id="btnSairFirebase">Sair</button>`;
        document.body.insertBefore(barra, document.querySelector("main"));

        document.getElementById("btnEntrar").onclick = entrar;
        document.getElementById("btnCadastrar").onclick = cadastrar;
        document.getElementById("btnRecuperar").onclick = recuperarSenha;
        document.getElementById("btnSairFirebase").onclick = () => auth.signOut();
    }

    function mensagem(texto, sucesso) {
        const campo = document.getElementById("authMensagem");
        if (!campo) return;
        campo.style.color = sucesso ? "#0b7a2d" : "#b00020";
        campo.textContent = texto;
    }

    function dadosAcesso() {
        return {
            email: document.getElementById("authEmail").value.trim(),
            senha: document.getElementById("authSenha").value
        };
    }

    async function entrar() {
        const { email, senha } = dadosAcesso();
        if (!email || !senha) return mensagem("Informe o e-mail e a senha.");
        try {
            mensagem("Entrando...", true);
            await auth.signInWithEmailAndPassword(email, senha);
        } catch (erro) {
            console.error("Erro ao entrar:", erro);
            mensagem(traduzirErro(erro));
        }
    }

    async function cadastrar() {
        const { email, senha } = dadosAcesso();
        if (!email || senha.length < 6) return mensagem("Use um e-mail válido e uma senha com pelo menos 6 caracteres.");
        try {
            mensagem("Criando conta...", true);
            const credencial = await auth.createUserWithEmailAndPassword(email, senha);
            await credencial.user.sendEmailVerification();
            mensagem("Conta criada. Enviamos um e-mail de confirmação.", true);
        } catch (erro) {
            console.error("Erro ao criar conta:", erro);
            mensagem(traduzirErro(erro));
        }
    }

    async function recuperarSenha() {
        const email = document.getElementById("authEmail").value.trim();
        if (!email) return mensagem("Digite seu e-mail primeiro.");
        try {
            await auth.sendPasswordResetEmail(email);
            mensagem("Enviamos o link para redefinir sua senha.", true);
        } catch (erro) {
            console.error("Erro ao redefinir senha:", erro);
            mensagem(traduzirErro(erro));
        }
    }

    function traduzirErro(erro) {
        const codigo = erro && erro.code ? erro.code : "";
        const erros = {
            "auth/email-already-in-use": "Este e-mail já possui uma conta. Use Entrar ou Esqueci minha senha.",
            "auth/invalid-email": "E-mail inválido.",
            "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
            "auth/user-not-found": "Conta não encontrada.",
            "auth/wrong-password": "Senha incorreta.",
            "auth/invalid-credential": "E-mail ou senha incorretos.",
            "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
            "auth/network-request-failed": "Falha de internet. Verifique a conexão e tente novamente.",
            "auth/unauthorized-domain": "Este endereço ainda não está autorizado no Firebase.",
            "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "A chave do Firebase continua inválida no Google Cloud."
        };
        return erros[codigo] || `Não foi possível concluir${codigo ? ` (${codigo})` : ""}.`;
    }

    function documentoUsuario() {
        return db.collection("usuarios").doc(usuarioAtual.uid);
    }

    function unirVendas(local, nuvem) {
        const mapa = new Map();
        [...(nuvem || []), ...(local || [])].forEach(venda => {
            const id = String(venda.id || `${venda.data}-${venda.cliente}-${venda.valor}`);
            mapa.set(id, venda);
        });
        return [...mapa.values()].sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")));
    }

    async function sincronizarInicial() {
        if (!usuarioAtual || sincronizando) return;
        sincronizando = true;
        try {
            const snap = await documentoUsuario().get();
            const vendasNuvem = snap.exists && Array.isArray(snap.data().vendas) ? snap.data().vendas : [];
            const vendasLocais = Array.isArray(vendas) ? vendas : [];
            vendas = unirVendas(vendasLocais, vendasNuvem);
            localStorage.setItem("samuel_comissoes_pro", JSON.stringify(vendas));
            await documentoUsuario().set({
                email: usuarioAtual.email,
                vendas,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            if (typeof atualizarDashboard === "function") atualizarDashboard();
            if (typeof carregarHistorico === "function") carregarHistorico();
        } catch (erro) {
            console.error("Erro na sincronização inicial:", erro);
            alert("Login realizado, mas não foi possível sincronizar com a nuvem.");
        } finally {
            sincronizando = false;
        }
    }

    async function salvarNaNuvem() {
        if (!usuarioAtual || sincronizando) return;
        try {
            await documentoUsuario().set({
                email: usuarioAtual.email,
                vendas: Array.isArray(vendas) ? vendas : [],
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (erro) {
            console.error("Erro ao salvar na nuvem:", erro);
        }
    }

    function integrarSalvamento() {
        if (typeof salvarBanco !== "function" || window.__firebaseSalvamentoIntegrado) return;
        window.__firebaseSalvamentoIntegrado = true;
        const original = salvarBanco;
        window.salvarBanco = function () {
            original();
            salvarNaNuvem();
        };
    }

    criarTelaAcesso();

    auth.onAuthStateChanged(async user => {
        usuarioAtual = user;
        const overlay = document.getElementById("firebaseAuthOverlay");
        const barra = document.getElementById("firebaseUserBar");
        if (user) {
            overlay.style.display = "none";
            barra.style.display = "flex";
            document.getElementById("firebaseUserEmail").textContent = user.email;
            integrarSalvamento();
            await sincronizarInicial();
        } else {
            overlay.style.display = "flex";
            barra.style.display = "none";
        }
    });
})();
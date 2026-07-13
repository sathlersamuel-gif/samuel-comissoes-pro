(function () {
    const ADMIN_EMAIL = "sathlersamuel@gmail.com";
    const APP_URL = "https://sathlersamuel-gif.github.io/samuel-comissoes-pro/";

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
            #adminUsuariosBtn{width:100%;border:none;border-radius:16px;background:#5b2ca0;color:#fff;padding:18px;font-size:18px;font-weight:bold;cursor:pointer}
            #painelUsuarios{position:fixed;inset:0;background:#f3f6fb;z-index:10000;display:none;overflow:auto;padding:18px}
            #painelUsuarios .painel-conteudo{max-width:650px;margin:auto}
            #painelUsuarios .painel-topo{display:flex;align-items:center;gap:12px;margin-bottom:18px}
            #painelUsuarios .painel-topo button{border:none;background:#003b8e;color:#fff;border-radius:10px;padding:10px 14px}
            .usuario-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,0,0,.08)}
            .usuario-card p{margin:5px 0;overflow-wrap:anywhere}
            .usuario-acoes{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
            .usuario-acoes button{border:none;border-radius:10px;padding:10px 12px;color:#fff;font-weight:bold}
            .btn-aprovar{background:#0b7a2d}.btn-bloquear{background:#d62828}.btn-pendente{background:#b26a00}
        `;
        document.head.appendChild(estilo);

        const overlay = document.createElement("div");
        overlay.id = "firebaseAuthOverlay";
        overlay.innerHTML = `
            <div id="firebaseAuthCard">
                <h2>Samuel Comissões PRO</h2>
                <p id="authTexto">Entre para acessar e sincronizar seus dados.</p>
                <input id="authEmail" type="email" placeholder="Seu e-mail" autocomplete="email">
                <input id="authSenha" type="password" placeholder="Sua senha" autocomplete="current-password">
                <button id="btnEntrar" class="auth-primary">Entrar</button>
                <button id="btnCadastrar" class="auth-secondary">Criar conta</button>
                <button id="btnRecuperar" class="auth-link">Esqueci minha senha</button>
                <button id="btnSairPendente" class="auth-link" style="display:none">Sair</button>
                <div id="authMensagem"></div>
            </div>`;
        document.body.appendChild(overlay);

        const barra = document.createElement("div");
        barra.id = "firebaseUserBar";
        barra.innerHTML = `<span id="firebaseUserEmail"></span><button id="btnSairFirebase">Sair</button>`;
        document.body.insertBefore(barra, document.querySelector("main"));

        const painel = document.createElement("div");
        painel.id = "painelUsuarios";
        painel.innerHTML = `
            <div class="painel-conteudo">
                <div class="painel-topo"><button id="fecharPainelUsuarios">← Voltar</button><h2>Gerenciar usuários</h2></div>
                <div id="listaUsuarios"><p>Carregando...</p></div>
            </div>`;
        document.body.appendChild(painel);

        document.getElementById("btnEntrar").onclick = entrar;
        document.getElementById("btnCadastrar").onclick = cadastrar;
        document.getElementById("btnRecuperar").onclick = recuperarSenha;
        document.getElementById("btnSairFirebase").onclick = () => auth.signOut();
        document.getElementById("btnSairPendente").onclick = () => auth.signOut();
        document.getElementById("fecharPainelUsuarios").onclick = () => painel.style.display = "none";
    }

    function mensagem(texto, sucesso) {
        const campo = document.getElementById("authMensagem");
        if (!campo) return;
        campo.style.color = sucesso ? "#0b7a2d" : "#b00020";
        campo.textContent = texto;
    }

    function modoLogin() {
        document.getElementById("authTexto").textContent = "Entre para acessar e sincronizar seus dados.";
        document.getElementById("authEmail").style.display = "block";
        document.getElementById("authSenha").style.display = "block";
        document.getElementById("btnEntrar").style.display = "block";
        document.getElementById("btnCadastrar").style.display = "block";
        document.getElementById("btnRecuperar").style.display = "block";
        document.getElementById("btnSairPendente").style.display = "none";
    }

    function modoBloqueado(status) {
        const texto = status === "bloqueado"
            ? "Seu acesso foi bloqueado pelo administrador."
            : "Cadastro realizado. Seu acesso está aguardando aprovação do Samuel.";
        document.getElementById("authTexto").textContent = texto;
        document.getElementById("authEmail").style.display = "none";
        document.getElementById("authSenha").style.display = "none";
        document.getElementById("btnEntrar").style.display = "none";
        document.getElementById("btnCadastrar").style.display = "none";
        document.getElementById("btnRecuperar").style.display = "none";
        document.getElementById("btnSairPendente").style.display = "block";
        mensagem(status === "bloqueado" ? "Entre em contato com o administrador." : "Você será liberado após a aprovação.", status !== "bloqueado");
    }

    function dadosAcesso() {
        return {
            email: document.getElementById("authEmail").value.trim().toLowerCase(),
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
            const user = credencial.user;
            const status = email === ADMIN_EMAIL ? "ativo" : "pendente";

            await db.collection("usuarios").doc(user.uid).set({
                uid: user.uid,
                email,
                status,
                vendas: [],
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            await user.sendEmailVerification();

            if (status === "pendente") {
                await criarPedidoAprovacao(user.uid, email);
                modoBloqueado("pendente");
            } else {
                mensagem("Conta de administrador criada.", true);
            }
        } catch (erro) {
            console.error("Erro ao criar conta:", erro);
            mensagem(traduzirErro(erro));
        }
    }

    async function criarPedidoAprovacao(uid, email) {
        const link = `${APP_URL}?aprovarUsuario=${encodeURIComponent(uid)}`;
        await db.collection("mail").add({
            to: ADMIN_EMAIL,
            userUid: uid,
            message: {
                subject: "Novo usuário aguardando aprovação",
                html: `<h2>Novo cadastro no Samuel Comissões PRO</h2><p><strong>E-mail:</strong> ${email}</p><p><a href="${link}" style="display:inline-block;background:#0b7a2d;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px">Abrir e aprovar usuário</a></p><p>Somente o administrador autenticado poderá concluir a aprovação.</p>`
            }
        });
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
            "auth/unauthorized-domain": "Este endereço ainda não está autorizado no Firebase."
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

    function adicionarBotaoAdministrador() {
        if (document.getElementById("adminUsuariosBtn")) return;
        const menu = document.querySelector("#dashboard .menu");
        if (!menu) return;
        const botao = document.createElement("button");
        botao.id = "adminUsuariosBtn";
        botao.textContent = "👥 Gerenciar usuários";
        botao.onclick = abrirPainelUsuarios;
        menu.appendChild(botao);
    }

    async function abrirPainelUsuarios() {
        document.getElementById("painelUsuarios").style.display = "block";
        await carregarUsuarios();
    }

    async function carregarUsuarios() {
        const lista = document.getElementById("listaUsuarios");
        lista.innerHTML = "<p>Carregando...</p>";
        try {
            const snap = await db.collection("usuarios").orderBy("email").get();
            const docs = snap.docs.filter(doc => doc.data().email !== ADMIN_EMAIL);
            if (!docs.length) {
                lista.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
                return;
            }
            lista.innerHTML = docs.map(doc => {
                const u = doc.data();
                const status = u.status || "pendente";
                return `<div class="usuario-card">
                    <p><strong>${u.email || "Sem e-mail"}</strong></p>
                    <p>Status: <strong>${status}</strong></p>
                    <div class="usuario-acoes">
                        <button class="btn-aprovar" onclick="window.aprovarUsuario('${doc.id}')">Aprovar</button>
                        <button class="btn-pendente" onclick="window.penderUsuario('${doc.id}')">Pendente</button>
                        <button class="btn-bloquear" onclick="window.bloquearUsuario('${doc.id}')">Bloquear</button>
                    </div>
                </div>`;
            }).join("");
        } catch (erro) {
            console.error(erro);
            lista.innerHTML = "<p>Não foi possível carregar os usuários.</p>";
        }
    }

    async function alterarStatus(uid, status) {
        await db.collection("usuarios").doc(uid).set({
            status,
            aprovadoPor: usuarioAtual.email,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        await carregarUsuarios();
        alert(status === "ativo" ? "Usuário aprovado com sucesso!" : `Usuário marcado como ${status}.`);
    }

    window.aprovarUsuario = uid => alterarStatus(uid, "ativo");
    window.penderUsuario = uid => alterarStatus(uid, "pendente");
    window.bloquearUsuario = uid => alterarStatus(uid, "bloqueado");

    async function tratarLinkAprovacao() {
        const uid = new URLSearchParams(location.search).get("aprovarUsuario");
        if (!uid || !usuarioAtual || usuarioAtual.email.toLowerCase() !== ADMIN_EMAIL) return;
        if (confirm("Aprovar este usuário para acessar o aplicativo?")) {
            await alterarStatus(uid, "ativo");
        }
        history.replaceState({}, document.title, location.pathname);
    }

    criarTelaAcesso();

    auth.onAuthStateChanged(async user => {
        usuarioAtual = user;
        const overlay = document.getElementById("firebaseAuthOverlay");
        const barra = document.getElementById("firebaseUserBar");

        if (!user) {
            modoLogin();
            overlay.style.display = "flex";
            barra.style.display = "none";
            return;
        }

        const email = (user.email || "").toLowerCase();
        let snap = await db.collection("usuarios").doc(user.uid).get();

        if (!snap.exists) {
            await db.collection("usuarios").doc(user.uid).set({
                uid: user.uid,
                email,
                status: email === ADMIN_EMAIL ? "ativo" : "pendente",
                vendas: [],
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            snap = await db.collection("usuarios").doc(user.uid).get();
        }

        if (email === ADMIN_EMAIL && snap.data().status !== "ativo") {
            await db.collection("usuarios").doc(user.uid).set({ status: "ativo" }, { merge: true });
        }

        const status = email === ADMIN_EMAIL ? "ativo" : (snap.data().status || "pendente");
        if (status !== "ativo") {
            modoBloqueado(status);
            overlay.style.display = "flex";
            barra.style.display = "none";
            return;
        }

        overlay.style.display = "none";
        barra.style.display = "flex";
        document.getElementById("firebaseUserEmail").textContent = user.email;
        integrarSalvamento();
        await sincronizarInicial();

        if (email === ADMIN_EMAIL) {
            adicionarBotaoAdministrador();
            await tratarLinkAprovacao();
        }
    });
})();
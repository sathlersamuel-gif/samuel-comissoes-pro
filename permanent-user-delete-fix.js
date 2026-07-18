(function () {
  "use strict";

  const ADMIN_EMAIL = "sathlersamuel@gmail.com";
  const STATUS_EXCLUIDO = "excluido";
  let firebasePronto = false;
  let limpezaAgendada = null;

  function iniciarFirebase() {
    if (!window.firebase || !firebase.apps || !firebase.apps.length) return false;
    firebasePronto = true;
    return true;
  }

  function auth() {
    return firebase.auth();
  }

  function db() {
    return firebase.firestore();
  }

  function emailAtual() {
    return String(auth().currentUser?.email || "").trim().toLowerCase();
  }

  function usuarioEhAdmin() {
    return emailAtual() === ADMIN_EMAIL;
  }

  async function excluirDefinitivamente(uid, email) {
    if (!usuarioEhAdmin()) {
      alert("Somente o administrador pode excluir usuários.");
      return;
    }

    const nome = email || "este usuário";
    if (!confirm(`Tem certeza que deseja excluir ${nome}?\n\nO acesso será bloqueado definitivamente, as vendas serão apagadas e o cadastro não voltará sozinho.`)) return;

    try {
      const ref = db().collection("usuarios").doc(uid);
      const snap = await ref.get();
      const anterior = snap.exists ? snap.data() : {};

      await ref.set({
        uid,
        email: String(anterior.email || email || "").trim().toLowerCase(),
        status: STATUS_EXCLUIDO,
        vendas: [],
        vendasExcluidas: [],
        totalAcessos: 0,
        ultimoDispositivo: firebase.firestore.FieldValue.delete(),
        ultimoAcesso: firebase.firestore.FieldValue.delete(),
        expiraEm: firebase.firestore.FieldValue.delete(),
        acessoIniciadoEm: firebase.firestore.FieldValue.delete(),
        periodoQuantidade: firebase.firestore.FieldValue.delete(),
        periodoUnidade: firebase.firestore.FieldValue.delete(),
        excluidoEm: firebase.firestore.FieldValue.serverTimestamp(),
        excluidoPor: emailAtual(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      removerCardDaTela(uid, email);
      await ocultarUsuariosExcluidos();
      alert("Usuário excluído definitivamente. Ele não poderá voltar nem ser recriado automaticamente.");
    } catch (erro) {
      console.error("Erro na exclusão definitiva:", erro);
      alert("Não foi possível concluir a exclusão definitiva. Tente novamente.");
    }
  }

  function removerCardDaTela(uid, email) {
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;
    lista.querySelectorAll('[data-uid]').forEach(botao => {
      if (String(botao.dataset.uid) === String(uid)) botao.closest("article, .usuario-card")?.remove();
    });
    if (email) {
      lista.querySelectorAll(".usuario-email").forEach(el => {
        if (el.textContent.trim().toLowerCase() === String(email).trim().toLowerCase()) el.closest("article, .usuario-card")?.remove();
      });
    }
  }

  async function ocultarUsuariosExcluidos() {
    if (!firebasePronto || !usuarioEhAdmin()) return;
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;

    try {
      const snap = await db().collection("usuarios").where("status", "==", STATUS_EXCLUIDO).get();
      const excluidos = new Map();
      snap.docs.forEach(doc => excluidos.set(doc.id, String(doc.data().email || "").toLowerCase()));

      lista.querySelectorAll('[data-uid]').forEach(botao => {
        if (excluidos.has(String(botao.dataset.uid))) botao.closest("article, .usuario-card")?.remove();
      });
      lista.querySelectorAll(".usuario-email").forEach(el => {
        const email = el.textContent.trim().toLowerCase();
        if ([...excluidos.values()].includes(email)) el.closest("article, .usuario-card")?.remove();
      });
    } catch (erro) {
      console.warn("Não foi possível ocultar os usuários excluídos:", erro);
    }
  }

  function agendarLimpeza() {
    clearTimeout(limpezaAgendada);
    limpezaAgendada = setTimeout(ocultarUsuariosExcluidos, 250);
  }

  function instalarInterceptadorExclusao() {
    document.addEventListener("click", function (evento) {
      const botao = evento.target.closest && evento.target.closest('[data-acao="excluir"][data-uid]');
      if (!botao) return;
      evento.preventDefault();
      evento.stopPropagation();
      evento.stopImmediatePropagation();
      excluirDefinitivamente(botao.dataset.uid, botao.dataset.email || "");
    }, true);

    document.addEventListener("click", function (evento) {
      if (evento.target.closest && evento.target.closest("#adminUsuariosBtn")) {
        setTimeout(agendarLimpeza, 350);
        setTimeout(agendarLimpeza, 1100);
      }
    }, true);
  }

  function observarListaUsuarios() {
    const conectar = () => {
      const lista = document.getElementById("listaUsuarios");
      if (!lista) return setTimeout(conectar, 400);
      new MutationObserver(agendarLimpeza).observe(lista, { childList: true, subtree: true });
      agendarLimpeza();
    };
    conectar();
  }

  function bloquearUsuarioExcluido(user) {
    const overlay = document.getElementById("firebaseAuthOverlay");
    const texto = document.getElementById("authTexto");
    const mensagem = document.getElementById("authMensagem");
    const barra = document.getElementById("firebaseUserBar");

    if (texto) texto.textContent = "Esta conta foi excluída definitivamente pelo administrador.";
    if (mensagem) {
      mensagem.textContent = "Acesso removido.";
      mensagem.style.color = "#b00020";
    }
    if (overlay) overlay.style.display = "flex";
    if (barra) barra.style.display = "none";
    ["authEmail", "authSenha", "btnEntrar", "btnCadastrar", "btnRecuperar"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    const sair = document.getElementById("btnSairPendente");
    if (sair) sair.style.display = "block";

    setTimeout(() => auth().signOut().catch(() => {}), 500);
  }

  function protegerContraRecriacao() {
    auth().onAuthStateChanged(async user => {
      if (!user || String(user.email || "").toLowerCase() === ADMIN_EMAIL) return;
      try {
        const snap = await db().collection("usuarios").doc(user.uid).get();
        if (snap.exists && snap.data().status === STATUS_EXCLUIDO) bloquearUsuarioExcluido(user);
      } catch (erro) {
        console.warn("Falha ao verificar exclusão definitiva:", erro);
      }
    });
  }

  function iniciar() {
    if (!iniciarFirebase()) return setTimeout(iniciar, 300);
    instalarInterceptadorExclusao();
    observarListaUsuarios();
    protegerContraRecriacao();
    window.excluirUsuarioDefinitivamente = excluirDefinitivamente;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();

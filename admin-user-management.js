(function () {
  "use strict";

  const ADMIN_EMAIL = "sathlersamuel@gmail.com";
  const AVISOS_DIAS = [30, 15, 7, 3, 1];
  let auth = null;
  let db = null;
  let usuarioAtual = null;
  let usuariosCache = [];

  function iniciarFirebase() {
    if (!window.firebase || !firebase.apps.length) return false;
    auth = firebase.auth();
    db = firebase.firestore();
    return true;
  }

  function dataFirebase(valor) {
    if (!valor) return null;
    if (typeof valor.toDate === "function") return valor.toDate();
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(valor, incluirHora) {
    const data = dataFirebase(valor);
    if (!data) return "Não informado";
    return new Intl.DateTimeFormat("pt-BR", incluirHora ? {
      dateStyle: "short",
      timeStyle: "short"
    } : { dateStyle: "short" }).format(data);
  }

  function diferencaDias(dataFinal) {
    const final = dataFirebase(dataFinal);
    if (!final) return null;
    return Math.ceil((final.getTime() - Date.now()) / 86400000);
  }

  function escapar(texto) {
    return String(texto || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function garantirEstilos() {
    if (document.getElementById("adminUserManagementStyles")) return;
    const style = document.createElement("style");
    style.id = "adminUserManagementStyles";
    style.textContent = `
      #painelUsuarios{background:linear-gradient(180deg,#eef3fb 0%,#f7f9fc 100%)!important}
      #painelUsuarios .painel-conteudo{max-width:900px!important}
      #painelUsuarios .painel-topo{background:rgba(238,243,251,.94)!important;backdrop-filter:blur(14px);padding:10px 0 16px!important}
      #painelUsuarios .painel-topo h2{margin:0;color:#071b3d;font-size:clamp(22px,5vw,30px)}
      .usuarios-resumo{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 16px}
      .usuarios-resumo-card{background:#fff;border:1px solid #e3eaf4;border-radius:18px;padding:15px;box-shadow:0 8px 24px rgba(18,49,93,.07)}
      .usuarios-resumo-card span{display:block;color:#6b7890;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
      .usuarios-resumo-card strong{display:block;color:#071b3d;font-size:27px;line-height:1.1;margin-top:5px}
      .usuarios-filtros{display:flex;gap:8px;overflow:auto;padding:2px 0 14px;scrollbar-width:none}
      .usuarios-filtros::-webkit-scrollbar{display:none}
      .usuarios-filtro{white-space:nowrap;border:1px solid #d8e1ef;background:#fff;color:#41506a;padding:10px 14px;border-radius:999px;font-weight:800;cursor:pointer}
      .usuarios-filtro.ativo{background:#083b82;color:#fff;border-color:#083b82}
      .usuario-card.moderno{border:1px solid #e0e8f3;border-radius:22px!important;padding:18px!important;box-shadow:0 10px 28px rgba(18,49,93,.08)!important;position:relative;overflow:hidden}
      .usuario-card.moderno::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--status-cor,#0b7a2d)}
      .usuario-cabecalho{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
      .usuario-email{font-size:16px;color:#071b3d;font-weight:900;overflow-wrap:anywhere}
      .usuario-subtexto{font-size:12px;color:#7b8799;margin-top:3px}
      .usuario-grade{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0}
      .usuario-info{background:#f4f7fb;border-radius:14px;padding:11px;min-width:0}
      .usuario-info span{display:block;font-size:11px;color:#728097;font-weight:800;text-transform:uppercase}
      .usuario-info strong{display:block;color:#172b4d;font-size:14px;margin-top:4px;overflow-wrap:anywhere}
      .usuario-progresso{margin:13px 0 5px}
      .usuario-progresso-topo{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#647188;margin-bottom:6px}
      .usuario-progresso-barra{height:8px;background:#e5ebf4;border-radius:999px;overflow:hidden}
      .usuario-progresso-preenchimento{height:100%;background:var(--status-cor,#0b7a2d);border-radius:999px;transition:width .25s ease}
      .usuario-acoes.modernas{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px!important;margin-top:16px!important}
      .usuario-acoes.modernas button{min-height:43px;padding:9px!important;border-radius:12px!important;font-size:12px!important;cursor:pointer;transition:transform .15s ease,filter .15s ease}
      .usuario-acoes.modernas button:active{transform:scale(.97)}
      .btn-prazo{background:#1455a0!important}.btn-renovar{background:#5b2ca0!important}.btn-desbloquear{background:#0b7a2d!important}.btn-excluir-novo{background:#941f2b!important}
      .status-chip.status-teste{background:#e8efff;color:#174c96}.status-chip.status-expirando{background:#fff2cc;color:#875900}.status-chip.status-vencido{background:#ffe1e3;color:#9f1d2b}
      #modalPrazoUsuario{position:fixed;inset:0;background:rgba(4,15,34,.68);z-index:11000;display:none;align-items:center;justify-content:center;padding:18px}
      #modalPrazoUsuario .modal-card{width:min(480px,100%);background:#fff;border-radius:24px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.3)}
      #modalPrazoUsuario h3{margin:0 0 5px;color:#071b3d}.modal-email{color:#6e7a8f;overflow-wrap:anywhere;margin-bottom:18px}
      .modal-linha{display:grid;grid-template-columns:1fr 1fr;gap:10px}.modal-campo{margin-bottom:13px}.modal-campo label{display:block;font-size:12px;font-weight:800;color:#526079;margin-bottom:6px}.modal-campo input,.modal-campo select{width:100%;border:1px solid #cfd9e7;border-radius:12px;padding:12px;font-size:16px;background:#fff}
      .modal-acoes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}.modal-acoes button{border:0;border-radius:13px;padding:13px;font-weight:900}.modal-cancelar{background:#e9eef6;color:#33435e}.modal-salvar{background:#083b82;color:#fff}
      #avisoExpiracaoAcesso{position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:9998;max-width:620px;margin:auto;background:#fff4cf;border:1px solid #efce63;color:#6d4b00;border-radius:16px;padding:13px 44px 13px 15px;box-shadow:0 10px 30px rgba(75,52,0,.16);font-weight:800}
      #avisoExpiracaoAcesso button{position:absolute;right:8px;top:7px;border:0;background:transparent;font-size:22px;color:#6d4b00}
      @media(max-width:720px){.usuarios-resumo{grid-template-columns:repeat(2,1fr)}.usuario-grade{grid-template-columns:repeat(2,1fr)}.usuario-acoes.modernas{grid-template-columns:repeat(2,1fr)}.usuario-acoes.modernas button:last-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function garantirModal() {
    if (document.getElementById("modalPrazoUsuario")) return;
    const modal = document.createElement("div");
    modal.id = "modalPrazoUsuario";
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalPrazoTitulo">
        <h3 id="modalPrazoTitulo">Configurar acesso</h3>
        <div class="modal-email" id="modalPrazoEmail"></div>
        <input type="hidden" id="modalPrazoUid">
        <div class="modal-linha">
          <div class="modal-campo"><label for="modalPrazoQuantidade">Quantidade</label><input id="modalPrazoQuantidade" type="number" min="1" value="3" inputmode="numeric"></div>
          <div class="modal-campo"><label for="modalPrazoUnidade">Período</label><select id="modalPrazoUnidade"><option value="dias">Dias</option><option value="meses" selected>Meses</option><option value="anos">Anos</option></select></div>
        </div>
        <div class="modal-campo"><label for="modalPrazoInicio">Início do acesso</label><input id="modalPrazoInicio" type="date"></div>
        <div class="modal-campo"><label><input id="modalPrazoIlimitado" type="checkbox" style="width:auto;margin-right:7px"> Acesso sem data de vencimento</label></div>
        <div class="modal-acoes"><button class="modal-cancelar" type="button">Cancelar</button><button class="modal-salvar" type="button">Salvar acesso</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".modal-cancelar").onclick = fecharModal;
    modal.querySelector(".modal-salvar").onclick = salvarPrazo;
    modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
  }

  function hojeInput() {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    return agora.toISOString().slice(0, 10);
  }

  function abrirModal(uid) {
    const usuario = usuariosCache.find(item => item.id === uid);
    if (!usuario) return;
    document.getElementById("modalPrazoUid").value = uid;
    document.getElementById("modalPrazoEmail").textContent = usuario.email || "Usuário";
    document.getElementById("modalPrazoQuantidade").value = 3;
    document.getElementById("modalPrazoUnidade").value = "meses";
    document.getElementById("modalPrazoInicio").value = hojeInput();
    document.getElementById("modalPrazoIlimitado").checked = !usuario.expiraEm;
    document.getElementById("modalPrazoUsuario").style.display = "flex";
  }

  function fecharModal() {
    const modal = document.getElementById("modalPrazoUsuario");
    if (modal) modal.style.display = "none";
  }

  function calcularVencimento(inicio, quantidade, unidade) {
    const data = new Date(`${inicio}T12:00:00`);
    if (unidade === "dias") data.setDate(data.getDate() + quantidade);
    if (unidade === "meses") data.setMonth(data.getMonth() + quantidade);
    if (unidade === "anos") data.setFullYear(data.getFullYear() + quantidade);
    data.setHours(23, 59, 59, 999);
    return data;
  }

  async function salvarPrazo() {
    const uid = document.getElementById("modalPrazoUid").value;
    const ilimitado = document.getElementById("modalPrazoIlimitado").checked;
    const inicio = document.getElementById("modalPrazoInicio").value || hojeInput();
    const quantidade = Math.max(1, Number(document.getElementById("modalPrazoQuantidade").value || 1));
    const unidade = document.getElementById("modalPrazoUnidade").value;
    const dados = {
      status: "ativo",
      acessoIniciadoEm: firebase.firestore.Timestamp.fromDate(new Date(`${inicio}T00:00:00`)),
      expiraEm: ilimitado ? firebase.firestore.FieldValue.delete() : firebase.firestore.Timestamp.fromDate(calcularVencimento(inicio, quantidade, unidade)),
      periodoQuantidade: ilimitado ? null : quantidade,
      periodoUnidade: ilimitado ? "ilimitado" : unidade,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      aprovadoPor: usuarioAtual.email
    };
    try {
      await db.collection("usuarios").doc(uid).set(dados, { merge: true });
      fecharModal();
      await carregarGerenciamento();
      alert(ilimitado ? "Acesso ilimitado liberado." : `Acesso liberado por ${quantidade} ${unidade}.`);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível salvar o prazo de acesso.");
    }
  }

  async function renovar(uid) {
    const usuario = usuariosCache.find(item => item.id === uid);
    if (!usuario) return;
    const quantidade = Math.max(1, Number(usuario.periodoQuantidade || 3));
    const unidade = usuario.periodoUnidade && usuario.periodoUnidade !== "ilimitado" ? usuario.periodoUnidade : "meses";
    const vencimentoAtual = dataFirebase(usuario.expiraEm);
    const base = vencimentoAtual && vencimentoAtual > new Date() ? vencimentoAtual : new Date();
    const novaData = calcularVencimento(base.toISOString().slice(0, 10), quantidade, unidade);
    try {
      await db.collection("usuarios").doc(uid).set({
        status: "ativo",
        expiraEm: firebase.firestore.Timestamp.fromDate(novaData),
        renovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await carregarGerenciamento();
      alert(`Acesso renovado por mais ${quantidade} ${unidade}.`);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível renovar o acesso.");
    }
  }

  async function alterarStatus(uid, status) {
    try {
      await db.collection("usuarios").doc(uid).set({ status, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await carregarGerenciamento();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível alterar o usuário.");
    }
  }

  async function excluir(uid, email) {
    if (!confirm(`Tem certeza que deseja excluir ${email || "este usuário"}?\n\nAs vendas e os dados salvos serão removidos. Essa ação não poderá ser desfeita.`)) return;
    try {
      await db.collection("usuarios").doc(uid).delete();
      await carregarGerenciamento();
      alert("Usuário excluído com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível excluir o usuário.");
    }
  }

  function statusVisual(usuario) {
    const status = usuario.status || "pendente";
    if (status === "bloqueado") return { chave: "bloqueado", texto: "Bloqueado", cor: "#b32635" };
    if (status === "pendente") return { chave: "pendente", texto: "Pendente", cor: "#b26a00" };
    const dias = diferencaDias(usuario.expiraEm);
    if (dias !== null && dias < 0) return { chave: "vencido", texto: "Vencido", cor: "#b32635" };
    if (dias !== null && dias <= 7) return { chave: "expirando", texto: "Expirando", cor: "#b26a00" };
    if (usuario.expiraEm) return { chave: "teste", texto: "Em teste", cor: "#1455a0" };
    return { chave: "ativo", texto: "Ativo", cor: "#0b7a2d" };
  }

  function usoDescricao(usuario) {
    const ultimo = dataFirebase(usuario.ultimoAcesso);
    if (!ultimo) return "Ainda não utilizou";
    const dias = Math.floor((Date.now() - ultimo.getTime()) / 86400000);
    if (dias <= 0) return "Usou hoje";
    if (dias === 1) return "Usou ontem";
    if (dias <= 7) return `Usou há ${dias} dias`;
    return `Sem uso há ${dias} dias`;
  }

  function progressoPrazo(usuario) {
    const inicio = dataFirebase(usuario.acessoIniciadoEm) || dataFirebase(usuario.criadoEm);
    const fim = dataFirebase(usuario.expiraEm);
    if (!inicio || !fim) return 100;
    const total = fim - inicio;
    if (total <= 0) return 100;
    return Math.max(0, Math.min(100, ((Date.now() - inicio) / total) * 100));
  }

  function renderizarResumo(usuarios) {
    const contagem = { total: usuarios.length, ativos: 0, expirando: 0, semUso: 0 };
    usuarios.forEach(u => {
      const st = statusVisual(u).chave;
      if (["ativo", "teste"].includes(st)) contagem.ativos++;
      if (st === "expirando") contagem.expirando++;
      const ultimo = dataFirebase(u.ultimoAcesso);
      if (!ultimo || Date.now() - ultimo.getTime() > 7 * 86400000) contagem.semUso++;
    });
    return `<div class="usuarios-resumo">
      <div class="usuarios-resumo-card"><span>Total</span><strong>${contagem.total}</strong></div>
      <div class="usuarios-resumo-card"><span>Ativos</span><strong>${contagem.ativos}</strong></div>
      <div class="usuarios-resumo-card"><span>Expirando</span><strong>${contagem.expirando}</strong></div>
      <div class="usuarios-resumo-card"><span>Sem uso</span><strong>${contagem.semUso}</strong></div>
    </div>`;
  }

  function renderizarCards(filtro) {
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;
    let usuarios = usuariosCache;
    if (filtro && filtro !== "todos") usuarios = usuarios.filter(u => {
      const st = statusVisual(u).chave;
      if (filtro === "ativos") return ["ativo", "teste"].includes(st);
      if (filtro === "vencimento") return ["expirando", "vencido"].includes(st);
      if (filtro === "bloqueados") return ["bloqueado", "pendente"].includes(st);
      if (filtro === "semuso") {
        const ultimo = dataFirebase(u.ultimoAcesso);
        return !ultimo || Date.now() - ultimo.getTime() > 7 * 86400000;
      }
      return true;
    });

    const filtros = `<div class="usuarios-filtros">
      <button class="usuarios-filtro ${!filtro || filtro === "todos" ? "ativo" : ""}" data-filtro="todos">Todos</button>
      <button class="usuarios-filtro ${filtro === "ativos" ? "ativo" : ""}" data-filtro="ativos">Ativos</button>
      <button class="usuarios-filtro ${filtro === "vencimento" ? "ativo" : ""}" data-filtro="vencimento">Próximos do vencimento</button>
      <button class="usuarios-filtro ${filtro === "semuso" ? "ativo" : ""}" data-filtro="semuso">Sem uso</button>
      <button class="usuarios-filtro ${filtro === "bloqueados" ? "ativo" : ""}" data-filtro="bloqueados">Bloqueados</button>
    </div>`;

    const cards = usuarios.length ? usuarios.map(u => {
      const st = statusVisual(u);
      const dias = diferencaDias(u.expiraEm);
      const vendas = Array.isArray(u.vendas) ? u.vendas.length : 0;
      const acessos = Number(u.totalAcessos || 0);
      const prazo = u.expiraEm ? `${formatarData(u.expiraEm)}${dias !== null ? ` (${dias >= 0 ? dias + " dias" : "vencido"})` : ""}` : "Sem vencimento";
      const botaoStatus = u.status === "bloqueado"
        ? `<button class="btn-desbloquear" data-acao="desbloquear" data-uid="${u.id}">Desbloquear</button>`
        : `<button class="btn-bloquear" data-acao="bloquear" data-uid="${u.id}">Bloquear</button>`;
      return `<article class="usuario-card moderno" style="--status-cor:${st.cor}">
        <div class="usuario-cabecalho"><div><div class="usuario-email">${escapar(u.email || "Sem e-mail")}</div><div class="usuario-subtexto">Cadastrado em ${formatarData(u.criadoEm)}</div></div><span class="status-chip status-${st.chave}">${st.texto}</span></div>
        <div class="usuario-grade">
          <div class="usuario-info"><span>Uso</span><strong>${usoDescricao(u)}</strong></div>
          <div class="usuario-info"><span>Último acesso</span><strong>${formatarData(u.ultimoAcesso, true)}</strong></div>
          <div class="usuario-info"><span>Acessos</span><strong>${acessos}</strong></div>
          <div class="usuario-info"><span>Vendas salvas</span><strong>${vendas}</strong></div>
          <div class="usuario-info" style="grid-column:1/-1"><span>Acesso válido até</span><strong>${prazo}</strong></div>
        </div>
        ${u.expiraEm ? `<div class="usuario-progresso"><div class="usuario-progresso-topo"><span>Período utilizado</span><strong>${Math.round(progressoPrazo(u))}%</strong></div><div class="usuario-progresso-barra"><div class="usuario-progresso-preenchimento" style="width:${progressoPrazo(u)}%"></div></div></div>` : ""}
        <div class="usuario-acoes modernas">
          <button class="btn-prazo" data-acao="prazo" data-uid="${u.id}">Editar prazo</button>
          <button class="btn-renovar" data-acao="renovar" data-uid="${u.id}">Renovar</button>
          ${botaoStatus}
          <button class="btn-pendente" data-acao="pendente" data-uid="${u.id}">Pendente</button>
          <button class="btn-excluir-novo" data-acao="excluir" data-uid="${u.id}" data-email="${escapar(u.email)}">Excluir</button>
        </div>
      </article>`;
    }).join("") : `<div class="usuario-card"><p>Nenhum usuário encontrado neste filtro.</p></div>`;

    lista.innerHTML = renderizarResumo(usuariosCache) + filtros + cards;
    lista.querySelectorAll("[data-filtro]").forEach(btn => btn.onclick = () => renderizarCards(btn.dataset.filtro));
    lista.querySelectorAll("[data-acao]").forEach(btn => btn.onclick = () => {
      const uid = btn.dataset.uid;
      if (btn.dataset.acao === "prazo") abrirModal(uid);
      if (btn.dataset.acao === "renovar") renovar(uid);
      if (btn.dataset.acao === "bloquear") alterarStatus(uid, "bloqueado");
      if (btn.dataset.acao === "desbloquear") alterarStatus(uid, "ativo");
      if (btn.dataset.acao === "pendente") alterarStatus(uid, "pendente");
      if (btn.dataset.acao === "excluir") excluir(uid, btn.dataset.email);
    });
  }

  async function carregarGerenciamento() {
    if (!usuarioAtual || String(usuarioAtual.email || "").toLowerCase() !== ADMIN_EMAIL) return;
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;
    lista.innerHTML = "<p>Carregando informações de uso...</p>";
    try {
      const snap = await db.collection("usuarios").orderBy("email").get();
      usuariosCache = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => String(u.email || "").toLowerCase() !== ADMIN_EMAIL);
      renderizarCards("todos");
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = "<p>Não foi possível carregar os usuários.</p>";
    }
  }

  function mostrarAviso(dias, expiraEm) {
    if (document.getElementById("avisoExpiracaoAcesso")) return;
    const aviso = document.createElement("div");
    aviso.id = "avisoExpiracaoAcesso";
    aviso.innerHTML = `<button aria-label="Fechar">×</button>${dias === 0 ? "Seu acesso expira hoje." : `Seu acesso expira em ${dias} dia${dias === 1 ? "" : "s"}, em ${formatarData(expiraEm)}.`}`;
    aviso.querySelector("button").onclick = () => aviso.remove();
    document.body.appendChild(aviso);
  }

  function bloquearTelaPorVencimento() {
    const overlay = document.getElementById("firebaseAuthOverlay");
    const texto = document.getElementById("authTexto");
    const msg = document.getElementById("authMensagem");
    const barra = document.getElementById("firebaseUserBar");
    if (!overlay || !texto) return;
    texto.textContent = "Seu período de acesso terminou. Entre em contato com o Samuel para renovar.";
    ["authEmail", "authSenha", "btnEntrar", "btnCadastrar", "btnRecuperar"].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = "none";
    });
    const sair = document.getElementById("btnSairPendente");
    if (sair) sair.style.display = "block";
    if (msg) { msg.textContent = "Acesso expirado."; msg.style.color = "#b00020"; }
    overlay.style.display = "flex";
    if (barra) barra.style.display = "none";
  }

  async function registrarUso(user, dados) {
    const chave = `usoRegistrado:${user.uid}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
    try {
      await db.collection("usuarios").doc(user.uid).set({
        ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp(),
        totalAcessos: firebase.firestore.FieldValue.increment(1),
        ultimoDispositivo: navigator.userAgent.slice(0, 180),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (erro) {
      console.warn("Não foi possível registrar o uso:", erro);
    }
  }

  async function verificarAcesso(user) {
    if (!user) return;
    const email = String(user.email || "").toLowerCase();
    const snap = await db.collection("usuarios").doc(user.uid).get();
    if (!snap.exists) return;
    const dados = snap.data();
    await registrarUso(user, dados);
    if (email === ADMIN_EMAIL) return;
    const dias = diferencaDias(dados.expiraEm);
    if (dias !== null && dias < 0) {
      bloquearTelaPorVencimento();
      return;
    }
    if (dias !== null && (AVISOS_DIAS.includes(dias) || dias === 0)) mostrarAviso(dias, dados.expiraEm);
  }

  function conectarPainel() {
    document.addEventListener("click", e => {
      const botao = e.target.closest && e.target.closest("#adminUsuariosBtn");
      if (!botao) return;
      setTimeout(carregarGerenciamento, 100);
    }, true);
  }

  function iniciar() {
    if (!iniciarFirebase()) return setTimeout(iniciar, 300);
    garantirEstilos();
    garantirModal();
    conectarPainel();
    auth.onAuthStateChanged(user => {
      usuarioAtual = user;
      if (user) setTimeout(() => verificarAcesso(user), 350);
    });
    window.carregarGerenciamentoUsuarios = carregarGerenciamento;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
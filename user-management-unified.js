(function () {
  'use strict';

  const ADMIN_EMAIL = 'sathlersamuel@gmail.com';
  const COLECAO_USUARIOS = 'usuarios';
  let db;
  let usuarios = [];
  let cancelarAtualizacao = null;
  let iniciado = false;

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const escapar = valor => String(valor || '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[caractere]);

  function converterData(valor) {
    if (!valor) return null;
    if (typeof valor.toDate === 'function') return valor.toDate();
    const resultado = new Date(valor);
    return Number.isNaN(resultado.getTime()) ? null : resultado;
  }

  function formatarData(valor, hora = false) {
    const data = converterData(valor);
    if (!data) return 'Não informado';
    return new Intl.DateTimeFormat('pt-BR', hora ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(data);
  }

  function diasRestantes(valor) {
    const data = converterData(valor);
    return data ? Math.ceil((data.getTime() - Date.now()) / 86400000) : null;
  }

  function obterStatus(usuario) {
    const dias = diasRestantes(usuario.expiraEm);
    if (usuario.status === 'bloqueado') return ['bloqueado', 'Bloqueado', '#b32635'];
    if (usuario.status === 'pendente') return ['pendente', 'Pendente', '#b26a00'];
    if (dias !== null && dias < 0) return ['vencido', 'Vencido', '#b32635'];
    if (dias !== null && dias <= 7) return ['expirando', 'Expirando', '#b26a00'];
    if (usuario.expiraEm) return ['teste', 'Em teste', '#1455a0'];
    return ['ativo', 'Ativo', '#0b7a2d'];
  }

  function descricaoUso(usuario) {
    const ultimo = converterData(usuario.ultimoAcesso);
    if (!ultimo) return 'Ainda não utilizou';
    const dias = Math.floor((Date.now() - ultimo.getTime()) / 86400000);
    if (dias <= 0) return 'Usou hoje';
    if (dias === 1) return 'Usou ontem';
    return `Usou há ${dias} dias`;
  }

  function instalarEstilos() {
    if ($('#umStyles')) return;
    const estilo = document.createElement('style');
    estilo.id = 'umStyles';
    estilo.textContent = `
      #painelUsuarios{display:none;position:fixed;inset:0;z-index:30000;overflow:auto;background:#f3f6fb;padding:calc(12px + env(safe-area-inset-top)) 12px calc(24px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
      .um-shell{max-width:920px;margin:auto}.um-top{position:sticky;top:0;z-index:2;display:flex;gap:14px;align-items:center;background:rgba(243,246,251,.96);padding:8px 0 16px;backdrop-filter:blur(12px)}
      .um-top button{border:0;border-radius:14px;background:#e2e8f2;color:#102342;padding:13px 16px;font-weight:800;min-height:48px;touch-action:manipulation}.um-top h2{margin:0;color:#071b3d;font-size:23px}.um-top p{margin:3px 0 0;color:#6c7890}
      .um-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:5px 0 15px}.um-summary div,.um-card{background:#fff;border:1px solid #e0e7f1;border-radius:20px;box-shadow:0 8px 24px rgba(20,48,88,.07)}.um-summary div{padding:14px}.um-summary span,.um-info span{display:block;font-size:11px;color:#748197;text-transform:uppercase;font-weight:800}.um-summary strong{font-size:25px;color:#071b3d}
      .um-filtros{display:flex;gap:8px;overflow:auto;padding-bottom:13px}.um-filtros button{white-space:nowrap;border:1px solid #d5deeb;background:#fff;color:#42506a;padding:10px 14px;border-radius:999px;font-weight:800;touch-action:manipulation}.um-filtros button.ativo{background:#083b82;color:#fff}
      .um-card{padding:17px;margin-bottom:12px;border-left:5px solid var(--cor)}.um-head{display:flex;justify-content:space-between;gap:12px}.um-email{font-weight:900;color:#071b3d;overflow-wrap:anywhere}.um-chip{border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;background:#eef2f7}
      .um-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.um-info{background:#f5f7fb;border-radius:13px;padding:10px}.um-info strong{display:block;color:#172b4d;font-size:13px;margin-top:4px;overflow-wrap:anywhere}
      .um-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.um-actions button{border:0;border-radius:12px;min-height:44px;padding:10px;color:#fff;font-weight:850;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.um-actions button:disabled{opacity:.55}.um-prazo{background:#1455a0}.um-renovar{background:#6234a5}.um-status{background:#334e70}.um-aprovar{background:#0b7a2d}.um-excluir{background:#941f2b}
      .um-loading,.um-vazio{padding:25px;text-align:center;color:#617087}.um-modal{position:fixed;inset:0;z-index:31000;background:rgba(5,15,32,.68);display:flex;align-items:center;justify-content:center;padding:16px}.um-modal-card{width:min(460px,100%);background:#fff;border-radius:22px;padding:20px}.um-modal-card label{display:block;font-weight:800;color:#516078;margin:12px 0 5px}.um-modal-card input,.um-modal-card select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #ced8e6;border-radius:12px;font-size:16px}.um-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:17px}.um-modal-actions button{border:0;border-radius:12px;padding:13px;font-weight:900}.um-salvar{background:#083b82;color:#fff}
      @media(max-width:720px){.um-summary,.um-grid{grid-template-columns:repeat(2,1fr)}.um-actions{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(estilo);
  }

  function criarPainel() {
    const antigo = $('#painelUsuarios');
    if (antigo) antigo.remove();
    const painel = document.createElement('section');
    painel.id = 'painelUsuarios';
    painel.innerHTML = `<div class="um-shell"><header class="um-top"><button type="button" data-cmd="fechar">← Voltar</button><div><h2>Gerenciamento de Usuários</h2><p>Controle de acessos e utilização</p></div></header><div id="umConteudo"><div class="um-loading">Carregando usuários…</div></div></div>`;
    document.body.appendChild(painel);
  }

  function resumo() {
    let ativos = 0, vencendo = 0, semUso = 0;
    usuarios.forEach(usuario => {
      const status = obterStatus(usuario)[0];
      if (['ativo', 'teste'].includes(status)) ativos++;
      if (['expirando', 'vencido'].includes(status)) vencendo++;
      const ultimo = converterData(usuario.ultimoAcesso);
      if (!ultimo || Date.now() - ultimo.getTime() > 7 * 86400000) semUso++;
    });
    return `<div class="um-summary"><div><span>Total</span><strong>${usuarios.length}</strong></div><div><span>Ativos</span><strong>${ativos}</strong></div><div><span>Vencendo</span><strong>${vencendo}</strong></div><div><span>Sem uso</span><strong>${semUso}</strong></div></div>`;
  }

  function renderizar(filtro = 'todos') {
    const conteudo = $('#umConteudo');
    if (!conteudo) return;
    const lista = usuarios.filter(usuario => {
      const status = obterStatus(usuario)[0];
      if (filtro === 'ativos') return ['ativo', 'teste'].includes(status);
      if (filtro === 'vencendo') return ['expirando', 'vencido'].includes(status);
      if (filtro === 'bloqueados') return ['bloqueado', 'pendente'].includes(status);
      if (filtro === 'semuso') {
        const ultimo = converterData(usuario.ultimoAcesso);
        return !ultimo || Date.now() - ultimo.getTime() > 7 * 86400000;
      }
      return true;
    });

    const nomes = { todos: 'Todos', ativos: 'Ativos', vencendo: 'Vencendo', semuso: 'Sem uso', bloqueados: 'Bloqueados' };
    const filtros = Object.keys(nomes).map(chave => `<button type="button" class="${chave === filtro ? 'ativo' : ''}" data-cmd="filtro" data-filtro="${chave}">${nomes[chave]}</button>`).join('');
    const cards = lista.map(usuario => {
      const [, texto, cor] = obterStatus(usuario);
      const restantes = diasRestantes(usuario.expiraEm);
      const prazo = usuario.expiraEm ? `${formatarData(usuario.expiraEm)}${restantes !== null ? ` (${restantes < 0 ? 'vencido' : restantes + ' dias'})` : ''}` : 'Sem vencimento';
      const botaoAcesso = usuario.status === 'pendente'
        ? `<button type="button" class="um-aprovar" data-cmd="aprovar" data-id="${usuario.id}">Aprovar</button>`
        : `<button type="button" class="um-status" data-cmd="status" data-id="${usuario.id}" data-status="${usuario.status === 'bloqueado' ? 'ativo' : 'bloqueado'}">${usuario.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}</button>`;
      return `<article class="um-card" style="--cor:${cor}"><div class="um-head"><div><div class="um-email">${escapar(usuario.email || 'Sem e-mail')}</div><small>Cadastrado em ${formatarData(usuario.criadoEm)}</small></div><span class="um-chip">${texto}</span></div><div class="um-grid"><div class="um-info"><span>Uso</span><strong>${descricaoUso(usuario)}</strong></div><div class="um-info"><span>Último acesso</span><strong>${formatarData(usuario.ultimoAcesso, true)}</strong></div><div class="um-info"><span>Acessos</span><strong>${Number(usuario.totalAcessos || 0)}</strong></div><div class="um-info"><span>Válido até</span><strong>${prazo}</strong></div></div><div class="um-actions"><button type="button" class="um-prazo" data-cmd="prazo" data-id="${usuario.id}">Editar prazo</button><button type="button" class="um-renovar" data-cmd="renovar" data-id="${usuario.id}">Renovar</button>${botaoAcesso}<button type="button" class="um-excluir" data-cmd="excluir" data-id="${usuario.id}">Excluir</button></div></article>`;
    }).join('');

    conteudo.innerHTML = resumo() + `<div class="um-filtros">${filtros}</div>` + (cards || '<div class="um-vazio">Nenhum usuário encontrado.</div>');
  }

  function aplicarSnapshot(resultado) {
    usuarios = resultado.docs
      .map(documento => ({ id: documento.id, ...documento.data() }))
      .filter(usuario => String(usuario.email || '').toLowerCase() !== ADMIN_EMAIL)
      .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'pt-BR'));
    renderizar();
  }

  function acompanharUsuarios() {
    if (cancelarAtualizacao) cancelarAtualizacao();
    const conteudo = $('#umConteudo');
    if (conteudo) conteudo.innerHTML = '<div class="um-loading">Carregando usuários…</div>';
    cancelarAtualizacao = db.collection(COLECAO_USUARIOS).onSnapshot(aplicarSnapshot, erro => {
      console.error('Falha ao carregar usuários:', erro);
      if (conteudo) conteudo.innerHTML = '<div class="um-vazio">Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.</div>';
    });
  }

  async function carregar() {
    if (!db) return;
    try {
      const resultado = await db.collection(COLECAO_USUARIOS).get();
      aplicarSnapshot(resultado);
    } catch (erro) {
      console.error('Falha ao atualizar usuários:', erro);
      const conteudo = $('#umConteudo');
      if (conteudo) conteudo.innerHTML = '<div class="um-vazio">Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.</div>';
    }
  }

  function abrir() {
    criarPainel();
    $('#painelUsuarios').style.display = 'block';
    document.body.style.overflow = 'hidden';
    acompanharUsuarios();
  }

  function fechar() {
    const painel = $('#painelUsuarios');
    if (painel) painel.style.display = 'none';
    document.body.style.overflow = '';
    if (cancelarAtualizacao) {
      cancelarAtualizacao();
      cancelarAtualizacao = null;
    }
  }

  function abrirModal(usuario) {
    const modal = document.createElement('div');
    modal.className = 'um-modal';
    modal.innerHTML = `<div class="um-modal-card"><h3>Configurar acesso</h3><p>${escapar(usuario.email)}</p><label>Quantidade</label><input id="umQtd" type="number" min="1" value="3"><label>Período</label><select id="umUn"><option value="dias">Dias</option><option value="meses" selected>Meses</option><option value="anos">Anos</option></select><label><input id="umIlim" type="checkbox" style="width:auto"> Acesso sem vencimento</label><div class="um-modal-actions"><button type="button" data-modal="cancelar">Cancelar</button><button type="button" class="um-salvar" data-modal="salvar">Salvar</button></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', async evento => {
      const botao = evento.target.closest('[data-modal]');
      if (!botao) return;
      evento.preventDefault();
      if (botao.dataset.modal === 'cancelar') return modal.remove();
      botao.disabled = true;
      const quantidade = Math.max(1, Number($('#umQtd', modal).value || 1));
      const unidade = $('#umUn', modal).value;
      const ilimitado = $('#umIlim', modal).checked;
      const inicio = new Date();
      const fim = new Date(inicio);
      if (unidade === 'dias') fim.setDate(fim.getDate() + quantidade);
      if (unidade === 'meses') fim.setMonth(fim.getMonth() + quantidade);
      if (unidade === 'anos') fim.setFullYear(fim.getFullYear() + quantidade);
      try {
        await db.collection(COLECAO_USUARIOS).doc(usuario.id).set({
          status: 'ativo',
          acessoIniciadoEm: firebase.firestore.Timestamp.fromDate(inicio),
          expiraEm: ilimitado ? firebase.firestore.FieldValue.delete() : firebase.firestore.Timestamp.fromDate(fim),
          periodoQuantidade: ilimitado ? null : quantidade,
          periodoUnidade: ilimitado ? 'ilimitado' : unidade,
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        modal.remove();
      } catch (erro) {
        console.error(erro);
        alert('Não foi possível salvar.');
        botao.disabled = false;
      }
    });
  }

  async function executar(botao) {
    if (botao.disabled) return;
    const comando = botao.dataset.cmd;
    if (comando === 'fechar') return fechar();
    if (comando === 'filtro') return renderizar(botao.dataset.filtro);
    const usuario = usuarios.find(item => item.id === botao.dataset.id);
    if (!usuario) return;
    if (comando === 'prazo') return abrirModal(usuario);

    botao.disabled = true;
    try {
      const referencia = db.collection(COLECAO_USUARIOS).doc(usuario.id);
      if (comando === 'aprovar') {
        await referencia.set({ status: 'ativo', aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } else if (comando === 'status') {
        await referencia.set({ status: botao.dataset.status, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } else if (comando === 'renovar') {
        const atual = converterData(usuario.expiraEm);
        const fim = atual && atual > new Date() ? new Date(atual) : new Date();
        const quantidade = Math.max(1, Number(usuario.periodoQuantidade || 3));
        const unidade = usuario.periodoUnidade && usuario.periodoUnidade !== 'ilimitado' ? usuario.periodoUnidade : 'meses';
        if (unidade === 'dias') fim.setDate(fim.getDate() + quantidade);
        if (unidade === 'meses') fim.setMonth(fim.getMonth() + quantidade);
        if (unidade === 'anos') fim.setFullYear(fim.getFullYear() + quantidade);
        await referencia.set({ status: 'ativo', expiraEm: firebase.firestore.Timestamp.fromDate(fim), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } else if (comando === 'excluir') {
        if (!confirm(`Excluir definitivamente ${usuario.email || 'este usuário'}?`)) {
          botao.disabled = false;
          return;
        }
        await referencia.delete();
      }
    } catch (erro) {
      console.error(erro);
      alert('Não foi possível concluir a ação.');
      botao.disabled = false;
    }
  }

  function iniciar() {
    if (iniciado) return;
    if (!window.firebase || !firebase.apps.length) return setTimeout(iniciar, 250);
    db = window.SCPAuth?.db || firebase.firestore();
    iniciado = true;
    instalarEstilos();
    criarPainel();
    document.addEventListener('click', evento => {
      const abrirGerenciamento = evento.target.closest('#adminUsuariosBtn');
      if (abrirGerenciamento) {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        abrir();
        return;
      }
      const botao = evento.target.closest('#painelUsuarios [data-cmd]');
      if (botao) {
        evento.preventDefault();
        evento.stopPropagation();
        executar(botao);
      }
    }, true);
    window.carregarGerenciamentoUsuarios = carregar;
    window.__SCP_USER_MANAGEMENT_UNIFIED__ = '1.1.0';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
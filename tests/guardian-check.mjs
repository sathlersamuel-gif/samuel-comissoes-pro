import fs from 'node:fs';

const ler = caminho => fs.existsSync(caminho) ? fs.readFileSync(caminho, 'utf8') : '';
const resultados = [];

function verificar({ id, arquivo, descricao, condicao, evidencia, recomendacao, gravidade='alta' }) {
  resultados.push({
    id,
    arquivo,
    descricao,
    gravidade,
    status: condicao ? 'aprovado' : 'falha',
    evidencia: condicao ? evidencia.aprovada : evidencia.falha,
    recomendacao: condicao ? null : recomendacao
  });
}

const index = ler('index.html');
const script = ler('script.js');
const comissao = ler('commission-input-restore.js');
const dados = ler('sales-data-core-restore.js');
const marcas = ler('brand-product-selector.js');
const firebase = ler('firebase-integration.js');
const sw = ler('sw.js');
const pwa = ler('pwa-enhancements.js');
const gestor = ler('admin-user-management.js');
const gestorVisual = ler('user-management-modern-v2.js');
const gestorAcesso = ler('admin-access-settings-fix.js');

verificar({id:'comissao-carregada',arquivo:'index.html',descricao:'Correção do campo de comissão carregada',condicao:index.includes('commission-input-restore.js'),evidencia:{aprovada:'index.html referencia commission-input-restore.js',falha:'Referência não encontrada no index.html'},recomendacao:'Restaurar o carregamento de commission-input-restore.js no index.html.'});
verificar({id:'comissao-virgula',arquivo:'commission-input-restore.js',descricao:'Inserção automática da vírgula após o primeiro dígito',condicao:(comissao.includes('digitos.length === 1')||comissao.includes('digitos.length===1'))&&comissao.includes("campo.value = digitos + ',0'"),evidencia:{aprovada:'A função exibir usa digitos.length e formata um dígito como x,0',falha:'A regra atual de formatação x,0 não foi localizada'},recomendacao:'Manter na função exibir a condição de um dígito e a saída digitos + ",0".'});
verificar({id:'comissao-calculo',arquivo:'commission-input-restore.js',descricao:'Conversão de vírgula para ponto no cálculo',condicao:comissao.includes("replace(',', '.')")||comissao.includes('replace(",", ".")'),evidencia:{aprovada:'numeroBR converte vírgula decimal antes do cálculo',falha:'Conversão decimal não localizada'},recomendacao:'Restaurar a conversão da vírgula decimal em numeroBR.'});
verificar({id:'dados-carregados',arquivo:'index.html',descricao:'Núcleo atual de dados carregado',condicao:index.includes('sales-data-core-restore.js'),evidencia:{aprovada:'index.html carrega sales-data-core-restore.js',falha:'Núcleo de dados não está carregado'},recomendacao:'Adicionar sales-data-core-restore.js ao index.html.'});
verificar({id:'exclusao-definitiva',arquivo:'sales-data-core-restore.js',descricao:'Exclusão definitiva e bloqueio de retorno',condicao:dados.includes('window.excluirVenda')&&dados.includes('filterDeleted')&&dados.includes('vendasExcluidas'),evidencia:{aprovada:'Foram localizados excluirVenda, filterDeleted e vendasExcluidas',falha:'Uma ou mais proteções de exclusão não foram localizadas'},recomendacao:'Restaurar excluirVenda, o filtro de excluídas e o registro vendasExcluidas.'});
verificar({id:'edicao-sem-duplicar',arquivo:'sales-data-core-restore.js',descricao:'Edição de vendas sem duplicação',condicao:dados.includes('window.editarVenda')&&dados.includes('editingId'),evidencia:{aprovada:'editarVenda usa editingId para substituir o registro existente',falha:'Fluxo de edição protegido não localizado'},recomendacao:'Restaurar o fluxo de edição baseado em editingId.'});
verificar({id:'firebase-auth',arquivo:'firebase-integration.js',descricao:'Autenticação e inicialização Firebase',condicao:firebase.includes('firebase.initializeApp')&&firebase.includes('auth.onAuthStateChanged')&&(firebase.includes("collection('usuarios')")||firebase.includes('collection("usuarios")')),evidencia:{aprovada:'Inicialização, autenticação e coleção de usuários localizadas',falha:'Inicialização ou autenticação Firebase não localizada'},recomendacao:'Restaurar initializeApp, onAuthStateChanged e acesso à coleção usuarios.'});
verificar({id:'firebase-sync-vendas',arquivo:'sales-data-core-restore.js',descricao:'Sincronização de vendas com Firebase',condicao:(dados.includes("firebase.firestore().collection('usuarios')")||dados.includes('firebase.firestore().collection("usuarios")'))&&(dados.includes("collection('vendas')")||dados.includes('collection("vendas")'))&&dados.includes('saveCloud')&&dados.includes('reconcile'),evidencia:{aprovada:'Núcleo atual contém referências de usuários/vendas, saveCloud e reconcile',falha:'Sincronização de vendas da arquitetura atual não foi localizada'},recomendacao:'Restaurar userRef/salesRef, saveCloud e reconcile em sales-data-core-restore.js.'});
verificar({id:'seletor-marcas',arquivo:'brand-product-selector.js',descricao:'Seletor Yamaha/Honda e digitação livre',condicao:index.includes('brand-product-selector.js')&&marcas.includes('yamaha:[')&&marcas.includes('honda:[')&&marcas.includes('Modelo não encontrado'),evidencia:{aprovada:'Marcas e tratamento de modelo não encontrado localizados',falha:'Seletor ou uma das marcas protegidas não foi localizada'},recomendacao:'Restaurar o seletor de marcas e a opção de modelo manual.'});
verificar({id:'catalogo-protegido',arquivo:'brand-product-selector.js',descricao:'Itens essenciais do catálogo',condicao:marcas.includes('Honda CG 160 Start')&&marcas.includes('Honda GL 1800 Gold Wing Tour')&&marcas.includes('Motor de Popa Yamaha 450 HP'),evidencia:{aprovada:'Itens de início/fim do catálogo Honda e motor 450 HP localizados',falha:'O catálogo protegido parece incompleto'},recomendacao:'Comparar o catálogo com a base aprovada antes de publicar.'});
verificar({id:'relatorios',arquivo:'index.html',descricao:'Arquivos de relatórios PDF carregados',condicao:index.includes('report-options-fix.js')&&index.includes('pdf-viewer-fix.js'),evidencia:{aprovada:'Arquivos de relatório localizados',falha:'Um arquivo de relatório não está carregado'},recomendacao:'Restaurar report-options-fix.js e pdf-viewer-fix.js.'});
verificar({id:'backup',arquivo:'index.html',descricao:'Importação e exportação de backup carregadas',condicao:index.includes('import-backup.js')&&index.includes('backup-export-fix.js'),evidencia:{aprovada:'Arquivos de backup localizados',falha:'Importação ou exportação de backup ausente'},recomendacao:'Restaurar import-backup.js e backup-export-fix.js.'});
verificar({id:'pwa-cache',arquivo:'sw.js / pwa-enhancements.js',descricao:'Cache e atualização PWA ativos',condicao:sw.includes('cachePrimeiro')&&sw.includes('redePrimeiro')&&index.includes('pwa-enhancements.js?v=14')&&pwa.includes("register('./sw.js?v=77'"),evidencia:{aprovada:'Estratégias de cache e Service Worker v77 localizados',falha:'Estratégia de cache ou versão atual do Service Worker ausente'},recomendacao:'Manter cachePrimeiro/redePrimeiro e registrar o Service Worker v77.'});
verificar({id:'vendas-centrais',arquivo:'script.js',descricao:'Funções centrais de persistência de vendas',condicao:script.includes('salvarBanco')&&script.includes('excluirVenda'),evidencia:{aprovada:'salvarBanco e excluirVenda localizadas no núcleo legado protegido',falha:'Funções centrais legadas não localizadas'},recomendacao:'Confirmar se foram substituídas oficialmente; caso contrário, restaurá-las.'});

verificar({id:'usuarios-nucleo',arquivo:'admin-user-management.js',descricao:'Núcleo do gerenciamento de usuários disponível',condicao:gestor.includes('carregarGerenciamento')&&gestor.includes('usuariosCache')&&(gestor.includes("collection('usuarios')")||gestor.includes('collection("usuarios")')),evidencia:{aprovada:'Carregamento, cache e coleção usuarios localizados',falha:'Núcleo administrativo incompleto'},recomendacao:'Restaurar carregarGerenciamento, usuariosCache e acesso à coleção usuarios.'});
verificar({id:'usuarios-acoes',arquivo:'admin-user-management.js',descricao:'Ações administrativas protegidas',condicao:gestor.includes('salvarPrazo')&&gestor.includes('renovar')&&gestor.includes('excluir')&&gestor.includes('bloque'),evidencia:{aprovada:'Prazo, renovação, exclusão e bloqueio localizados',falha:'Uma ou mais ações administrativas não foram localizadas'},recomendacao:'Restaurar prazo, renovação, exclusão e bloqueio de usuários.'});
verificar({id:'usuarios-visual-moderno',arquivo:'user-management-modern-v2.js',descricao:'Visual moderno do gerenciamento disponível',condicao:gestorVisual.includes('#061326')&&gestorVisual.includes('scp-gestao-toolbar')&&gestorVisual.includes('scp-gestao-busca')&&gestorVisual.includes('scp-gestao-status'),evidencia:{aprovada:'Tema escuro, busca e filtro de status localizados',falha:'Tema moderno, busca ou filtro não foram localizados'},recomendacao:'Restaurar o visual moderno, a busca e o filtro por status.'});
verificar({id:'usuarios-carregamento-unico',arquivo:'index.html / pwa-enhancements.js / sw.js',descricao:'Somente o gerenciador moderno pode controlar a tela no iPhone',condicao:index.includes('admin-access-settings-fix.js?v=2026.07.21.6')&&index.includes('user-management-modern-v2.js?v=2026.07.21.6')&&!pwa.includes('user-management-iphone-fix.js')&&!sw.includes('user-management-iphone-fix.js'),evidencia:{aprovada:'O gerenciador moderno é carregado diretamente e o renderizador antigo do iPhone não é executado nem armazenado em cache',falha:'Um renderizador antigo ainda pode sobrescrever o visual moderno'},recomendacao:'Remover user-management-iphone-fix.js do carregamento dinâmico e do APP_SHELL.'});
verificar({id:'usuarios-abertura',arquivo:'admin-access-settings-fix.js',descricao:'Abertura do gerenciamento aguarda o núcleo principal e o login',condicao:gestorAcesso.includes('esperarGerenciador')&&gestorAcesso.includes('carregarGerenciamentoUsuarios')&&gestorAcesso.includes('onAuthStateChanged')&&gestorAcesso.includes("painel.style.setProperty('display','block','important')"),evidencia:{aprovada:'A abertura espera o núcleo, acompanha o login e exibe o painel de forma controlada',falha:'A abertura segura do painel não foi localizada'},recomendacao:'Restaurar a espera do núcleo, o observador de autenticação e a abertura controlada do painel.'});

const falhas = resultados.filter(item => item.status === 'falha');
const relatorio = {
  geradoEm: new Date().toISOString(),
  versao: '2.4',
  resumo: { total: resultados.length, aprovados: resultados.length - falhas.length, falhas: falhas.length, criticas: falhas.filter(x=>x.gravidade==='critica').length },
  resultados
};
fs.writeFileSync('guardian-report.json', JSON.stringify(relatorio, null, 2));

console.log(`\n🛡️ IA Guardiã: ${relatorio.resumo.aprovados}/${relatorio.resumo.total} verificações aprovadas.`);
resultados.forEach(item => console.log(`${item.status === 'aprovado' ? '✅' : '❌'} [${item.id}] ${item.descricao} — ${item.arquivo}: ${item.evidencia}`));

if (falhas.length) {
  console.error('\n🛡️ Atualização bloqueada. Correções recomendadas:');
  falhas.forEach(item => console.error(`- [${item.id}] (${item.gravidade}) ${item.recomendacao}`));
  process.exit(1);
}

console.log('\n🛡️ Todas as funções protegidas foram aprovadas na arquitetura atual.');
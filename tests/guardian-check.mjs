import fs from 'node:fs';

const ler = caminho => fs.readFileSync(caminho, 'utf8');
const falhas = [];
const exigir = (condicao, mensagem) => { if (!condicao) falhas.push(mensagem); };

const index = ler('index.html');
const script = ler('script.js');
const comissao = ler('commission-input-restore.js');
const exclusao = ler('permanent-delete-sync-fix.js');
const marcas = ler('brand-product-selector.js');
const firebase = ler('firebase-integration.js');
const sw = ler('sw.js');

exigir(index.includes('commission-input-restore.js'), 'Campo de comissão perdeu sua correção protegida.');
exigir(comissao.includes("valor.length===1") || comissao.includes("valor.length === 1"), 'Comissão não insere vírgula após o primeiro dígito.');
exigir(comissao.includes("replace(',', '.')") || comissao.includes('replace(",", ".")'), 'Comissão não converte vírgula corretamente para cálculo.');
exigir(index.includes('permanent-delete-sync-fix.js'), 'Proteção de exclusão definitiva não está carregada.');
exigir(exclusao.includes('exclu') && exclusao.includes('localStorage'), 'Registro permanente de exclusões não foi encontrado.');
exigir(index.includes('brand-product-selector.js'), 'Seletor Honda/Yamaha não está carregado.');
exigir(marcas.includes('yamaha:[') && marcas.includes('honda:['), 'Uma das marcas protegidas foi removida.');
exigir(marcas.includes('Modelo não encontrado') && marcas.includes('salvar manualmente'), 'Digitação livre de modelo foi removida.');
exigir(marcas.includes('Honda CG 160 Start') && marcas.includes('Honda GL 1800 Gold Wing Tour'), 'Catálogo Honda está incompleto.');
exigir(marcas.includes('Motor de Popa Yamaha 450 HP'), 'Linha de motores de popa Yamaha foi reduzida.');
exigir(index.includes('firebase-integration.js') && firebase.includes('sincronizarInicial'), 'Sincronização Firebase foi removida.');
exigir(index.includes('report-options-fix.js') && index.includes('pdf-viewer-fix.js'), 'Relatórios PDF perderam arquivos protegidos.');
exigir(index.includes('import-backup.js') && index.includes('backup-export-fix.js'), 'Backup perdeu arquivos protegidos.');
exigir(index.includes('ai-performance-accelerator.js') && sw.includes('cachePrimeiro'), 'Acelerador inteligente deixou de funcionar.');
exigir(script.includes('salvarBanco') && script.includes('excluirVenda'), 'Funções centrais de venda foram removidas.');

if (falhas.length) {
  console.error('\n🛡️ IA Guardiã bloqueou a atualização:\n');
  falhas.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('🛡️ IA Guardiã: todas as funções aprovadas permanecem protegidas.');

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const fail = (message) => { console.error(`\n❌ ${message}`); process.exitCode = 1; };
const ok = (message) => console.log(`✅ ${message}`);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

console.log('Vistoria automática — Samuel Comissões PRO\n');

// 1) Sintaxe de todos os JavaScripts do projeto.
const jsFiles = fs.readdirSync(root).filter((name) => name.endsWith('.js'));
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  } catch (error) {
    fail(`Erro de sintaxe em ${file}: ${String(error.stderr || error.message)}`);
  }
}
if (!process.exitCode) ok(`${jsFiles.length} arquivos JavaScript passaram na verificação de sintaxe.`);

// 2) Evita scripts duplicados no HTML.
const index = read('index.html');
const scripts = [...index.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
const normalized = scripts.map((src) => src.split('?')[0]);
const duplicates = [...new Set(normalized.filter((src, i) => normalized.indexOf(src) !== i))];
if (duplicates.length) fail(`Scripts carregados mais de uma vez: ${duplicates.join(', ')}`);
else ok('Nenhum script é carregado duas vezes no index.html.');

// 3) Contrato obrigatório da exclusão de usuários.
const deletionFile = 'permanent-user-delete-fix.js';
if (!fs.existsSync(path.join(root, deletionFile))) {
  fail(`${deletionFile} não existe.`);
} else {
  const deletion = read(deletionFile);
  const requirements = [
    ['captura do botão Excluir', /data-acao=["']excluir["']/],
    ['confirmação antes da exclusão', /confirm\s*\(/],
    ['gravação do status excluido', /status\s*:\s*STATUS_EXCLUIDO/],
    ['confirmação posterior no Firebase', /await\s+ref\.get\s*\(/],
    ['tratamento de falha', /catch\s*\(/],
    ['registro na vistoriadora', /SCPMonitor\?\.registrar/]
  ];
  for (const [name, pattern] of requirements) {
    if (!pattern.test(deletion)) fail(`Exclusão de usuários sem ${name}.`);
  }
  if (!process.exitCode) ok('Fluxo de exclusão atende ao contrato mínimo obrigatório.');
}

// 4) O arquivo corrigido precisa estar versionado no HTML.
const match = index.match(/permanent-user-delete-fix\.js\?v=(\d+)/);
if (!match) fail('O script de exclusão não está carregado com versão no index.html.');
else ok(`Script de exclusão carregado com versão v${match[1]}.`);

// 5) Service Worker deve usar rede primeiro para JS e possuir versão própria.
const sw = read('sw.js');
if (!/CACHE_NAME\s*=\s*['"][^'"]+v\d+['"]/.test(sw)) fail('Service Worker sem versão de cache explícita.');
if (!/arquivoDinamico[\s\S]*redePrimeiro/.test(sw)) fail('Service Worker não usa rede primeiro para arquivos dinâmicos.');
else ok('Service Worker configurado para buscar JavaScript atualizado primeiro.');

// 6) Impede declarar sucesso sem um marcador verificável no código.
if (!/O Firebase não confirmou a exclusão/.test(read(deletionFile))) {
  fail('A exclusão não exige confirmação de leitura após a gravação.');
} else {
  ok('A exclusão só pode informar sucesso após confirmação do Firebase.');
}

if (process.exitCode) {
  console.error('\n⛔ VISTORIA REPROVADA. A versão não deve ser considerada pronta.');
  process.exit(process.exitCode);
}

console.log('\n🟢 VISTORIA APROVADA. Verificações automáticas concluídas.');

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const falhar = mensagem => {
  console.error(`\n🛡️ IA Guardiã bloqueou a atualização:\n- ${mensagem}\n`);
  process.exit(1);
};

const arquivoEscopo = '.guardian-scope.json';
if (!fs.existsSync(arquivoEscopo)) falhar('O arquivo de autorização da mudança não foi encontrado.');

let escopo;
try {
  escopo = JSON.parse(fs.readFileSync(arquivoEscopo, 'utf8'));
} catch {
  falhar('O arquivo de autorização da mudança está inválido.');
}

if (escopo.exigirDescricaoDoPedido && !String(escopo.pedido || '').trim()) {
  falhar('A descrição exata do pedido do usuário não foi registrada.');
}

if (!escopo.bloquearArquivosNaoAutorizados) {
  falhar('A proteção contra alterações fora do pedido está desativada.');
}

const autorizados = new Set([
  ...(Array.isArray(escopo.arquivosAutorizados) ? escopo.arquivosAutorizados : []),
  ...(Array.isArray(escopo.arquivosSemprePermitidos) ? escopo.arquivosSemprePermitidos : [])
]);

if (!autorizados.size) falhar('Nenhum arquivo foi autorizado para esta mudança.');

const base = process.env.GUARDIAN_BASE;
const head = process.env.GUARDIAN_HEAD || 'HEAD';
if (!base || /^0+$/.test(base)) {
  console.log('🛡️ Primeiro registro detectado; validação funcional continuará normalmente.');
  process.exit(0);
}

let alterados;
try {
  alterados = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' })
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
} catch (erro) {
  falhar(`Não foi possível comparar o projeto antes e depois: ${erro.message}`);
}

const foraDoEscopo = alterados.filter(arquivo => !autorizados.has(arquivo));
if (foraDoEscopo.length) {
  falhar(`Foram alterados arquivos fora do pedido autorizado: ${foraDoEscopo.join(', ')}`);
}

console.log(`🛡️ Escopo validado. Pedido: ${escopo.pedido}`);
console.log(`🛡️ Arquivos alterados e autorizados: ${alterados.join(', ') || 'nenhum'}`);

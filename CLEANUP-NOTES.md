# Limpeza Segura do Projeto

## Concluído nesta etapa

- Regras atuais consolidadas.
- Base estável registrada.
- Backup oficial registrado.
- Instruções antigas e duplicadas declaradas como substituídas.
- Código funcional preservado integralmente.

## Próxima análise técnica

Antes de remover qualquer script antigo, deve-se verificar:

- se o arquivo aparece no `index.html`;
- se aparece no `sw.js`;
- se exporta ou sobrescreve funções globais;
- se participa do Firebase, armazenamento local, backup, relatórios ou edição de vendas;
- se PWA e APK carregam o mesmo arquivo.

Nenhum arquivo funcional deve ser apagado apenas pelo nome indicar que é uma correção antiga.

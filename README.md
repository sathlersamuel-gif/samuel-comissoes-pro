# Samuel Comissões PRO

## Base oficial atual

- Estado: estável e funcionando.
- Commit de referência: `1bbb06e8cd4b4c5f311f747aee988a030e1a82fe`.
- Backup protegido: `backup-estavel-2026-07-20-v1`.

## Regra principal

A versão atual é a única base oficial do projeto. Pedidos antigos, duplicados, concluídos ou substituídos não devem ser reutilizados em novas alterações.

## Método seguro de manutenção

1. Preservar tudo que já funciona.
2. Fazer uma alteração por vez.
3. Não apagar código ativo sem comprovação.
4. Testar antes de incorporar uma mudança.
5. Criar um novo ponto de restauração antes de mudanças grandes.
6. Restaurar o backup estável caso uma atualização apresente falha.

As regras detalhadas e as funções protegidas estão em `project-guardian.json`.

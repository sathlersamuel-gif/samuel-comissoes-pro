# Estado Atual Consolidado

Este documento registra somente o que deve ser considerado válido daqui para frente.

## Referência segura

- Aplicativo estável: commit `1bbb06e8cd4b4c5f311f747aee988a030e1a82fe`.
- Backup: branch `backup-estavel-2026-07-20-v1`.

## Decisões válidas

- A versão atual é a base oficial.
- Instruções antigas, repetidas, concluídas ou substituídas devem ser ignoradas.
- Nenhuma funcionalidade estável deve ser alterada sem necessidade.
- Toda mudança deve ser pequena, isolada e verificável.
- Arquivos de correção atualmente carregados pelo aplicativo são considerados ativos até prova contrária.

## O que esta limpeza não faz

Esta consolidação não remove scripts do aplicativo. A exclusão de código exige teste funcional específico para evitar regressões no iPhone, PWA e APK.

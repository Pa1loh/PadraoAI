# 0001. AGENTS.md é a fonte única de instruções; Gemini CLI é legado e GEMINI.md não se cria

- Data: 2026-10-29 (decisão do dono, aplicada em `inegociaveis.md`, `ADOTAR.md`, `rules/agents-md-convention.md` e `templates/AGENTS.md`) · Status: Aceito

## Contexto

A regra `rules/agents-md-convention.md` (desde `d62ce04`, 2026-09-30) já mandava `CLAUDE.md` e `GEMINI.md` serem ponteiros finos para `AGENTS.md`. O Gemini CLI saiu do setup do dono; hoje Claude Code, Antigravity e dsh são os leitores.

## Decisão

- `AGENTS.md` na raiz é a fonte única. `CLAUDE.md` contém só `@AGENTS.md`.
- Antigravity e dsh leem o `AGENTS.md` direto, por isso ele não usa `@import` (texto literal) e fica com no máximo ~120 linhas (`bin/lint-contexto.mjs`).
- `GEMINI.md` não se cria nem se cita como fonte de instrução. `templates/GEMINI.md` foi removido.
- Menções a Gemini em `extras/skills/design/**` são da API de imagem do Google, funcionalidade real, e ficam.

## Por quê (e o que foi descartado)

Fontes: `inegociaveis.md` item 16 ("Fonte única de instruções"), `ADOTAR.md` seção 1 ("Não crie `GEMINI.md`"), `rules/agents-md-convention.md` (problema das cópias que divergem) e a seção Invariantes do `AGENTS.md`. Descartado: manter `GEMINI.md` como segundo ponteiro.

## Consequências

Projeto que adota o padrão não ganha `GEMINI.md`. Regra de agente vai para o `AGENTS.md`, nunca direto no `CLAUDE.md`.

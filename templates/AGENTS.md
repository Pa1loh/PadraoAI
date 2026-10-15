# <Projeto> — Instruções para agentes

> Fonte única. CLAUDE.md e GEMINI.md apontam para cá. Máx. ~120 linhas: só o que o agente erraria sem saber.
> Padrão: https://github.com/Pa1loh/PadraoAI (leia `inegociaveis.md`).

## Comandos
- Build: `<comando>`
- Testes: `<comando>` (rode antes de todo commit)
- Rodar local: `<comando>`

## Invariantes (o que nunca pode quebrar)
- <ex.: credencial de terceiro nunca no .env; migration só aditiva>

## Armadilhas conhecidas
- <ex.: teste X é instável por Y; não rodar Z em produção>

## Fluxo
issue → branch → TDD (bug = teste de regressão vermelho primeiro) → PR pequeno → CI verde → deploy.
Decisões duráveis: `docs/adr/`. Domínio extenso: `.claude/rules/*.md` com `paths:`.

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

## Time de agentes (`npx github:Pa1loh/PadraoAI agents` gera para Claude, Antigravity e dsh)
analista (lê) · dev (único que edita; hotfix é modo dele) · revisor (contexto limpo) · infra e deploy (aprovação humana p/ mudar estado).
- Hosts e comandos que `infra` pode usar: `<ex.: ssh user@host; docker ps/logs>`
- Script de deploy e healthcheck: `<comando>`
- Não use `@import` neste arquivo: Antigravity e dsh leem o texto literal.

## Fluxo
issue → branch → TDD (bug = teste de regressão vermelho primeiro) → PR pequeno → CI verde → deploy.
Decisões duráveis: `docs/adr/`. Domínio extenso: `.claude/rules/*.md` com `paths:`.

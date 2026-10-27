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

## Time de agentes (`npx github:Pa1loh/PadraoAI agents`)
Para criar a issue, rode `/issue-criar`: escreve para agente (exemplo, critério de pronto, onde mexer) e só abre após seu "sim". `docs/engines.yml` guarda a engine recomendada por papel e `docs/agent-log.md` o registro por issue.
Na aba da issue rode `/issue <nº>`: ele cria a branch, chama o analista (obrigatório se houver API/doc externa), faz TDD, chama o revisor e abre o PR. Merge e deploy são do usuário.
`infra` e `deploy` só em sessão própria (`claude --agent infra|deploy`), com aprovação humana para mudar estado.
- Hosts e comandos que `infra` pode usar: `<ex.: ssh user@host; docker ps/logs>`
- Script de deploy e healthcheck: `<comando>`
- Não use `@import` neste arquivo: Antigravity e dsh leem o texto literal.

## Fluxo
issue → branch → TDD (bug = teste de regressão vermelho primeiro) → PR pequeno → CI verde → deploy.
Decisões duráveis: `docs/adr/`. Domínio extenso: `.claude/rules/*.md` com `paths:`.

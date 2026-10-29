# 0004. `agents/*.md` é a fonte dos papéis; `.claude/agents/`, `.agents/` e `papel-*` são saída gerada

- Data: 2026-10-22 (commits `84198da` e `ab98cfb`, time de papéis e sessão da issue que orquestra); worker `dev` de lote em `a269c25` (2026-10-28) · Status: Aceito

## Contexto

Claude Code, Antigravity e dsh leem papéis de lugares e formatos diferentes. O dsh não lê `.claude/agents/` nem `.agents/agents/`; só skills em `.agents/skills/` (`agents/README.md`).

## Decisão

- A fonte única dos papéis é `agents/*.md`. `node bin/agents-sync.mjs` (ou `npx github:Pa1loh/PadraoAI agents`) gera `.claude/agents/`, `.agents/agents/`, as skills `papel-<n>` e as skills `issue`, `issue-criar` e `proximas`. A cópia gerada não se edita.
- A sessão da issue é uma sessão normal que orquestra e programa (sem agent `dev` avulso); `analista` e `revisor` são subagents de leitura; `infra` e `deploy` rodam só em sessão própria com aprovação humana. O `dev` existe só como worker de lote do `/proximas`, com `isolation: worktree`.
- Limites duros por hook, não por prompt; `test/agents-sync.test.mjs` falha se o `settings.json` do Claude e o `dsh/hooks.json` divergirem.

## Por quê (e o que foi descartado)

Fontes: `agents/README.md` ("Desenho (e por quê)"), `AGENTS.md` (Armadilhas conhecidas) e os commits citados. Descartado: manter um arquivo de papel por CLI à mão, que diverge.

## Consequências

Mudou um papel: edite `agents/<papel>.md` e rode o sync. Só o Claude impõe `tools` por papel; no Antigravity o limite é instrução e CI.

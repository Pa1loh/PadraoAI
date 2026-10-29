# PadraoAI — Instruções para agentes

> Fonte única. CLAUDE.md aponta para cá; Antigravity e dsh leem este arquivo direto. Máx. ~120 linhas: só o que o agente erraria sem saber.
> Regras duras (cada uma com o porquê e a imposição): `inegociaveis.md`.

## O que é
Repo do padrão, não um app: não há build nem runtime. `templates/`, `skills/`, `agents/`, `rules/` e `bin/` são copiados ou gerados para os projetos que adotam (`npx github:Pa1loh/PadraoAI init`).

## Comandos
- Testes: `npm test` (`node --test test/*.test.mjs`). Rode antes de todo commit.
- Contexto: `npm run lint:contexto`. Confere AGENTS.md ≤120 linhas e sem `@import`; skills ≤120 linhas com description ≤350 caracteres; papel com corpo ≤25 linhas e ≤2 skills.
- Guia: `npm run guia:check` (todo caminho em `<code>` existe, âncoras e links resolvem, seções obrigatórias presentes). `npm run guia` serve o guia em `127.0.0.1` e abre no navegador.
- CI (`.github/workflows/ci.yml`) roda `lint-contexto`, `guia:check` e `npm test`, e instala `jq` (os hooks em `templates/.claude/hooks/*.sh` usam `jq`).

## Invariantes (o que nunca pode quebrar)
- `init` nunca sobrescreve: arquivo que já existe no projeto vai para "Já existiam, mantidos". Não mude isso.
- `package.json` `files` define o que vai no pacote. `rules/`, `docs/`, `extras/` e a maioria de `skills/` não são publicados; só `skills/issue`, `skills/issue-criar` e `skills/proximas` estão listadas. Arquivo que o projeto adotante precisa tem que entrar em `files`.
- `extras/infra-pessoal/` é homelab do mantenedor, não faz parte do padrão. Não copie, não cite em template.
- Em projeto que adota: AGENTS.md ≤120 linhas e sem `@import` (Antigravity e dsh leem o texto literal). `templates/AGENTS.md` (exemplo com placeholders) também passa pelo lint.
- `templates/` é exemplo comentado, copiado pelo `init`. Adapte; não trate como cópia cega.
- `settings.json` do Claude (`templates/.claude/settings.json`) e `dsh/hooks.json` registram os mesmos hooks. O teste em `test/agents-sync.test.mjs` falha se divergirem. Hook novo entra nos dois.
- Gemini CLI é legado: não crie `GEMINI.md` nem o cite como fonte de instrução. Menções a Gemini em `extras/skills/design/**` são da API de imagem do Google (funcionalidade real), não o legado.
- Exceção ao lint de contexto só em `.contexto-allow`, com motivo escrito.

## Armadilhas conhecidas
- `skills/ai-memory-*` são gerenciadas pelo ai-memory (marcador `ai-memory-managed`) e são reescritas ao reinstalar. Não edite à mão.
- `skills/security-audit` e `skills/worktrees` são vendorizadas (ver `.contexto-allow`). Não as reescreva aqui.
- `agents/*.md` é a fonte dos papéis. `.claude/agents/`, `.agents/` e as skills `papel-*` são saída do `bin/agents-sync.mjs`: não edite a cópia gerada.
- Só o Claude impõe `tools` por papel. Os hooks de segurança valem no Claude e, após `node bin/dsh-setup.mjs`, no dsh. No Antigravity (agy) o limite é instrução + CI.
- Subagents: escrita fica com um agente só por árvore de arquivos. Pesquisa e revisão podem ser paralelas; quem edita não.

## Fluxo
Branch `feat/issue-<N>-<slug>` (ou `fix/...`), TDD, PR pequeno linkando a issue, CI verde, merge. Commits no padrão `feat:` / `fix:` / `chore:`.
Decisões duráveis: `docs/adr/` (modelo em `0000-modelo.md`; origem em `templates/docs/adr/0000-modelo.md`).

## Guia de desenvolvimento
- Produto, domínio, regras e "como fazer": `docs/guia-de-desenvolvimento/index.html` (abrir: `npm run guia`).
  Dúvida de negócio, fluxo ou convenção: leia a seção certa (`grep -n 'id="' docs/guia-de-desenvolvimento/index.html`)
  antes de perguntar ou decidir. Se o guia divergir de ADR ou código, ADR/código vence e o guia é corrigido no mesmo PR.
- Mudou regra, fluxo, convenção ou comando? Atualize a seção correspondente do guia no mesmo PR.

## Time de agentes (`node bin/padraoai.mjs agents`, neste repo; `npx github:Pa1loh/PadraoAI agents` nos outros)
Para criar a issue, rode `/issue-criar`: escreve para agente (exemplo, critério de pronto, onde mexer) e só abre após o "sim". `docs/engines.yml` guarda a engine recomendada por papel e `docs/agent-log.md` o registro por issue.
Na aba da issue rode `/issue <nº>`: cria a branch, chama o analista (obrigatório se houver API/doc externa), faz TDD, chama o revisor e abre o PR. Merge e deploy são do usuário.
`infra` e `deploy` só em sessão própria (`claude --agent infra|deploy`), com aprovação humana para mudar estado.
- Este repo não tem infra nem deploy: `infra` e `deploy` ficam sem host (a definir). Não use `extras/infra-pessoal/`.
- Fonte dos papéis: `agents/*.md`. `.claude/agents/`, `.agents/` e as skills `papel-*` são saída do sync; não edite a cópia.
- Não use `@import` neste arquivo: Antigravity e dsh leem o texto literal.

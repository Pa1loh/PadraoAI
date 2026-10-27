# Time de agentes

Fonte única dos papéis. `npx github:Pa1loh/PadraoAI agents` (ou `node bin/agents-sync.mjs [projeto]`) gera o mesmo time para os 3 CLIs; `init` já faz isso sem sobrescrever.

## Desenho (e por quê)
- **A aba/worktree da issue é uma sessão normal**: ela orquestra e programa. Não há agent `dev`. A doc do Claude Code manda usar a conversa principal quando as fases (plano, código, teste) compartilham contexto, e subagents para isolamento, restrição de ferramentas e resultado em resumo.
- **Subagents**: `analista` e `revisor` (leitura, contexto limpo).
- **`infra` e `deploy`**: sessões separadas, abertas por você com `claude --agent infra|deploy`, porque ali a restrição de ferramentas e a aprovação humana fazem diferença.
- **`/issue-criar`**: escreve a issue para agente (problema, exemplo, critério de pronto, onde mexer, fora de escopo) com o analista e só abre após o seu "sim". O `/issue` recusa implementar issue sem critério de pronto verificável.
- **Engine por papel**: `docs/engines.yml` (perfil economico/base/qualidade, tiers, fallback e `indisponivel`) é lido pelo `/issue`, que **recomenda** e por padrão trabalha solo. `docs/agent-log.md` registra engine, custo, CI de primeira e achados por issue, para decidir com dado.
- **`/issue <nº ou descrição>`**: o fluxo da issue como comando explícito (branch, analista, plano, TDD, revisor, PR). Delegação espontânea é pouco confiável; o comando não depende dela. No dsh headless não há slash command, então o `agents-sync` gera a cópia `.agents/skills/issue` sem `disable-model-invocation`; no Claude o `/issue` segue explícito.
- **Limites duros por hook**, não por prompt: `.claude/hooks/bloqueia-comandos.sh` barra `ssh`/`kubectl`/docker remoto, `gh pr merge` e force push (inclusive `bash -c '...'`). `infra`/`deploy` passam onde cabe, via `agent_type`. Regra `deny` de Bash não pega `git -C . push` nem `bash -c`, por isso o hook.

## Por CLI
| CLI | Onde lê | Impõe `tools`? | Verificado |
|---|---|---|---|
| Claude Code | `.claude/agents/`, `.claude/skills/issue` | Sim | `/issue` rodado de ponta a ponta (analista, revisor, TDD, branch); hook barrou `ssh` |
| Antigravity (`agy`) | `.agents/agents/`, `.agents/skills/` | Não, herda do pai | lista os 4 papéis; `/issue` não testado |
| dsh (headless/tui) | `AGENTS.md`, `.agents/skills/` | Não (hook sim, via `dsh-setup`) | hooks barram ssh/.env/force push; AGENTS.md lido; `papel-analista`, `papel-revisor` e `issue` no catálogo; `/issue` ponta a ponta no headless (branch, analista com web, TDD vermelho/verde, revisor por subagent, commit) |

Só o Claude barra por ferramenta; Claude e dsh (com `dsh-setup`) barram por hook. No agy o alias `--dangerously-skip-permissions` e o `GEMINI.md` global em modo YOLO anulam a aprovação humana: use `infra`/`deploy` só no Claude.

### dsh (DeepSeek) — verificado em 2026-10-22 (dsh 0.2.1-rc.2)
- Lê o `AGENTS.md` do projeto (fallback `CLAUDE.md`) e descobre skills em `.agents/skills/` e `.dsh/skills/`; `~/.agents/skills` e `~/.dsh/skills` são os roots do usuário. **Não lê** `.claude/skills/` nem `.claude/agents/`: a cópia de `/issue` em `.claude/` é só do Claude.
- Não existe agent nomeado como no Claude: `.agents/agents/*.md` não é lido. Os papéis viram skills `papel-<n>`; para delegar, use a ferramenta `subagent` com o conteúdo do `SKILL.md` do papel no `prompt` (contexto limpo). Agent preset do dsh é YAML, não Markdown.
- `dsh headless` manda a tarefa crua ao modelo: não há slash command nem substituição de `$ARGUMENTS`. Por isso a cópia `.agents/skills/issue` é invocável pelo modelo (o Claude mantém `disable-model-invocation`) e manda usar o argumento da própria mensagem.
- Sem aprovação interativa no headless: a skill manda parar antes de editar se o prompt não concedeu o "sim".
- **Hooks de segurança valem no dsh depois de `node bin/dsh-setup.mjs`** (uma vez por máquina). O dsh não lê `.claude/settings.json`; o script instala nos perfis `dsh-tui` e `headless` o plugin `@deepseek-ai/dsh-hooks-claude-code` **mais** o `@deepseek-ai/dsh-hook-protocol` (sem ele o plugin falha ao carregar e nada é bloqueado) e liga `dsh/hooks.json`. Usa a versão igual à do `dsh --version`: a tag `latest` do npm está defasada e o dsh recusa. Verificado: `ssh` → "Bloqueado (acesso a host/cluster)", escrita de `.env` → "Bloqueado: ... é arquivo de segredo", `git push --force` → "Bloqueado (git push --force)", `npm test` segue liberado.
- Limites do bridge: a configuração é de processo (um arquivo para todos os projetos) e o `PreToolUse` não traz `agent_type`, então no dsh o hook é **sempre estrito**: `infra`/`deploy` seguem só no Claude. Analista/revisor ficam read-only por instrução (sem `tools`).
- Pré-requisito: `DEEPSEEK_API_KEY` no ambiente que lança o dsh (ou no cofre do dsh). Dentro do Orca o shell da ferramenta `bash` do dsh pode não herdá-la, e o git falha por `GIT_CONFIG_COUNT` sem `GIT_CONFIG_KEY_*` (do Orca): rode o dsh num terminal normal ou use `env -u GIT_CONFIG_COUNT -u GIT_CONFIG_VALUE_0 -u GIT_CONFIG_VALUE_1 git ...`. Confirme com uma chamada trivial (`dsh headless "Responda apenas: OK"`) antes de testar o fluxo.
- Evidência do teste: projeto temporário com `padraoai init`; `dsh headless --json` registrou `skill issue`, criação da branch, `subagent` analista com `web_fetch`/`web_search` no ViaCEP, `npm test` vermelho antes do código e verde depois, `subagent` revisor ("sem achados") e commit `feat: ... (#1)`.

## Quem acessa o quê
| Papel | Edita | Bash | Web | MCP | Aprovação humana |
|---|---|---|---|---|---|
| sessão da issue (orquestra + código) | sim | sim, menos host/merge/force push (hook) | não pede | ai-memory, sonarqube | merge e deploy são seus |
| analista | não | não | sim | ai-memory | não |
| revisor | não | só git diff/testes | não | sonarqube (leitura) | não |
| infra | não | sim (leitura) | não | ai-memory | **qualquer ação que muda estado** |
| deploy | não | sim (`gh`, script de deploy) | não | ai-memory | **antes de publicar** |

Hotfix não é agent: é a sessão da issue com branch de `master`, teste de regressão e PR separado. No Orca, para coordenar sessões reais use a skill `orchestration` dele.

## Convivência
- Uma frente escreve; as demais leem. Revisor em contexto limpo e só sobre correção/requisito.
- Subagents não criam subagents. Resultado longo vai para arquivo; devolve resumo + caminho.
- Skills/MCP/plugins de projeto ligam por projeto (`CATALOGO-SOB-DEMANDA.md`).
- Hosts, comandos permitidos e script de deploy ficam no `AGENTS.md` do projeto.
- Projeto que já tem `.claude/settings.json`: o `init` não sobrescreve. Some à mão o hook `bloqueia-comandos.sh` (matcher `Bash`).

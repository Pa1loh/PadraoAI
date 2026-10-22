# Time de agentes

Fonte única dos papéis. `npx github:Pa1loh/PadraoAI agents` (ou `node bin/agents-sync.mjs [projeto]`) gera o mesmo time para os 3 CLIs; `init` já faz isso sem sobrescrever.

## Desenho (e por quê)
- **A aba/worktree da issue é uma sessão normal**: ela orquestra e programa. Não há agent `dev`. A doc do Claude Code manda usar a conversa principal quando as fases (plano, código, teste) compartilham contexto, e subagents para isolamento, restrição de ferramentas e resultado em resumo.
- **Subagents**: `analista` e `revisor` (leitura, contexto limpo).
- **`infra` e `deploy`**: sessões separadas, abertas por você com `claude --agent infra|deploy`, porque ali a restrição de ferramentas e a aprovação humana fazem diferença.
- **`/issue <nº ou descrição>`**: o fluxo da issue como comando explícito (branch, analista, plano, TDD, revisor, PR). Delegação espontânea é pouco confiável; o comando não depende dela. No dsh headless não há slash command, então o `agents-sync` gera a cópia `.agents/skills/issue` sem `disable-model-invocation`; no Claude o `/issue` segue explícito.
- **Limites duros por hook**, não por prompt: `.claude/hooks/bloqueia-comandos.sh` barra `ssh`/`kubectl`/docker remoto, `gh pr merge` e force push (inclusive `bash -c '...'`). `infra`/`deploy` passam onde cabe, via `agent_type`. Regra `deny` de Bash não pega `git -C . push` nem `bash -c`, por isso o hook.

## Por CLI
| CLI | Onde lê | Impõe `tools`? | Verificado |
|---|---|---|---|
| Claude Code | `.claude/agents/`, `.claude/skills/issue` | Sim | `/issue` rodado de ponta a ponta (analista, revisor, TDD, branch); hook barrou `ssh` |
| Antigravity (`agy`) | `.agents/agents/`, `.agents/skills/` | Não, herda do pai | lista os 4 papéis; `/issue` não testado |
| dsh (headless/tui) | `AGENTS.md`, `.agents/skills/` | Não | AGENTS.md lido; `papel-analista`, `papel-revisor` e `issue` no catálogo; `/issue` ponta a ponta no headless (branch, analista com web, TDD vermelho/verde, revisor por subagent, commit) |

Só o Claude barra por ferramenta e por hook. No agy o alias `--dangerously-skip-permissions` e o `GEMINI.md` global em modo YOLO anulam a aprovação humana: use `infra`/`deploy` só no Claude.

### dsh (DeepSeek) — verificado em 2026-10-22 (dsh 0.2.1-rc.2)
- Lê o `AGENTS.md` do projeto (fallback `CLAUDE.md`) e descobre skills em `.agents/skills/` e `.dsh/skills/`; `~/.agents/skills` e `~/.dsh/skills` são os roots do usuário. **Não lê** `.claude/skills/` nem `.claude/agents/`: a cópia de `/issue` em `.claude/` é só do Claude.
- Não existe agent nomeado como no Claude: `.agents/agents/*.md` não é lido. Os papéis viram skills `papel-<n>`; para delegar, use a ferramenta `subagent` com o conteúdo do `SKILL.md` do papel no `prompt` (contexto limpo). Agent preset do dsh é YAML, não Markdown.
- `dsh headless` manda a tarefa crua ao modelo: não há slash command nem substituição de `$ARGUMENTS`. Por isso a cópia `.agents/skills/issue` é invocável pelo modelo (o Claude mantém `disable-model-invocation`) e manda usar o argumento da própria mensagem.
- Sem aprovação interativa no headless: a skill manda parar antes de editar se o prompt não concedeu o "sim".
- Não impõe `tools` nem o hook do PadraoAI (`.claude/settings.json` é só do Claude): analista/revisor ficam read-only por instrução. O aviso `@deepseek-ai/dsh-hooks-claude-code` é do plugin de hooks do Orca, não do PadraoAI, e não bloqueou nada.
- Pré-requisito: `DEEPSEEK_API_KEY` no ambiente que lança o dsh (ou no cofre do dsh). Confirme com uma chamada trivial (`dsh headless "Responda apenas: OK"`) antes de testar o fluxo.
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

# Time de agentes

Fonte única dos papéis. `node bin/agents-sync.mjs [projeto]` (ou `npx github:Pa1loh/PadraoAI agents`) gera o mesmo time para os 3 CLIs; `init` já faz isso sem sobrescrever.

| CLI | Onde lê o papel | Impõe `tools`? | Status |
|---|---|---|---|
| Claude Code | `.claude/agents/<n>.md` | **Sim** (`tools`/`disallowedTools`) | testado: lista os 5 |
| Antigravity (`agy`) | `.agents/agents/<n>.md` (subagent nativo) | **Não**: herda permissões do pai | testado: lista os 5 |
| dsh-tui (DeepSeek) | `.agents/skills/papel-<n>/SKILL.md` + `AGENTS.md` | Não (instrução) | não testado (falta `DEEPSEEK_API_KEY`); com `--backend claude` usa os de `.claude/` |

Só o Claude barra por ferramenta. Nos outros dois o limite é instrução, então o que importa de verdade vira hook/CI (inegociável 9) e aprovação humana.

## Quem acessa o quê

| Papel | Edita | Bash | Web | MCP | Skills | Aprovação humana |
|---|---|---|---|---|---|---|
| analista | não | não | sim | ai-memory | ai-memory-retrieval | não |
| dev (inclui hotfix) | **sim** | sim (build/teste) | não | ai-memory, sonarqube | tdd-regressao, worktrees, sonarqube | para infra/deploy: delega |
| revisor | não | só git diff/testes | não | sonarqube (leitura) | pr-audit, security-audit | não |
| infra | não | sim (leitura) | não | ai-memory | nenhuma | **qualquer ação que muda estado** |
| deploy | não | sim (`gh`, script de deploy) | não | ai-memory | release | **antes de publicar** |

Hotfix não é agente: é o modo do `dev` (branch de `master`, teste de regressão, PR separado).
Orquestrador também não: é a sessão principal (primary) ou você. No Orca, para coordenar sessões reais use a skill `orchestration` (do próprio Orca).

## Regras de convivência
- Um escreve (`dev`); os demais leem. Revisor sempre em contexto limpo.
- Subagents não criam subagents. Resultado longo vai para arquivo; devolve resumo + caminho.
- Skills/MCP/plugins de projeto (sonarqube, vercel, mercadopago…) ligam por projeto (`CATALOGO-SOB-DEMANDA.md`); o papel só os usa se existirem.
- Hosts, comandos permitidos e script de deploy de cada projeto ficam no `AGENTS.md` dele, não aqui.

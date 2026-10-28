# PadraoAI

Padrão de desenvolvimento com IA: XP, TDD, segurança, economia de tokens. Poucos arquivos, cada regra com o porquê e como é imposta.

## Adotar num projeto (novo ou existente)
```bash
npx github:Pa1loh/PadraoAI init     # cria AGENTS.md, ponteiros, templates de PR/issue/ADR e hook anti-segredo (nunca sobrescreve)
```
Depois diga ao agente: **"leia docs/padraoai/ADOTAR.md e adote o padrão"**. Ou, sem npx, aponte o agente para este repo (`LEIA-ME-AGENTE.md`).

## Mapa
| Arquivo | Para quê |
|---|---|
| `bin/` | `padraoai init \| agents \| engines`, `lint-contexto` (regra de contexto no CI), `dsh-setup` |
| `docs/` | benchmarks locais com data (hooks por engine, custo de contexto) |
| `inegociaveis.md` | 17 regras duras: regra, porquê, enforcement |
| `ADOTAR.md` | roteiro de adoção + checklist de verificação |
| `LEIA-ME-AGENTE.md` | porta de entrada para o agente |
| `agents/` | time de papéis (analista, dev, revisor, infra, deploy), skills `/issue`, `/issue-criar` e `/proximas` (lote paralelo em worktrees), matriz de acesso; `agents` gera para Claude/Antigravity/dsh |
| `templates/` | exemplos copiados pelo `init` (adapte, não cole cego): AGENTS.md, templates de PR/issue, `docs/engines.yml` (engine por papel) e `docs/agent-log.md` (registro por issue) |
| `rules/` | clean-architecture, tdd-protocol, clean-code-agents, dotnet-10 |
| `skills/` | núcleo: adotar-padrao, issue-criar, proximas, tdd-regressao, pr-audit, release, validate-agent-config, security-audit, sonarqube, worktrees, agent-browser, ai-memory-* |
| `extras/` | opcional: design, vídeo (watch), 3dprint, unity, humanizer, aliexpress, exemplos de infra/agents. `extras/infra-pessoal/` é homelab do mantenedor, não parte do padrão |
| `mcp/` | MCPs usados e quando |

Referências: Akita (akitaonrails.com, ailair), pedrosatin/skills, docs do Claude Code, arXiv 2602.11988.

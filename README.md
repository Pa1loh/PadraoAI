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
| `inegociaveis.md` | 17 regras duras: regra, porquê, enforcement |
| `ADOTAR.md` | roteiro de adoção + checklist de verificação |
| `LEIA-ME-AGENTE.md` | porta de entrada para o agente |
| `templates/` | exemplos copiados pelo `init` (adapte, não cole cego) |
| `rules/` | clean-architecture, tdd-protocol, clean-code-agents, dotnet-10 |
| `skills/` | skills (workflow e extras — reorganização em andamento) |
| `mcp/` | MCPs usados e quando |

Referências: Akita (akitaonrails.com, ailair), pedrosatin/skills, docs do Claude Code, arXiv 2602.11988.

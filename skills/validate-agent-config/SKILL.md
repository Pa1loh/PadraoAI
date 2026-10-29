---
name: validate-agent-config
description: Validar a configuração de IA do projeto (tamanho do AGENTS.md, ponteiros, frontmatter de skills, links e symlinks quebrados, duplicação). Use para "validar config", "auditar AGENTS.md", "por que o agente ignora regra".
---

# Validar configuração de agente

Rodar e reportar com números:
- `wc -l AGENTS.md CLAUDE.md`: AGENTS.md ≤ ~120 linhas; CLAUDE.md só `@AGENTS.md`.
- Mesmo bloco repetido em dois arquivos carregados? (`grep -c` de um trecho característico)
- Skills: cada `SKILL.md` tem `name` e `description` de 1 linha com gatilhos; < 120 linhas; sem skill sem uso.
- `find . ~/.claude/skills -maxdepth 2 -xtype l` → symlinks quebrados; `@imports` resolvem.
- Segredo em texto claro em `settings*.json`, `.mcp.json`, `.env*` versionado.
- Regra "sempre/nunca" sem hook ou CI correspondente → listar como candidata a enforcement.

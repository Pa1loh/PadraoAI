# Catálogo sob demanda (fora do global desde 2026-10-22)

Por quê: skill/plugin/MCP global entra no contexto de TODA sessão (Claude, DeepSeek via dsh-cc, Antigravity).
Regra: global = só o que se usa em quase toda sessão. O resto liga **por projeto**, quando precisa.
Global hoje: skills `worktrees`, `ai-memory-retrieval`, `ai-memory-handoff` (+ Orca: `orchestration`, `orca-cli`, `find-skills` em `~/.agents`); MCP só `ai-memory`.

## Skills (conteúdo fica aqui; `bin/skill-on <nome> [projeto]` cria o link só no projeto)
- `skills/`: agent-browser, security-audit, sonarqube, worktrees
- `extras/skills/`: 3dprint, aliexpress, asking-with-evidence, banner-design, brand, configuring-vision, design, design-system, extracting-structure, humanizer, learning-from-mistakes, recovering-from-errors, sharing-results, slides, the-loop, ui-styling, ui-ux-pro-max, video-memory, watch, watching-videos
- Omarchy (do sistema): `/usr/share/omarchy/default/agents/skills/{omarchy,diagnose-crash}`
- ai-memory raras (em `~/.claude/skills-off` e `~/.agents/skills-off`): durable-pages, learning-maintenance, messaging, routing-install

## Plugins (todos desligados no global; ligue no `.claude/settings.json` do projeto)
`{"enabledPlugins":{"mercadopago@claude-plugins-official":true}}` — também: vercel@claude-plugins-official, obsidian@obsidian-skills, clangd-lsp@claude-plugins-official.
Instalados no PC e usados por projeto (ex.: AfonsoV2 liga no `.claude/settings.json`): csharp-lsp, context7, sonarqube (`@claude-plugins-official`); claude-seo@agricidaniel-claude-seo.

## MCP (adicione no projeto: `claude mcp add -s project ...` grava `.mcp.json`)
- sonarqube: `claude mcp add -s project sonarqube -e DOCKER_CONTEXT=pcx86 -- sonar run mcp --read-only --project <CHAVE>`
- watch-skill (vídeo): `claude mcp add -s project watch-skill -- watch-skill serve`
- ender3 (impressora): `claude mcp add -s project ender3 -- "<venv>/bin/python" "<...>/Impressao 3D/_ferramentas/mcp/server.py"`
- unityMCP (só FarmRoguelike, que já tem `.mcp.json`): URL `http://127.0.0.1:8080/mcp`
- cloudflare / vercel / supabase: já estão no escopo de projeto em `~/.claude.json`.
- GitHub: usar `gh` (CLI) em vez de MCP. Token **nunca** em config: só variável de ambiente.
- Penpot (PC do mantenedor, já no ar, com MCP): só em projeto com UI. No AfonsoV2, só se a issue for o WebAdmin. Não é global.
- Blender (`/home/paulo/blender-mcp` no PC `100.122.231.113`): só em projeto que gera asset 3D. Não é global.
- Antigravity: MCP por projeto em `.gemini/` / `mcp_config.json` do projeto; global só ai-memory.

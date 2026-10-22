# MCP — estado real do PC (2026-10-22)

Global só `ai-memory` (`http://127.0.0.1:49374/mcp`), nos 3 CLIs: Claude (`claude mcp list`), Antigravity (`agy mcp list`), dsh (`/mcp`).
Conectores do claude.ai (Claude Docs, MercadoLibre) vêm da conta, não do repo.
GitHub: use `gh`, não MCP. Token nunca em config, só variável de ambiente.

Por projeto (ver `CATALOGO-SOB-DEMANDA.md`): sonarqube, watch-skill, ender3, unityMCP, cloudflare/vercel/supabase.
Quem acessa o quê por papel: `agents/README.md`.

dsh-tui: MCP entra no `~/.dsh/profiles/dsh-tui/cordis.patch.yml` via `@deepseek-ai/dsh-mcp-client` (stdio ou HTTP).

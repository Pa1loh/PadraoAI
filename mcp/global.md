# MCP — Configuração Global (Claude Code)

## Servidores MCP ativos globalmente

Configurado em `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<token configurado em ~/.claude/settings.json>"
      }
    }
  }
}
```

## O que o servidor GitHub MCP faz

- Permite ao Claude Code interagir com a API do GitHub diretamente
- Leitura de repositórios, issues, pull requests
- Criação/atualização de issues, comentários, PRs
- Pesquisa de código em repositórios remotos

## Plugins globais habilitados

Configurados em `~/.claude/settings.json`:

| Plugin | Descrição |
|---|---|
| `clangd-lsp@claude-plugins-official` | Language Server para C/C++ |
| `obsidian@obsidian-skills` | Integração com vault Obsidian (kepano/obsidian-skills) |

## Skills globais instaladas

| Skill | Caminho | Descrição |
|---|---|---|
| `3dprint` | `~/.claude/skills/3dprint/SKILL.md` | Assistente para Ender 3 V3 KE + PETG |

## Origem

Extraído de: `~/.claude/settings.json`

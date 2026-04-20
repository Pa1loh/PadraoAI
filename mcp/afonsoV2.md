# MCP — AfonsoV2 (Hub Afiliado)

## Servidores MCP configurados

Bloco JSON para `~/.config/claude/claude_desktop_config.json` (Arch Linux):

```json
{
  "mcpServers": {
    "filesystem-hub-afiliado": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/paulo/Documents/git/Dev Vault/AfonsoV2/src",
        "/home/paulo/Documents/git/Dev Vault/AfonsoV2/_legacy_code"
      ]
    },
    "sqlite-hub-afiliado": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sqlite",
        "--db-path",
        "/home/paulo/Documents/git/Dev Vault/AfonsoV2/src/API/data/hubafiliado.db"
      ]
    }
  }
}
```

## O que cada servidor faz

| Servidor | Acesso |
|---|---|
| `filesystem-hub-afiliado` | Leitura/escrita em `src/` e `_legacy_code/` — Claude lê código sem cópia manual |
| `sqlite-hub-afiliado` | Query direta no banco `hubafiliado.db` — inspecionar `RegistrosEnvio`, `MapeamentosGrupos`, etc. |

## Instalação

```bash
# Caminho do arquivo (Arch Linux):
mkdir -p ~/.config/claude
nano ~/.config/claude/claude_desktop_config.json
```

Reiniciar o Claude Desktop após salvar. Testar o MCP SQLite com:
```
Liste as últimas 10 entradas da tabela RegistrosEnvio.
```

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.claude/mcp-config.md`

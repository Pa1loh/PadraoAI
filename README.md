# PadraoAI

Repositório de referência consolidando os padrões de AI tooling, MCP, skills, agents e CI/CD usados nos projetos **AfonsoV2** (Hub Afiliado) e **imobiflow-crm** (Meu Corretor).

Serve como ponto de partida para análise de infraestrutura, reutilização de configurações e evolução dos padrões de desenvolvimento assistido por AI.

---

## Estrutura

```
PadraoAI/
├── INFRA.md                       # Descrição consolidada das duas infras + comparação
│
├── mcp/
│   ├── global.md                  # GitHub MCP + plugins globais do Claude Code
│   └── afonsoV2.md                # MCP filesystem + SQLite do Hub Afiliado
│
├── skills/
│   ├── aliexpress.md              # Skill: AliExpress Portals API v2 (AfonsoV2)
│   └── 3dprint/
│       └── SKILL.md               # Skill global: Ender 3 V3 KE + PETG + OrcaSlicer
│
├── rules/
│   ├── dotnet-10.md               # Rules: .NET 10 / C# 14 — sintaxe, nomenclatura, patterns
│   └── video-audio-mix.md         # Rule: separação narração ElevenLabs vs música trend
│
├── agents/
│   ├── sonar-fix-afonsoV2.md      # Agent: sonar-fix para HubAfiliado
│   └── sonar-fix-imobiflow.md     # Agent: sonar-fix para ImobiFlow-CRM
│
└── cicd/
    ├── imobiflow-overview.md      # CI/CD do ImobiFlow: jobs, secrets, quality gate
    └── afonsoV2-overview.md       # CI/CD do AfonsoV2: jobs, Blue-Green, gitleaks
```

---

## Projetos de Origem

| Projeto | Caminho | Stack |
|---|---|---|
| Hub Afiliado | `../AfonsoV2/` | .NET 10 + SQLite + Telegram.Bot |
| ImobiFlow CRM | `../imobiflow-crm/` | React 19 + .NET 10 + PostgreSQL |

---

## Infraestrutura Compartilhada

| Recurso | Detalhe |
|---|---|
| Hardware | Orange Pi ARM64 |
| GitHub Actions runner | `self-hosted, linux, arm64` |
| SonarQube | `http://100.106.88.49:9001` (Tailscale) |
| Acesso remoto | Tailscale VPN |
| .NET SDK | `/home/paulo/.dotnet` |

---

## Leitura Recomendada

1. `INFRA.md` — visão completa das duas infras e comparação de padrões
2. `cicd/` — entender o pipeline antes de qualquer alteração de deploy
3. `agents/sonar-fix-*.md` — corrigir quality gates SonarQube
4. `rules/dotnet-10.md` — referência de sintaxe C# 14 / .NET 10
5. `mcp/` — configurar MCP servers no Claude Desktop

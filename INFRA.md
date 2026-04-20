# Infraestrutura dos Projetos — Visão Consolidada

> Documento de referência para análise de padrões de infra, AI tooling e CI/CD.
> Gerado a partir dos projetos `AfonsoV2` e `imobiflow-crm`.

---

## Hardware Compartilhado

Ambos os projetos rodam no mesmo servidor self-hosted:

| Recurso | Detalhe |
|---|---|
| Hardware | Orange Pi (ARM64) |
| Acesso remoto | Tailscale VPN |
| Runner GitHub Actions | `self-hosted, linux, arm64` |
| SonarQube | `http://100.106.88.49:9001` (Tailscale) |
| .NET SDK | `/home/paulo/.dotnet` (e `/home/orangepi/.dotnet` no runner) |

---

## Projeto 1 — ImobiFlow CRM (Meu Corretor)

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | .NET 10, ASP.NET Core, EF Core 10 |
| Banco de dados | PostgreSQL 17 |
| ORM | Npgsql + Entity Framework Core |
| Containerização | Docker Compose |
| Reverse proxy | Nginx (proxy `/api/*` → backend, sem CORS) |
| Acesso seguro | Tailscale serve |
| Testes backend | xUnit, FluentAssertions, Moq |
| Testes frontend | Vitest |
| Testes E2E | Playwright (Chromium headless) |

### Arquitetura

Clean Architecture + DDD (Domain-Driven Design):

```
Domain → Application → Infrastructure
               ↑               ↑
               └─── API ───────┘
```

- **Domain:** Entidades, Value Objects (`sealed record`), regras de negócio puras. Zero deps externas.
- **Application:** Use cases, DTOs, interfaces. Depende apenas do Domain.
- **Infrastructure:** EF Core, repositórios, upload de arquivos, serviços externos. Implementa interfaces do Domain/Application.
- **API:** Controllers finos, middleware, DI. Depende de Application + Infrastructure.

**Projeto real:** `backend/src/MeuCorretor.{Domain,Application,Infrastructure,API}/`

### Ambientes e Portas

| Ambiente | API | Frontend | Banco |
|---|---|---|---|
| Local (Docker Compose) | `5010` | `3000` | `5433` |
| DEV/QA (Orange Pi) | `5011` | `3001` | PostgreSQL persistente |
| PROD | (pendente runner dedicado) | — | — |

### CI/CD Pipeline

```
pull_request ──► [PR Gate]
                  ├── dotnet format verify
                  ├── dotnet list package --vulnerable
                  ├── dotnet build -c Release
                  ├── dotnet test
                  ├── npm ci
                  ├── npm run lint
                  └── npm test

push (dev) ──────► [Deploy DEV] ──► [SonarQube]
                    ├── dotnet publish              ├── sonarscanner begin
                    ├── docker compose up           ├── build + coverage
                    ├── health check /healthz       ├── sonarscanner end
                    └── Playwright E2E smoke        └── Quality Gate check

push (release/*) ─► [SonarQube]
push (master) ────► [Deploy PROD] (TODO)
```

**Project key SonarQube:** `ImobiFlow-CRM`

### Convenções de Código

- Português para domínio: `Imovel`, `Endereco`, `StatusImovel`, `DomainException`
- Inglês para infra técnica
- Aggregate roots com factory method estático `Criar(...)`
- Value Objects imutáveis com `sealed record`
- `AsNoTracking()` obrigatório em todas as queries de leitura EF Core
- TypeScript: sem `any`, hooks em `frontend/src/hooks/`, HTTP apenas via `frontend/src/services/api.ts`

### AI Tooling

- **CLAUDE.md:** `imobiflow-crm/CLAUDE.md` — guia completo do projeto
- **CODEX.md:** documentação técnica central (visão, arquitetura, CI/CD, testing)
- **Agent workflows:** `imobiflow-crm/.agents/workflows/sonar-fix.md`
- **Claude Code settings:** `imobiflow-crm/.claude/settings.local.json` (permissões Docker, .NET, npm)

---

## Projeto 2 — AfonsoV2 (Hub Afiliado)

### Stack

| Camada | Tecnologia |
|---|---|
| Backend | .NET 10 monolítico, ASP.NET Core, EF Core |
| Banco de dados | SQLite (`hubafiliado.db`) |
| Bot | Telegram.Bot |
| Automação social | Playwright (postagem Instagram/TikTok/Shorts) |
| TTS | ElevenLabs API |
| Vídeo | FFmpeg (geração local de Reels) |
| Containerização | Docker Compose (multi-slot) |
| Testes | xUnit, Moq |
| Benchmarks | BenchmarkDotNet |
| Security scan | gitleaks |

### Arquitetura

Clean Architecture monolítica (Português puro):

```
Domain → Service → Infra → API
```

- **Domain:** Entidades, interfaces, exceptions. Zero deps externas.
- **Service:** Casos de uso, validações (FluentValidation).
- **Infra:** SQLite, HTTP clients (AliExpress, Shopee), Telegram.Bot.
- **API:** Controllers, BackgroundServices (Workers), Channels, DI.

**Solução:** `src/HubAfiliado.sln`  
**Projetos:** `src/{Domain,Service,Infra,API,Tests,Benchmarks}/`

### Ambientes e Deploy

| Ambiente | Porta | Variável `AMBIENTE` | Workers ativos |
|---|---|---|---|
| Production | `80` | `Production` | BuscaOfertas + EnviaOfertas + CapturaLeads |
| Dev | `8082` | `Dev` | QaListenerWorker (comandos estendidos) |
| QA | — | `QA` | QaListenerWorker (só `Oferta`) |

**Deploy Blue-Green:** `scripts/deploy.sh` (prod) / `scripts/deploy-dev.sh` (dev)  
**Health check:** automático via Nginx durante Blue-Green

### CI/CD Pipeline

```
todo push/PR ─► [Security Scan (gitleaks)]

pull_request ──► [Build & Test]
                  ├── fix IPv4 preference
                  ├── dotnet format verify
                  ├── dotnet restore
                  ├── dotnet list package --vulnerable
                  ├── dotnet build -c Release
                  └── dotnet test -c Release

push (develop) ──► [Deploy Dev] ‖ [SonarQube]   (paralelo)
                    ├── restaura .env.dev          ├── sonarscanner begin /k:"HubAfiliado"
                    └── deploy-dev.sh             ├── build + OpenCover coverage
                                                  ├── sonarscanner end
                                                  ├── aguarda task (até 4min)
                                                  ├── busca métricas/gate/issues/hotspots
                                                  ├── gera sonar-report.txt
                                                  ├── upload artifact (30d)
                                                  └── falha se Quality Gate reprovado

push (release/**) ─► [SonarQube]
push (master) ─────► [Deploy Prod (Blue-Green)]
```

**Project key SonarQube:** `HubAfiliado`

### Marketplaces integrados

| Marketplace | Método | Testes de regressão |
|---|---|---|
| AliExpress | Portals API v2 (`affiliate.link.generate`) | `AliExpressClientTests.cs` (5 cenários) |
| Shopee | Scraper HTML | `ShopeeScraperTests.cs` |
| Campea | ChampionScore (multi-source) | Integração AliExpress + Shopee |

### Convenções de Código

- **100% Português** — classes, métodos, variáveis, documentação, commits
- Primary Constructors obrigatórios (Workers, Services)
- Records imutáveis para DTOs
- File-scoped namespaces obrigatórios
- `CancellationToken` em todos os métodos I/O
- Error handling: log + retornar null (sem Result Pattern)
- Cognitive complexity ≤ 15 (anti-Sonar)

### AI Tooling

- **CLAUDE.md:** `AfonsoV2/CLAUDE.md` — regras detalhadas, protocolo TDD, anti-Sonar, token economy
- **system-prompt-master.md:** `AfonsoV2/.claude/system-prompt-master.md` — nexus do sistema
- **Skills:** `AfonsoV2/.claude/skills/aliexpress.md`
- **Rules:** `AfonsoV2/.claude/rules/{dotnet-10,video-audio-mix}.md`
- **Commands:** `AfonsoV2/.claude/commands/sonar-fix.md`
- **MCP:** filesystem (`src/`, `_legacy_code/`) + SQLite (`hubafiliado.db`)
- **Settings:** `AfonsoV2/.claude/settings.json` (hooks pre-tool) + `settings.local.json` (146+ permissões)

---

## Comparação de Padrões

| Aspecto | ImobiFlow CRM | AfonsoV2 |
|---|---|---|
| **Linguagem principal** | C# + TypeScript | C# (100% PT-BR) |
| **Banco de dados** | PostgreSQL 17 | SQLite |
| **Frontend** | React 19 + Vite | N/A (Telegram bot) |
| **Testes E2E** | Playwright (browser) | Playwright (automação social) |
| **Deploy** | Docker Compose | Blue-Green + Docker Compose |
| **SonarQube** | Project: `ImobiFlow-CRM` | Project: `HubAfiliado` |
| **Security scan CI** | Não explícito no CI | gitleaks (todo push) |
| **Pre-push hook** | `scripts/install-hooks.sh` | `scripts/setup-hooks.sh` |
| **Cobertura alvo** | Não especificada | 100% Domain + Service |
| **Agent workflows** | `.agents/workflows/` | `.claude/commands/` |
| **MCP configurado** | Não (só settings local) | filesystem + sqlite |
| **Documentação extra** | CODEX.md, INTEGRATION.md, Nexus.md | APRENDIZAGEMTECNICA.md, BACKLOG_MESTRE_V2.md, GITFLOW.md |

---

## Padrões Comuns (Cross-project)

1. **Clean Architecture** — ambos usam a mesma separação em camadas
2. **TDD obrigatório** — Red → Green → Refactor em ambos
3. **SonarQube** — mesmo servidor Orange Pi (`100.106.88.49:9001`), quality gate bloqueante
4. **GitHub Actions self-hosted** — mesmo runner ARM64 Orange Pi
5. **Conventional Commits** — em Português
6. **Pre-commit/pre-push hooks** — validação local antes do CI
7. **AsNoTracking()** — em todas as queries de leitura EF Core
8. **Return Early** — evitar if/else aninhado
9. **Sem magic strings/numbers** — enums ou constantes
10. **sonar-fix agent** — ambos têm workflow para corrigir issues do SonarQube automaticamente

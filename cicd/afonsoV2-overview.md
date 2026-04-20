# CI/CD — AfonsoV2 (Hub Afiliado)

## Visão Geral

- **Plataforma:** GitHub Actions
- **Runner:** Self-hosted (Orange Pi ARM64)
- **Arquivo:** `.github/workflows/ci.yml`
- **Triggers:** `pull_request` para `develop`/`master` + `push` para `develop`/`master`/`release/**`
- **Permissões:** `contents: read` (princípio do menor privilégio)

## Jobs e Fluxo

```
push/PR (todos) → [security-scan]
pull_request    → [build-and-test]
push (develop)  → [deploy-dev] ‖ [sonar]   (paralelo)
push (release/*)→ [sonar]
push (master)   → [deploy-prod] (Blue-Green)
```

### Job 0: Security Scan (`security-scan`)

**Roda em:** TODO push e PR  
**Ferramenta:** `gitleaks v8.18.4`

Etapas:
1. `actions/checkout` com `fetch-depth: 0` (histórico completo)
2. Instala gitleaks (auto-detect ARM64/x64/armv7)
3. `gitleaks detect --source . --log-opts="--all"` — escaneia todo histórico
4. Gera relatório SARIF em `/tmp/gitleaks-report.sarif`

**Allowlist:** `.gitleaks.toml` no root do projeto (placeholders fictícios permitidos)

### Job 1: Build & Test (`build-and-test`)

**Roda em:** pull_request somente  
**Runner:** self-hosted

Etapas:
1. Fix IPv4 preference (workaround NuGet em runners com IPv6 instável)
2. `dotnet format --verify-no-changes`
3. `dotnet restore`
4. Auditoria de pacotes vulneráveis (`dotnet list package --vulnerable`)
5. `dotnet build -c Release`
6. `dotnet test -c Release --verbosity normal`

### Job 2: SonarQube (`sonar`)

**Roda em:** push para `develop` ou `release/**`  
**Runner:** self-hosted  
**Concorrência:** cancela run anterior do mesmo ref

Etapas:
1. Verifica SonarQube UP em `localhost:9001` (6 tentativas × 5s)
2. `dotnet restore`
3. Instala/atualiza `dotnet-sonarscanner`
4. `dotnet sonarscanner begin /k:"HubAfiliado"` com cobertura OpenCover
5. Build + testes com cobertura (`--collect:"XPlat Code Coverage;Format=opencover"`)
6. `dotnet sonarscanner end`
7. Aguarda task processing (24 tentativas × 10s)
8. Valida token, busca métricas + gate + issues + hotspots
9. Gera `sonar-report.txt` detalhado (Python inline)
10. Upload artifact `sonar-report` (retention: 30 dias)
11. Falha se Quality Gate reprovado

**Exclusões:**
- `src/Tests/**`, `src/**/Migrations/**`, `**/*.Designer.cs`, `**/*.g.cs`

### Job 3: Deploy Dev (`deploy-dev`)

**Roda em:** push para `develop`  
**Slot:** porta `8082`

Etapas:
1. Restaura `.env.dev` de `/home/orangepi/hubafiliado-dev-data/.env.dev`
2. `bash scripts/deploy-dev.sh`

### Job 4: Deploy Produção (`deploy-prod`)

**Roda em:** push para `master`  
**Estratégia:** Blue-Green com health check e rollback automático via Nginx

Etapas:
1. Restaura `.env` de `/home/orangepi/hubafiliado-data/.env`
2. `bash scripts/deploy.sh` (Blue-Green)

## Secrets necessários

| Secret | Uso |
|---|---|
| `SONAR_TOKEN` | Autenticação SonarQube (tipo: User Token) |

## Infraestrutura Orange Pi

- **SonarQube:** `http://100.106.88.49:9001` (Tailscale) — `docker compose -f docker-compose.sonar.yml up -d`
- **Dev slot:** porta `8082`
- **Prod:** porta `80` (Blue-Green)

## GitFlow

```
feature/* (de develop)
    └─► PR → develop  (deploy-dev automático, porta 8082)
                └─► PR → release/vX.Y.Z  (sonar gate)
                              └─► PR → master  (deploy Blue-Green prod)
```

Hotfixes: `hotfix/*` derivado de `master` → PR para `master` E `develop`.

## Quality Gate Local (antes do push)

Pre-commit hook instalado via: `bash scripts/setup-hooks.sh`

O hook valida:
1. `dotnet format`
2. `dotnet test`
3. `gitleaks detect` (scan de secrets)

Fluxo completo pré-PR:
```bash
dotnet format src/HubAfiliado.sln
dotnet test src/HubAfiliado.sln
/sonar-fix                           # corrigir issues Sonar localmente
git commit                           # pre-commit hook valida tudo
gh pr create
```

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.github/workflows/ci.yml`

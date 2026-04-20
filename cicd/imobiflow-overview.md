# CI/CD — ImobiFlow CRM (Meu Corretor)

## Visão Geral

- **Plataforma:** GitHub Actions
- **Runner:** Self-hosted, Linux, ARM64 (Orange Pi)
- **Arquivo:** `.github/workflows/ci.yml`
- **Triggers:** `pull_request` para `master`/`dev` + `push` para `master`/`dev`/`release/*`

## Jobs e Fluxo

```
pull_request → [pr-gate]
push (dev)   → [deploy-dev] → [sonar]
push (release/*) → [sonar]
push (master) → [deploy-prod] (TODO: aguardando runner PROD dedicado)
```

### Job 1: PR Gate (`pr-gate`)

**Roda em:** pull_request  
**Runner:** self-hosted ARM64

Etapas:
1. `dotnet format` verify — formatação C# (`.editorconfig`)
2. `dotnet list package --vulnerable` — auditoria NuGet
3. `dotnet build -c Release` — build backend
4. `dotnet test -c Release` — testes backend (xUnit)
5. `npm ci` — instalar deps frontend
6. `npm run lint` — ESLint
7. `npm test -- --run` — testes Vitest

### Job 2: Deploy DEV/QA (`deploy-dev`)

**Roda em:** push para `dev`  
**Runner:** self-hosted ARM64

Etapas:
1. `dotnet publish` — gera artefatos do backend
2. `docker compose -f docker-compose.dev.yml up -d --build` — sobe stack DEV
3. Health check — `GET http://localhost:5011/healthz` (12 tentativas × 5s)
4. E2E Smoke Tests (Playwright Chromium) — `E2E_BASE_URL=http://localhost:3001`

**Portas DEV:**
- API: `5011`
- Frontend: `3001`

### Job 3: SonarQube (`sonar`)

**Roda em:** push para `dev` ou `release/*` (após `deploy-dev`)  
**Runner:** self-hosted ARM64  
**Timeout:** 25 min

Etapas:
1. `dotnet sonarscanner begin` com project key `ImobiFlow-CRM`
2. Build + cobertura OpenCover (`XPlat Code Coverage`)
3. `npm test -- --coverage --run` — cobertura frontend LCOV
4. `dotnet sonarscanner end`
5. `python3 scripts/sonar_report.py` — verifica Quality Gate via API REST

**Exclusões do Sonar:**
- `**/node_modules/**`, `**/dist/**`, `**/Migrations/**`
- `frontend/src/components/ui/**` (shadcn/ui components)

### Job 4: Deploy PROD (`deploy-prod`)

**Status:** TODO — aguardando runner PROD dedicado  
**Template preservado:** `docker-compose.prod.yml`

## Secrets necessários

| Secret | Uso |
|---|---|
| `SONAR_TOKEN` | Autenticação SonarQube |
| `CONNECTION_STRING_DEV` | PostgreSQL DEV |
| `JWT_KEY_DEV` | JWT signing key DEV |
| `TAILSCALE_AUTHKEY` | Tailscale para acesso seguro |

## Infraestrutura Orange Pi

- **SonarQube:** `http://100.106.88.49:9001` (Tailscale)
- **DEV slot:** porta `5011` (API) + `3001` (Frontend)
- **Nginx:** proxy `/api/*` → API, sem CORS no browser

## Quality Gate Local (antes do push)

Script obrigatório: `bash scripts/pipeline.sh`

| Step | Verificação |
|---|---|
| 1 | `dotnet format --verify-no-changes` |
| 2 | `dotnet list package --vulnerable` |
| 3 | `npm audit` (HIGH/CRITICAL) |
| 4 | `dotnet build -c Release` |
| 5 | `dotnet test` |
| 6 | `npm run lint` |
| 7 | `npm test` |
| 8 | `npm run test:e2e` (se `E2E_BASE_URL` definida) |

Pre-push hook instalado via: `bash scripts/install-hooks.sh`

## Origem

Projeto: `imobiflow-crm`
Fonte: `imobiflow-crm/.github/workflows/ci.yml`

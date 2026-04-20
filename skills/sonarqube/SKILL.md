---
name: sonarqube
description: >
  Consultar e corrigir issues do SonarQube. Use quando o usuário mencionar
  sonar-fix, quality gate, SonarQube, code smells, bugs Sonar, coverage,
  dívida técnica, BLOCKER, CRITICAL, csharpsquid, typescript:S.
---

# /sonarqube — Consultar e corrigir issues do SonarQube

## Configuração por projeto

Antes de executar, identifique o projeto atual e use as variáveis corretas:

| Projeto | PROJECT_KEY | SOLUTION | RAIZ |
|---|---|---|---|
| AfonsoV2 | `HubAfiliado` | `src/HubAfiliado.sln` | `/home/paulo/Documents/git/Dev Vault/AfonsoV2` |
| imobiflow-crm | `ImobiFlow-CRM` | `backend/MeuCorretor.slnx` | `/home/paulo/Documents/git/Dev Vault/imobiflow-crm` |

**SonarQube:** `http://100.106.88.49:9001` (Orange Pi via Tailscale)  
Se não responder: `ssh orangepi "docker compose -f ~/docker-compose.sonar.yml up -d"`

---

## Passo 1 — Buscar issues

```bash
SONAR_URL="http://100.106.88.49:9001"
# TOKEN: usar $SONAR_TOKEN do ambiente ou o token do projeto

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/issues/search?componentKeys=$PROJECT_KEY&ps=500&p=1&statuses=OPEN,CONFIRMED,REOPENED&types=BUG,VULNERABILITY,CODE_SMELL" \
  -o /tmp/sonar-issues.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/measures/component?component=$PROJECT_KEY&metricKeys=coverage,bugs,vulnerabilities,code_smells,sqale_debt_ratio" \
  -o /tmp/sonar-metrics.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/qualitygates/project_status?projectKey=$PROJECT_KEY" \
  -o /tmp/sonar-gate.json
```

## Passo 2 — Exibir resumo

Use Python3 para parsear e exibir:
```
Quality Gate: OK / ERROR
Bugs: N | Vulnerabilidades: N | Code Smells: N
Cobertura: X% | Dívida técnica: X%
```

Para cada issue extraia: `component`, `line`, `rule`, `message`, `severity`, `type`.  
Path do arquivo = remover prefixo `$PROJECT_KEY:` do `component`.

## Passo 3 — Corrigir por severidade (BLOCKER → CRITICAL → MAJOR)

1. Ler o arquivo com Read tool
2. Identificar o problema na linha indicada
3. Corrigir seguindo as regras:

### Rules C# mais comuns

| Rule | Problema | Correção |
|---|---|---|
| `csharpsquid:S1135` | TODO/FIXME | Implementar ou remover |
| `csharpsquid:S1481` | Variável não usada | Remover |
| `csharpsquid:S1172` | Parâmetro não usado | Remover ou `_` prefix |
| `csharpsquid:S2699` | Teste sem Assert | Adicionar Assert |
| `csharpsquid:S4144` | Métodos duplicados | Extrair método compartilhado |
| `csharpsquid:S2971` | `.Count() > 0` | Usar `.Any()` |
| `csharpsquid:S6966` | Async sem await | Remover async ou adicionar await |
| `csharpsquid:S3267` | Loop → LINQ | Converter se legível |
| `csharpsquid:S1128` | Using desnecessário | Remover |

### Rules TypeScript (imobiflow-crm)

| Rule | Problema | Correção |
|---|---|---|
| `typescript:S1135` | TODO/FIXME | Implementar ou remover |
| `typescript:S3776` | Complexidade cognitiva alta | Extrair métodos, Return Early |

### Obrigatório ao corrigir

- Português para nomes novos (domínio)
- Primary Constructors em classes novas
- Return Early — sem if/else aninhado
- `AsNoTracking()` em toda query EF Core de leitura
- Sem magic strings — usar constantes ou enums
- Nunca quebrar interface pública existente
- **Nunca** criar mocks de produção (mocks só em testes)

## Passo 4 — Verificar

```bash
export DOTNET_ROOT=$HOME/.dotnet && export PATH=$DOTNET_ROOT:$PATH

# Formatação
dotnet format $SOLUTION --verify-no-changes 2>&1 || \
  (dotnet format $SOLUTION && echo "Formatação aplicada")

# Testes backend
dotnet test $SOLUTION --configuration Release --verbosity minimal 2>&1
```

Para imobiflow-crm, adicionar:
```bash
cd frontend && npm run lint 2>&1
```

## Passo 5 — Relatório final

```
Issues corrigidos: N/Total
Testes: PASS (N testes) ou FAIL
Quality Gate estimado: OK / PENDENTE
```

Se houver issues não corrigíveis automaticamente (cobertura insuficiente, arquitetura a redesenhar), listar com explicação do que fazer manualmente.

---
description: Consultar e corrigir issues do SonarQube para o projeto ImobiFlow-CRM
---

# /sonar-fix — Consultar e corrigir issues do SonarQube (ImobiFlow CRM)

## Uso
```
/sonar-fix [SONAR_URL] [SONAR_TOKEN]
```

Exemplos:
- `/sonar-fix` → usa as credenciais padrão do projeto
- `/sonar-fix http://192.168.1.10:9001 squ_abc123` → override de URL e token

---

## O que este comando faz

1. Conecta ao SonarQube e busca **todos** os issues abertos do projeto `ImobiFlow-CRM`
2. Exibe um relatório resumido (bugs, vulnerabilidades, code smells, hotspots)
3. Corrige cada issue no arquivo afetado, respeitando as regras do projeto
4. Roda `dotnet format && dotnet test` para confirmar que nada quebrou

---

## Instruções para execução

Os argumentos fornecidos são: `$ARGUMENTS`

### Passo 1 — Determinar credenciais

Credenciais fixas do projeto (use sempre estes defaults, salvo override via `$ARGUMENTS`):
- **URL:** `http://100.106.88.49:9001`
- **Project key:** `ImobiFlow-CRM`
- **Solution:** `backend/MeuCorretor.slnx`

### Passo 2 — Buscar issues do SonarQube

Execute via Bash (projectKey = `ImobiFlow-CRM`):
```bash
curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/issues/search?componentKeys=ImobiFlow-CRM&ps=500&p=1&statuses=OPEN,CONFIRMED,REOPENED&types=BUG,VULNERABILITY,CODE_SMELL" \
  -o /tmp/sonar-issues.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/measures/component?component=ImobiFlow-CRM&metricKeys=coverage,bugs,vulnerabilities,code_smells,sqale_debt_ratio" \
  -o /tmp/sonar-metrics.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/qualitygates/project_status?projectKey=ImobiFlow-CRM" \
  -o /tmp/sonar-gate.json
```

Se o SonarQube não responder:
```bash
ssh orangepi "docker compose -f ~/docker-compose.sonar.yml up -d"
```

### Passo 3 — Parsear e exibir resumo

Use Python3 para parsear os arquivos JSON e exibir:
```
Quality Gate: OK / ERROR
Bugs: N | Vulnerabilidades: N | Code Smells: N | Hotspots: N
Cobertura: X% | Dívida técnica: X%
```

O path do arquivo real é: remova o prefixo `ImobiFlow-CRM:` do `component`.  
A raiz do projeto é `/home/paulo/Documents/git/Dev Vault/imobiflow-crm`.

### Passo 4 — Corrigir cada issue

Para cada issue (priorize por severidade: BLOCKER → CRITICAL → MAJOR → MINOR):

#### Regras de correção por tipo de rule SonarQube:

| Rule | Problema comum | Correção |
|---|---|---|
| `csharpsquid:S1135` | TODO/FIXME no código | Implementar ou remover o TODO |
| `csharpsquid:S1481` | Variável local não usada | Remover a variável |
| `csharpsquid:S1172` | Parâmetro não usado | Remover ou usar `_` prefix |
| `csharpsquid:S2699` | Teste sem Assert | Adicionar Assert apropriado |
| `csharpsquid:S4144` | Métodos duplicados | Extrair para método compartilhado |
| `csharpsquid:S2971` | LINQ ineficiente | Usar `.Any()` em vez de `.Count() > 0` |
| `csharpsquid:S6966` | Async sem await | Remover async ou adicionar await |
| `csharpsquid:S1128` | Using desnecessário | Remover o using |
| `typescript:S1135` | TODO/FIXME em TypeScript | Implementar ou remover o TODO |
| `typescript:S3776` | Complexidade cognitiva alta | Extrair métodos, aplicar Early Return |

#### Regras obrigatórias ao corrigir (conforme CLAUDE.md):

**C# / .NET:**
- Português para nomes de domínio (`Imovel`, `Endereco`, `StatusImovel`)
- Value Objects imutáveis com `sealed record`
- `AsNoTracking()` em toda query EF Core de leitura
- Primary Constructors em classes novas
- Return Early para evitar if/else aninhado

**TypeScript / React (frontend):**
- Nunca usar `any` explícito
- Hooks customizados em `frontend/src/hooks/`
- Chamadas de API apenas via `frontend/src/services/api.ts`

### Passo 5 — Verificar

```bash
export DOTNET_ROOT=$HOME/.dotnet && export PATH=$DOTNET_ROOT:$PATH
dotnet format backend/MeuCorretor.slnx --verify-no-changes 2>&1 || \
  (dotnet format backend/MeuCorretor.slnx && echo "Formatação aplicada")
dotnet test backend/MeuCorretor.slnx --configuration Release --verbosity minimal 2>&1
cd frontend && npm run lint 2>&1
```

### Passo 6 — Relatório final

Exiba:
```
Issues corrigidos: N/Total
Testes backend: PASS (N testes) | FAIL
Lint frontend:  PASS | FAIL (N erros)
Quality Gate estimado: OK / PENDENTE
```

---

## Notas importantes

- **SonarQube:** `http://100.106.88.49:9001` (Orange Pi, acessível via Tailscale)
- **Project key:** `ImobiFlow-CRM`
- **Solution:** `backend/MeuCorretor.slnx`
- **Raiz do projeto:** `/home/paulo/Documents/git/Dev Vault/imobiflow-crm`
- Frontend: componentes de UI em `frontend/src/components/ui/` são excluídos da análise do Sonar

## Origem

Projeto: `imobiflow-crm` (Meu Corretor)
Fonte: `imobiflow-crm/.agents/workflows/sonar-fix.md`

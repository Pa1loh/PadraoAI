# /sonar-fix — Consultar e corrigir issues do SonarQube (AfonsoV2 / Hub Afiliado)

## Uso
```
/sonar-fix [SONAR_URL] [SONAR_TOKEN]
```

Exemplos:
- `/sonar-fix` → usa env vars `SONAR_HOST_URL` e `SONAR_TOKEN`
- `/sonar-fix http://192.168.1.10:9001 squ_abc123` → passa URL e token direto

---

## O que este comando faz

1. Conecta ao SonarQube e busca **todos** os issues abertos do projeto `HubAfiliado`
2. Exibe um relatório resumido (bugs, vulnerabilidades, code smells)
3. Corrige cada issue no arquivo afetado, respeitando as regras do projeto
4. Roda `dotnet format && dotnet test` para confirmar que nada quebrou

---

## Instruções para execução

Os argumentos fornecidos são: `$ARGUMENTS`

### Passo 1 — Determinar credenciais

Credenciais fixas do projeto (use sempre estes defaults, salvo override via `$ARGUMENTS`):
- **URL:** `http://100.106.88.49:9001`
- **Project key:** `HubAfiliado`

Extraia do argumento `$ARGUMENTS` apenas se fornecido:
- Se dois tokens separados por espaço: primeiro = URL, segundo = TOKEN (override)
- Se vazio: use os valores fixos acima

### Passo 2 — Buscar issues do SonarQube

Execute via Bash (projectKey = `HubAfiliado`):
```bash
curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/issues/search?componentKeys=HubAfiliado&ps=500&p=1&statuses=OPEN,CONFIRMED,REOPENED&types=BUG,VULNERABILITY,CODE_SMELL" \
  -o /tmp/sonar-issues.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/measures/component?component=HubAfiliado&metricKeys=coverage,bugs,vulnerabilities,code_smells,sqale_debt_ratio" \
  -o /tmp/sonar-metrics.json

curl -fs -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/qualitygates/project_status?projectKey=HubAfiliado" \
  -o /tmp/sonar-gate.json
```

### Passo 3 — Parsear e exibir resumo

Use Python3 para parsear `/tmp/sonar-issues.json` e exibir:
```
Quality Gate: OK/ERROR
Bugs: N | Vulnerabilidades: N | Code Smells: N
Cobertura: X% | Dívida técnica: X%
```

Para cada issue, extraia:
- `component`: path relativo (ex: `HubAfiliado:src/Infra/AliExpress/AliExpressClient.cs`)
- `line`: linha do problema
- `rule`: regra SonarQube (ex: `csharpsquid:S1135`)
- `message`: descrição do issue
- `severity`: BLOCKER / CRITICAL / MAJOR / MINOR / INFO
- `type`: BUG / VULNERABILITY / CODE_SMELL

O path do arquivo real é: remova o prefixo `HubAfiliado:` do `component`.

### Passo 4 — Corrigir cada issue

Para cada issue (priorize por severidade: BLOCKER → CRITICAL → MAJOR):

1. **Leia o arquivo** com o Read tool no path extraído
2. **Identifique o problema** na linha indicada (`line`)
3. **Corrija seguindo as regras do projeto:**

#### Regras de correção por tipo de rule SonarQube:

| Rule | Problema comum | Correção |
|---|---|---|
| `csharpsquid:S1135` | TODO/FIXME no código | Implementar ou remover o TODO |
| `csharpsquid:S1481` | Variável local não usada | Remover a variável |
| `csharpsquid:S1172` | Parâmetro não usado | Remover ou usar `_` prefix |
| `csharpsquid:S2699` | Teste sem Assert | Adicionar Assert apropriado |
| `csharpsquid:S3925` | ISerializable incompleto | Implementar ou remover |
| `csharpsquid:S4144` | Métodos duplicados | Extrair para método compartilhado |
| `csharpsquid:S2971` | LINQ ineficiente | Usar `.Any()` em vez de `.Count() > 0` |
| `csharpsquid:S6966` | Async sem await | Remover async ou adicionar await |
| `csharpsquid:S3267` | Loop que pode ser LINQ | Converter para LINQ se legível |
| `csharpsquid:S1128` | Using desnecessário | Remover o using |

#### Regras obrigatórias ao corrigir:
- Português para nomes de variáveis/métodos novos
- Primary Constructors para classes novas
- Return Early para evitar if/else aninhado
- `AsNoTracking()` em toda query EF Core de leitura
- Nunca introduzir magic strings — usar constantes ou enums
- Nunca quebrar a interface pública existente

4. **Aplique a correção** com o Edit tool

### Passo 5 — Verificar

Após corrigir todos os issues, execute:
```bash
export DOTNET_ROOT=/home/paulo/.dotnet && export PATH=$DOTNET_ROOT:$PATH
dotnet format src/HubAfiliado.sln --verify-no-changes 2>&1 || \
  (dotnet format src/HubAfiliado.sln && echo "Formatação aplicada")
dotnet test src/HubAfiliado.sln --configuration Release --verbosity minimal 2>&1
```

### Passo 6 — Relatório final

Exiba:
```
Issues corrigidos: N/Total
Testes: PASS (N testes) ou FAIL
Quality Gate estimado: OK/PENDENTE
```

---

## Notas importantes

- O SonarQube está em `http://100.106.88.49:9001` (Orange Pi, acessível via Tailscale)
- Project key: `HubAfiliado`
- Se o SonarQube não responder: `docker compose -f docker-compose.sonar.yml up -d`
- Issues de cobertura exigem novos testes — use o template TDD do CLAUDE.md
- **Nunca** corrigir issues criando mocks de produção; mocks só em `src/Tests/`

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.claude/commands/sonar-fix.md`

# Regras: Clean Architecture + DDD

Aplicável a qualquer projeto .NET com Clean Architecture deste setup.

## Camadas e dependências

```
Domain → Application/Service → Infrastructure → API
```

| Camada | Responsabilidade | Dependências externas |
|---|---|---|
| **Domain** | Entidades, Value Objects, Interfaces, Exceptions | **Zero** |
| **Application/Service** | Use cases, validações (FluentValidation), DTOs | Apenas Domain |
| **Infrastructure** | EF Core, HTTP clients, repositórios, integrações | Domain + Application |
| **API** | Controllers, Workers, DI, middleware | Application + Infrastructure |

## Regras obrigatórias

### Domain
- Aggregate roots com construtor privado e factory method estático `Criar(...)`
- Value Objects imutáveis com `sealed record`
- Exceções de domínio via `DomainException` — nunca exceções genéricas
- Zero dependências externas (sem EF Core, sem Newtonsoft, nada)

### Application / Service
- Casos de uso isolados — um caso de uso por classe
- DTOs como records imutáveis
- Interfaces de repositório/serviço definidas aqui, implementadas na Infra

### Infrastructure
- `AsNoTracking()` obrigatório em **toda** query EF Core de leitura
- HTTP clients registrados via `IHttpClientFactory` — nunca instanciar `HttpClient` diretamente
- Implementar apenas interfaces definidas no Domain/Application

### API
- Controllers **finos** — lógica de negócio nunca no controller
- Validação de entrada antes de chamar Application
- Erros de domínio mapeados para HTTP status codes no middleware

## Convenções de código

- **Return Early** — evitar if/else aninhado (cognitive complexity ≤ 15)
- **Sem magic strings/numbers** — usar enums ou constantes
- **Sem `any` explícito** no TypeScript (quando aplicável)
- Conventional Commits em Português: `feat:`, `fix:`, `test:`, `refactor:`

## GitFlow

```
feature/* (de develop/dev)
    └─► PR → develop/dev  (deploy automático DEV)
                └─► PR → release/vX.Y.Z  (SonarQube gate)
                              └─► PR → master  (deploy produção)
```

- Nunca commitar diretamente em `develop` ou `master`
- Hotfixes: `hotfix/*` de `master` → PR para `master` E `develop`

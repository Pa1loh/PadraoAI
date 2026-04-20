# Protocolo TDD — Red → Green → Refactor

Aplicável a qualquer projeto deste setup. Obrigatório antes de qualquer linha de produção.

## O ciclo

```
RED    → escrever o teste que descreve o comportamento
GREEN  → escrever o MÍNIMO de código para o teste passar
REFACTOR → limpar o código gerado, sem quebrar os testes
```

**Nenhuma linha de código de produção antes do teste falhar.**

## Fluxo autônomo (sem pedir permissão)

1. Escrever teste → confirmar que ele falha (RED)
2. Implementar o mínimo → rodar testes → confirmar verde (GREEN)
3. Refatorar → eliminar magic strings/numbers, return early, SOLID
4. Rodar testes novamente → confirmar ainda verde

Nunca pedir autorização para rodar `dotnet test` ou `npm test`. Rodar e corrigir silenciosamente.

## Ferramentas por projeto

| Projeto | Backend | Frontend | E2E |
|---|---|---|---|
| AfonsoV2 | xUnit + Moq | — | — |
| imobiflow-crm | xUnit + FluentAssertions + Moq | Vitest | Playwright |

## Cobertura mínima

- **AfonsoV2:** 100% em Domain + Service
- **imobiflow-crm:** não especificada — mas Domain + Application obrigatório

## Cenários obrigatórios para qualquer cliente de API externa

| Cenário | O que testar |
|---|---|
| Sucesso completo | Retorna objeto com todos os campos mapeados |
| Lista/nodes vazios | Retorna null/lista vazia sem exceção |
| HTTP não-2xx | Retorna null/lista vazia sem exceção |
| JSON inválido | Retorna null/lista vazia sem exceção |
| Erro de negócio da API (com código de erro) | Detectado, retorna null |
| Campo opcional ausente | Campo padrão, sem exceção |

## Padrão AAA

```csharp
// Arrange
var mock = new Mock<IDependencia>();
mock.Setup(x => x.MetodoAsync()).ReturnsAsync(resultado);

// Act
var resultado = await sut.ExecutarAsync();

// Assert
resultado.Should().NotBeNull();
resultado.Campo.Should().Be("valor esperado");
```

## Anti-padrões proibidos

- Mocks de produção — mocks existem **apenas** em testes
- Testes sem Assert (Sonar rule S2699)
- Teste que passa sem o código de produção existir (teste trivial)

# Skill: AliExpress Portals API v2

## Visão Geral

- **API:** AliExpress Portals API (Open Platform)
- **Método usado:** `aliexpress.affiliate.link.generate`
- **Endpoint:** `https://api-sg.aliexpress.com/sync` (GET com query params)
- **Autenticação:** Query parameters + assinatura HMAC-MD5

## Interface do Contrato

```csharp
// src/Domain/Interfaces/IClienteAliExpress.cs
public interface IClienteAliExpress
{
    Task<ResultadoDeepLink?> GerarDeepLinkAsync(
        string urlOriginal,
        string trackingId,
        CancellationToken ct = default);
}

// src/Domain/Entities/ResultadoDeepLink.cs
public record ResultadoDeepLink(
    string UrlOriginal,
    string UrlAfiliado,
    string TrackingId);
```

## Algoritmo de Assinatura HMAC-MD5

A assinatura segue o **protocolo AliExpress Open Platform**:

```
sign = MD5( appSecret + sort_alphabetically(param_name + param_value...) + appSecret )
```

Implementação com APIs .NET 10 (zero alocação):

```csharp
private static string GerarAssinatura(
    string appSecret,
    SortedDictionary<string, string> parametros)   // ordenado por chave
{
    var sb = new StringBuilder();
    sb.Append(appSecret);                           // prefixo: secret

    foreach (var (chave, valor) in parametros)
    {
        sb.Append(chave);                           // nome sem separador
        sb.Append(valor);
    }

    sb.Append(appSecret);                           // sufixo: secret

    // MD5.HashData() — API estática do .NET 10, sem alocação de objeto
    var bytes = MD5.HashData(Encoding.UTF8.GetBytes(sb.ToString()));

    // Convert.ToHexStringLower() + ToUpperInvariant() = hex UPPERCASE sem StringBuilder manual
    return Convert.ToHexStringLower(bytes).ToUpperInvariant();
}
```

## Parâmetros da Requisição

| Parâmetro | Valor | Obrigatório |
|---|---|---|
| `method` | `aliexpress.affiliate.link.generate` | ✅ |
| `app_key` | `AliExpress:AppKey` (config) | ✅ |
| `timestamp` | Unix timestamp em **milissegundos** | ✅ |
| `format` | `json` | ✅ |
| `v` | `2.0` | ✅ |
| `sign_method` | `md5` | ✅ |
| `sign` | Assinatura HMAC-MD5 gerada | ✅ |
| `source_values` | URL original do produto | ✅ |
| `tracking_id` | ID do tenant/canal (multi-tenant) | ✅ |
| `promotion_link_type` | `0` = deep link normal | Opcional |

> **Timestamp:** usar `DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()` (ms, não segundos).

## Estrutura da Resposta JSON

```json
{
  "aliexpress_affiliate_link_generate_response": {
    "result": {
      "total_result_count": 1,
      "promotion_links": {
        "promotion_link": [
          {
            "source_value": "https://www.aliexpress.com/item/123456.html",
            "promotion_link": "https://s.click.aliexpress.com/e/_DeepLinkXYZ",
            "app_signature": "..."
          }
        ]
      }
    }
  }
}
```

## Records de Deserialização

```csharp
// src/Infra/AliExpress/Modelos/RespostaAliExpressApi.cs
public record RespostaAliExpressApi(
    [property: JsonPropertyName("aliexpress_affiliate_link_generate_response")]
    RespostaGeracaoLink? RespostaGeracao);

public record RespostaGeracaoLink(
    [property: JsonPropertyName("result")]
    ResultadoGeracaoLink? Resultado);

public record ResultadoGeracaoLink(
    [property: JsonPropertyName("total_result_count")]
    int TotalResultados,

    [property: JsonPropertyName("promotion_links")]
    ContainerLinksPromocao? Links);

public record ContainerLinksPromocao(
    [property: JsonPropertyName("promotion_link")]
    List<LinkPromocao>? Items);

public record LinkPromocao(
    [property: JsonPropertyName("source_value")]
    string? UrlOriginal,

    [property: JsonPropertyName("promotion_link")]
    string? UrlAfiliado,

    [property: JsonPropertyName("app_signature")]
    string? Assinatura);
```

## Configuração (.env)

```dotenv
AliExpress__AppKey=SEU_APP_KEY_AQUI
AliExpress__AppSecret=SEU_APP_SECRET_AQUI
```

## Registro no DI (Program.cs)

```csharp
builder.Services.AddHttpClient<IClienteAliExpress, AliExpressClient>();
```

## Localização dos Arquivos

```
src/
├── Domain/
│   ├── Interfaces/IClienteAliExpress.cs
│   └── Entities/ResultadoDeepLink.cs
└── Infra/
    └── AliExpress/
        ├── AliExpressClient.cs
        └── Modelos/
            └── RespostaAliExpressApi.cs

src/Tests/
└── Infra/
    └── AliExpressClientTests.cs   ← 5 testes unitários (Moq + xUnit)
```

## Multi-tenancy

O `tracking_id` é passado por chamada, permitindo rastreio isolado por canal/grupo Telegram:

```csharp
// Cada chatId vira um tracking_id diferente
var deepLink = await _clienteAliExpress.GerarDeepLinkAsync(
    urlOriginal: oferta.UrlOriginal,
    trackingId: chatId,   // ← ID do grupo Telegram como tenant
    ct: stoppingToken);
```

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.claude/skills/aliexpress.md`

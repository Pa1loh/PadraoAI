# Rules: .NET 10 / C# 14 — Hub Afiliado

## Sintaxe e Estilo

### Primary Constructors (obrigatório em Workers e Services)
```csharp
// ✅ CORRETO
public class BuscaOfertasWorker(
    IServiceScopeFactory scopeFactory,
    CanalDeOfertas canal,
    ILogger<BuscaOfertasWorker> logger) : BackgroundService { }

// ❌ EVITAR (padrão antigo)
public class BuscaOfertasWorker : BackgroundService
{
    private readonly ILogger<BuscaOfertasWorker> _logger;
    public BuscaOfertasWorker(ILogger<BuscaOfertasWorker> logger) => _logger = logger;
}
```

### Records para DTOs (obrigatório para modelos de entrada/saída)
```csharp
// ✅ DTOs imutáveis como Records
public record ResultadoDeepLink(string UrlOriginal, string UrlAfiliado, string TrackingId);

// ✅ Respostas de API com System.Text.Json
public record RespostaAliExpressApi(
    [property: JsonPropertyName("aliexpress_affiliate_link_generate_response")]
    RespostaGeracaoLink? RespostaGeracao);
```

### File-scoped Namespaces (obrigatório em todos os arquivos)
```csharp
// ✅ CORRETO
namespace HubAfiliado.Infra.AliExpress;

// ❌ EVITAR
namespace HubAfiliado.Infra.AliExpress { }
```

## Nomenclatura (Português do Brasil)

| Elemento | Padrão | Exemplo |
|---|---|---|
| Classes/Interfaces | PascalCase PT-BR | `ClienteAliExpress`, `IScraperAfiliado` |
| Métodos | PascalCase PT-BR | `GerarDeepLinkAsync`, `BuscarOfertasAsync` |
| Parâmetros/Variáveis | camelCase PT-BR | `urlOriginal`, `trackingId` |
| DTOs de API | `Resposta{Origem}Api` | `RespostaAliExpressApi`, `RespostaShopeeApi` |
| Pastas | PascalCase | `AliExpress/`, `Modelos/`, `Scrapers/` |
| Constantes privadas | PascalCase PT-BR | `EndpointBase`, `MetodoApi` |
| Keys de configuração | Inglês (padrão .NET) | `"AliExpress:AppKey"` |

## Async e CancellationToken

```csharp
// ✅ CORRETO — CancellationToken em TODOS os métodos I/O
public async Task<ResultadoDeepLink?> GerarDeepLinkAsync(
    string urlOriginal,
    string trackingId,
    CancellationToken ct = default)
{
    var resposta = await _httpClient.GetAsync(url, ct);
    // ...
}
```

## Tratamento de Erros (sem Result Pattern)

```csharp
// ✅ Padrão do projeto: logar + retornar null
catch (JsonException ex)
{
    _logger.LogError(ex, "Erro de desserialização do JSON da AliExpress.");
    return null;
}
catch (Exception ex)
{
    _logger.LogError(ex, "Erro inesperado ao gerar deep link AliExpress.");
    return null;
}
```

## Performance .NET 10

```csharp
// ✅ MD5 sem alocação (preferir sobre new MD5())
var bytes = MD5.HashData(Encoding.UTF8.GetBytes(rawData));

// ✅ Hex string sem alocação (novo no .NET 5+, preferir no .NET 10)
return Convert.ToHexStringLower(bytes).ToUpperInvariant();

// ✅ EF Core — leituras sempre com AsNoTracking
var registros = await contexto.RegistrosEnvio
    .AsNoTracking()
    .AnyAsync(r => r.ProdutoOriginalId == id, ct);
```

## HTTP Client (IHttpClientFactory)

```csharp
// ✅ Registro no DI (Program.cs)
builder.Services.AddHttpClient<IClienteAliExpress, AliExpressClient>();
builder.Services.AddHttpClient<IScraperAfiliado, ShopeeScraper>();

// ✅ Recebido injetado no construtor
public class AliExpressClient(
    HttpClient httpClient,          // ← injetado pelo IHttpClientFactory
    IConfiguration configuracao,
    ILogger<AliExpressClient> logger) : IClienteAliExpress { }
```

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.claude/rules/dotnet-10.md`

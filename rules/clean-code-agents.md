# Clean Code para Agentes de IA

> Baseado em: https://akitaonrails.com/2026/04/20/clean-code-para-agentes-de-ia/
>
> Clean Code não é estética — é infraestrutura técnica que reduz tokens, latência e erros do agente.

## Conexão direta: Clean Code ↔ Token Economy

| Princípio | Por que importa para o agente |
|---|---|
| Funções pequenas | Claude lê menos linhas por tarefa |
| Nomes únicos | `grep` retorna 1 resultado → zero contexto poluído |
| SRP | Claude edita 1 arquivo, não varre 5 |
| Sem duplicação | Fonte única de verdade → sem divergência entre cópias |
| Tipos explícitos | Sem inferência → sem erros silenciosos |
| Log estruturado (JSON) | Claude lê campos, não texto livre |

---

## Regra 1 — Tamanho de função (4–20 linhas)

```csharp
// ✅ Uma responsabilidade, nome que dispensa comentário
private async Task<string?> ObterTrackingIdAsync(string url, CancellationToken ct)
{
    var resposta = await _httpClient.GetFromJsonAsync<RespostaTrackingApi>(url, ct);
    return resposta?.Data?.TrackingId;
}

// ❌ Função de 80 linhas com 3 responsabilidades misturadas
private async Task ProcessarOfertaAsync(...) { /* valida + busca + salva + notifica */ }
```

```typescript
// ✅
async function buscarPrecoAtual(produtoId: string): Promise<number | null> {
  const resposta = await api.get<RespostaPreco>(`/produtos/${produtoId}/preco`);
  return resposta.data?.preco ?? null;
}
```

**Gatilho:** função > 20 linhas → extrair método com nome que revele a intenção.

---

## Regra 2 — Tamanho de arquivo (< 500 linhas)

Arquivo > 500 linhas tem mais de uma razão para mudar → violar SRP → Claude edita o arquivo errado.

**Gatilho:** arquivo > 500 linhas → extrair classe/módulo por responsabilidade.

---

## Regra 3 — Nomes únicos no projeto (< 5 ocorrências no grep)

```csharp
// ❌ "ProcessarAsync" aparece em 23 arquivos — grep inútil
public async Task ProcessarAsync(...)

// ✅ Nome específico: grep retorna 1 resultado
public async Task ProcessarOfertaAliExpressAsync(...)
public async Task ProcessarOfertaShopeeAsync(...)
```

```typescript
// ❌ genérico demais
function handleClick() {}
function fetchData() {}

// ✅ específico
function handleAdicionarImovelClick() {}
function fetchImovelPorId(id: string) {}
```

**Verificar:** `grep -r "NomeDaFuncao" src/ | wc -l` — se > 5, renomear.

---

## Regra 4 — Tipos explícitos (sem `var` ambíguo, sem `any`)

```csharp
// ✅ Tipo explícito quando não é óbvio
RespostaAliExpressApi? resposta = await DeserializarAsync(json);
List<Oferta> ofertas = await repositorio.ListarAtivasAsync(ct);

// ✅ var OK quando tipo é evidente na mesma linha
var texto = "constante string";
var contador = 0;
```

```typescript
// ✅ sem any — tipagem explícita
interface RespostaPreco { preco: number; moeda: string; }
async function buscarPreco(id: string): Promise<RespostaPreco | null>

// ❌ any destrói inferência do agente
async function buscarPreco(id: string): Promise<any>
```

---

## Regra 5 — Return Early (máx 2 níveis de indentação)

```csharp
// ✅ Early return — lógica principal no nível 0
public async Task<Oferta?> ProcessarAsync(string url, CancellationToken ct)
{
    if (string.IsNullOrEmpty(url)) return null;

    var produto = await _cliente.BuscarAsync(url, ct);
    if (produto is null) return null;

    return await _repositorio.SalvarAsync(produto, ct);
}

// ❌ Arrow anti-pattern — lógica enterrada em 4 níveis
public async Task<Oferta?> ProcessarAsync(string url, CancellationToken ct)
{
    if (!string.IsNullOrEmpty(url))
    {
        var produto = await _cliente.BuscarAsync(url, ct);
        if (produto is not null)
        {
            return await _repositorio.SalvarAsync(produto, ct);
        }
    }
    return null;
}
```

---

## Regra 6 — Comentários WHY, não WHAT

```csharp
// ❌ WHAT (óbvio pelo código)
// Busca a oferta da AliExpress
var oferta = await _cliente.BuscarOfertaAsync(url, ct);

// ✅ WHY (contexto que o código não diz)
// A API da AliExpress exige HMAC-MD5 com timestamp em segundos (não ms).
// Ver: https://portals.aliexpress.com/affiportals/web/Help.htm#section3
var assinatura = GerarAssinaturaHmacMd5(parametros, _appSecret);
```

```typescript
// ✅ WHY com referência ao requisito
// Instagram só aplica boost algorítmico quando a música é selecionada via UI nativa.
// Música embutida no MP4 é tratada como "áudio original" — sem boost.
// Épico 0.2-A: PlaywrightSocialProvider.selecionarMusicaTrending()
```

---

## Regra 7 — Testes F.I.R.S.T com fakes nomeados

```csharp
// ✅ Fake nomeada (não stub inline anônimo)
public class ClienteAliExpressFalso : IClienteAliExpress
{
    public Task<Oferta?> BuscarOfertaAsync(string url, CancellationToken ct)
        => Task.FromResult<Oferta?>(null);
}

// ✅ Arrange / Act / Assert explícitos
[Fact]
public async Task BuscarOferta_QuandoApiRetornaVazio_RetornaNulo()
{
    // Arrange
    var cliente = new ClienteAliExpressFalso();
    var servico = new BuscaOfertasService(cliente);

    // Act
    var resultado = await servico.BuscarAsync("https://aliexpress.com/item/123", default);

    // Assert
    resultado.Should().BeNull();
}
```

**Cenários obrigatórios para qualquer cliente externo:**
1. Sucesso com payload completo
2. Retorno vazio (lista vazia / null)
3. HTTP não-2xx (400, 500)
4. JSON inválido / desserialização falha
5. Erro de negócio no payload (código de erro da API)
6. Campo opcional ausente

---

## Regra 8 — Injeção de dependência via construtor

```csharp
// ✅ Constructor injection — dependências explícitas
public class BuscaOfertasService(
    IClienteAliExpress clienteAliExpress,
    IClienteShopee clienteShopee,
    ILogger<BuscaOfertasService> logger)
{
    // _clienteAliExpress visível no contexto — Claude sabe o que está disponível
}

// ❌ Service Locator — dependências ocultas
public class BuscaOfertasService(IServiceProvider sp)
{
    private readonly IClienteAliExpress _cli = sp.GetRequiredService<IClienteAliExpress>();
}
```

---

## Regra 9 — Wrappers finos para serviços externos

```csharp
// ✅ Interface isolada para cada serviço externo
public interface IClienteAliExpress
{
    Task<Oferta?> BuscarOfertaAsync(string url, CancellationToken ct);
    Task<string?> GerarDeepLinkAsync(string url, string trackingId, CancellationToken ct);
}

// O cliente concreto fica isolado em Infra — Domain/Service nunca importa HttpClient diretamente
```

```typescript
// ✅ service isolado — componente React nunca usa fetch/axios diretamente
// src/services/imovelService.ts
export async function listarImoveis(filtros: FiltroImovel): Promise<Imovel[]> {
  const { data } = await api.get<Imovel[]>('/properties', { params: filtros });
  return data;
}
```

---

## Regra 10 — Logging estruturado (JSON, não string)

```csharp
// ✅ Campos estruturados — Claude lê um campo, não faz parse de texto
_logger.LogInformation(
    "Oferta processada. {Fonte} {ProdutoId} {Preco}",
    "AliExpress", produto.Id, produto.Preco);

// ❌ String concatenada — inútil para grep e para o agente
_logger.LogInformation($"Oferta processada: {fonte} - {produto.Id} - R${produto.Preco}");
```

```typescript
// ✅ objeto estruturado
console.error('Erro ao buscar imóvel', { imovelId: id, status: err.response?.status });

// ❌ template string
console.error(`Erro ao buscar imóvel ${id}: ${err.message}`);
```

---

## Aplicação no código gerado pelo Claude

Ao gerar ou modificar código neste projeto:

1. **Verificar tamanho** — se gerou > 20 linhas em uma função, extrair antes de entregar
2. **Verificar nome** — se o nome é genérico (`Process`, `Handle`, `Get`), prefixar com contexto
3. **Verificar tipos** — nenhum `any` em TypeScript, nenhum `var` em C# para tipos não-óbvios
4. **Verificar indentação** — máx 2 níveis; se for 3+, extrair método
5. **Comentário WHY** — se o código tem lógica não-óbvia, uma linha explicando o porquê (não o que)

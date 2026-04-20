# Economia de Token — Boas Práticas

Guia de referência para uso eficiente de contexto com Claude Code CLI.
Baseado em práticas documentadas pela comunidade e aplicadas neste setup.

---

## Por que importa

Cada sessão do Claude Code consome tokens de input (contexto carregado) e output (respostas geradas). Hábitos ruins desperdiçam 60-70% do orçamento em conteúdo redundante ou desnecessário.

Custo relativo:
| Tipo | Custo |
|---|---|
| Token de output (resposta) | 1× |
| Token de input (contexto novo) | 1× |
| Token de input **cacheado** (TTL 5min) | ~0.1× |

---

## Regra #1 — CLAUDE.md diet

> Só fica no CLAUDE.md o que o Claude faria **errado** sem aquilo.

Critério para cada linha:
- "O Claude já sabe por treinamento?" → **Remover**
- "Isso muda todo sprint?" → **Não colocar** (fica desatualizado e vira ruído)
- "Vale para qualquer projeto .NET?" → **Extrair para `shared/rules/`**
- "É específico deste projeto e Claude erraria sem saber?" → **Manter**

Meta: CLAUDE.md de cada projeto ≤ 80 linhas + `@imports` para conteúdo estático.

---

## Regra #2 — @imports aproveitam prompt cache

Arquivos referenciados com `@path` no CLAUDE.md são cacheados separadamente com TTL de 5 minutos. Arquivos **estáveis** (regras de arquitetura, dotnet-10.md) são relidos do cache na maioria das sessões — custo ~0.1× em vez de 1×.

**Estrutura ideal:**
```markdown
# CLAUDE.md (pequeno, muda a cada sprint)
@~/.claude/shared/rules/clean-architecture.md   ← grande, estável, cached
@~/.claude/shared/rules/tdd-protocol.md          ← grande, estável, cached
@~/.claude/shared/rules/dotnet-10.md             ← grande, estável, cached

## Específico deste projeto (pequeno, volátil)
...
```

---

## Regra #3 — Templates XML para pedidos de feature

Estrutura que reduz tokens de input ~40% ao isolar exatamente o que Claude precisa:

```xml
<requisito>Épico N — descrição curta</requisito>
<regra>Clean Architecture · Português · TDD · C# 14</regra>
<contexto>
  Interface alvo: INomeInterface (Domain/Interfaces/)
  Classe alvo: NomeClasse (Infra/Pasta/ ou Service/)
</contexto>
<arquivo_alvo>src/Camada/Pasta/NomeClasse.cs</arquivo_alvo>
```

**Anti-padrão:** "Aqui está todo o projeto, pode implementar X?"

---

## Regra #4 — Poda de logs de erro

Ao colar erro de build ou teste, somente:
```
System.NullReferenceException: Object reference not set to an instance of an object.
   at HubAfiliado.Infra.AliExpress.AliExpressClient.BuscarOfertaAsync() in AliExpressClient.cs:line 42
   at HubAfiliado.API.Workers.BuscaOfertasWorker.ExecuteAsync() in BuscaOfertasWorker.cs:line 28
```

Nunca colar o output completo do terminal — isso queima tokens sem agregar contexto.

---

## Regra #5 — /clear entre tarefas não relacionadas

Contexto acumulado de uma tarefa degrada qualidade na próxima e consome tokens desnecessários. Usar `/clear` ao mudar de escopo:
- Terminou backend → vai pro frontend: `/clear`
- Terminou feature → vai depurar bug em outra área: `/clear`
- Sessão de refactor → sessão de testes: `/clear`

---

## Regra #6 — Subagents para investigação

Quando precisar explorar código para decidir uma abordagem, usar subagent em vez de ler arquivos no contexto principal:
- Subagent lê N arquivos, retorna só o resumo relevante
- Contexto principal fica limpo para implementação
- Execução paralela possível (múltiplas investigações ao mesmo tempo)

Exemplo: "Use um subagent para verificar como o sistema de autenticação trata refresh de token e se já existe utilitário OAuth."

---

## Regra #7 — Diff-based thinking

Pedir sempre o trecho alterado, não o arquivo completo:
- "Altere apenas o método `BuscarOfertaAsync` para adicionar retry com Polly"
- "Mostre apenas o bloco `catch` que precisa de LogError"

Nunca: "Me reescreva o arquivo com a mudança."

---

## Regra #8 — Settings semânticos

`settings.local.json` com 300+ regras misturadas carrega permissões irrelevantes a cada sessão. Organizar por escopo:

| Arquivo | Conteúdo |
|---|---|
| `~/.claude/settings.local.json` | Regras pessoais universais (git, curl, python3, hyprland, 3dprint) |
| `AfonsoV2/.claude/settings.local.json` | Regras .NET + Docker + SonarQube + Tailscale específicas do projeto |
| `imobiflow-crm/.claude/settings.local.json` | Regras .NET + npm + Docker + Playwright específicas do projeto |

---

## Regra #9 — Skills on-demand vs contexto sempre ativo

| Tipo | Quando usar |
|---|---|
| CLAUDE.md (`@import`) | Regras que se aplicam em **toda** sessão do projeto |
| Skill (`.claude/skills/`) | Workflows invocados explicitamente (`/sonarqube`, `/deploy`) |
| Subagent | Investigação pontual — contexto isolado e descartado |

Não colocar no CLAUDE.md o que só é usado 10% das sessões. Virar skill.

---

## Checklist antes de cada sessão

- [ ] Estou no projeto certo? (diretório correto para carregar o CLAUDE.md correto)
- [ ] Última tarefa foi de escopo diferente? → `/clear`
- [ ] Vou explorar código desconhecido? → planejar uso de subagent
- [ ] Vou colar log de erro? → podar para 3-5 linhas relevantes
- [ ] Vou pedir feature nova? → preparar template XML

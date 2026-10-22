# Leia-me do agente

O usuário apontou este repositório e disse algo como "vamos sempre trabalhar assim". Faça nesta ordem:

1. Leia `inegociaveis.md` por inteiro. São as regras duras, cada uma com o porquê.
2. Leia `ADOTAR.md` e siga o roteiro (projeto novo ou existente).
3. Use `templates/` como **exemplo comentado**, não como cópia cega: adapte à stack real do projeto.
4. Consulte `rules/` e `skills/` só quando a tarefa pedir (carregue sob demanda, não tudo).
5. `extras/` e `mcp/` são opcionais: só se o projeto precisar.

Regras de conduta ao adotar:
- Entreviste pouco (stack, comando de build/teste, como faz deploy, o que já existe). Descubra o resto lendo o repo.
- Não adicione arquivo, skill ou agent "por completude". O padrão é pequeno de propósito.
- Mostre o diff proposto antes de gravar em arquivos de configuração do usuário.
- Ao terminar, rode a verificação do `ADOTAR.md` e relate o que passou e o que ficou pendente.

## Três CLIs, um padrão
Claude Code, Antigravity (`agy`) e DeepSeek (`dsh-tui`) leem o mesmo `AGENTS.md` (o `CLAUDE.md` é só `@AGENTS.md`). O time de papéis está em `agents/` (ver `agents/README.md`): rode `npx github:Pa1loh/PadraoAI agents` no projeto. Só o Claude impõe `tools` por papel; nos demais o limite é instrução + hook/CI.

## Subagents e paralelismo (sem um pisar no outro)

Padrão: **um agente escreve, os demais leem.** Fontes: Cognition ("Multi-Agents: What's Actually Working"), Anthropic (multi-agent research system), Akita (benchmarks e AI Lair), Willison (parallel coding agents).

1. **Escrita single-threaded por árvore de arquivos.** Subagent comum só pesquisa, busca código, revisa ou roda teste/lint. Quem edita é um só. Dois escritores no mesmo diretório = decisões implícitas conflitantes e arquivo corrompido.
2. **Precisa de escrita paralela?** Só em worktree + branch próprios, com escopo de arquivos disjunto declarado antes (ex.: `src/api/**` vs `src/ui/**`). Arquivo compartilhado (lockfile, migration, schema, `AGENTS.md`) é de um dono só, definido de antemão. Merge e conflito são do orquestrador, em série.
3. **Brief completo ao delegar.** Objetivo, formato da saída, ferramentas/fontes permitidas, limites do que NÃO fazer, critério de pronto. Brief vago gera trabalho duplicado e tarefa mal lida. O subagent não herda o contexto do pai: passe plano, decisões já tomadas e arquivos relevantes.
4. **Hierarquia, nunca enxame.** Pai delega, filhos não falam entre si nem criam subagents. Toda decisão volta ao pai.
5. **Estado em arquivo, não na conversa.** Plano/todo em arquivo compartilhado; subagent grava o resultado longo em arquivo e devolve só o caminho + resumo curto. Evita telefone sem fio e poupa token.
6. **Revisor em contexto limpo.** Reviewer recebe só o diff e o requisito, sem o histórico do autor. O autor filtra os achados contra o pedido do usuário (evita loop e escopo extra).
7. **Escale esforço ao tamanho da tarefa.** Fato simples: 0 subagents. Comparação: 2–4. Só tarefa ampla e separável justifica mais. Multi-agente custa ~15x mais token; a maioria das tarefas de código tem pouca parte realmente paralelizável.
8. **Gargalo é a revisão humana.** Não abra mais frentes do que você consegue revisar e integrar. Uma mudança relevante por vez.
9. **Cada worktree fecha limpo:** testes verdes no SHA, `git worktree remove` + prune, fora do grep (`inegociaveis.md` itens 12 e 15).
10. **Não confie em delegação automática.** Nos benchmarks do Akita os subagents quase nunca foram chamados sozinhos e não há como forçar por config. Se quer subagent, peça explicitamente no prompt.

Fluxo seguro típico: o agente principal planeja e escreve; subagents read-only fazem busca, pesquisa e revisão em paralelo; um revisor limpo olha o diff antes do PR.

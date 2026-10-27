---
name: issue
description: Executa uma issue de ponta a ponta (analista, plano, TDD, revisor, PR). Use quando o usuário pedir /issue, "faça a issue N" ou descrever uma tarefa com esse fluxo.
disable-model-invocation: true
---
Execute a issue indicada pelo usuário. O argumento do comando chega em `$ARGUMENTS`; nos CLIs que não substituem esse marcador (dsh), use o número, link ou descrição da própria mensagem.

Padrão é **solo**: você mesmo, na engine forte com quota. Delegue só com quota apertando, unidades independentes, leitura pesada ou revisão cruzada. Se existir `docs/engines.yml`, leia-o e mostre no plano o perfil e a engine recomendada por papel, respeitando `indisponivel` e a ordem de `fallback`. É recomendação: só troque de engine se eu aprovar (handoff pelo ai-memory se a quota apertar).

1. Se for número e houver `gh` com remote, leia com `gh issue view`; sem remote, use a descrição da mensagem. Portão: a issue precisa de critério de pronto verificável e de onde mexer. Se faltar, não implemente no escuro: liste o que falta e peça complemento (ou use `/issue-criar`). Confirme que está numa branch própria (nunca `master`/`develop`); se não estiver, crie `feat/issue-<N>-<slug>` ou `fix/issue-<N>-<slug>`.
2. Se a issue envolve API, serviço ou documentação externa, delegue **sempre** ao papel **analista** (somente leitura, tem web) para ler a doc oficial e devolver auth, endpoints, limites, erros e o que não conseguiu confirmar. Em área desconhecida do código, também. Só pule o analista se a mudança couber em poucos arquivos que você já leu. Não leia dezenas de arquivos você mesmo.
   - Claude Code: subagente `analista` (`.claude/agents/analista.md`).
   - dsh: ferramenta `subagent` com `prompt` = conteúdo de `.agents/skills/papel-analista/SKILL.md` + a pergunta. Contexto limpo, somente leitura.
   - Antigravity: agente `analista` se existir; senão, a mesma delegação genérica do dsh.
   - Sem subagent no CLI: assuma o papel `papel-analista` você mesmo, sem editar nada.
3. Se a issue deixa dúvida real (comportamento esperado, casos de borda, o que reaproveitar, o que não pode mudar), faça as perguntas numeradas (as "Perguntas em aberto" do analista entram aqui) e só siga depois da resposta. Então mostre o plano em passos curtos: para cada passo, o que muda, em qual arquivo e como testo; no fim, os riscos e o que deixou de fora de propósito. Espere minha aprovação antes de editar. Em execução one-shot/headless não há canal de resposta: só continue se o prompt já concedeu aprovação explícita; caso contrário, pare e peça o "sim".
4. Implemente com TDD: teste vermelho primeiro (bug: `Regressao_Issue{N}_...`), depois o código mínimo. Rode build e testes pelos comandos do `AGENTS.md` e mostre a saída.
5. Delegue a revisão ao papel **revisor**, passando só o diff e a issue (não o histórico de quem escreveu). Claude Code: subagente `revisor`; dsh: ferramenta `subagent` com `prompt` = conteúdo de `.agents/skills/papel-revisor/SKILL.md` + diff + issue; Antigravity: agente `revisor` se existir, senão a mesma delegação. Corrija apenas achados que afetem correção ou o requisito; ignore estilo.
6. Commit, push da branch e `gh pr create` linkando a issue. Pare aí: merge e deploy são meus. Sem remote ou sem `gh` autenticado, faça o commit e pare, relatando o que falta.
7. Ao fechar, acrescente uma linha em `docs/agent-log.md` (se existir): data, issue, engine/modelo, tokens ou custo (`-` se não souber), CI verde de primeira (sim/não) e achados do revisor (nº e o mais grave).
8. Não faça `ssh`, `docker` em servidor nem deploy. Se a issue exigir infra, descreva o que falta e pare.

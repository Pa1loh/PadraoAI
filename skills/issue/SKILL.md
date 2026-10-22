---
name: issue
description: Executa uma issue de ponta a ponta (analista, plano, TDD, revisor, PR). Use quando o usuário pedir /issue, "faça a issue N" ou descrever uma tarefa com esse fluxo.
disable-model-invocation: true
---
Execute a issue indicada pelo usuário. O argumento do comando chega em `$ARGUMENTS`; nos CLIs que não substituem esse marcador (dsh), use o número, link ou descrição da própria mensagem.

1. Se for número e houver `gh` com remote, leia com `gh issue view`; sem remote, use a descrição da mensagem. Confirme objetivo, critério de pronto e escopo de arquivos. Confirme que está numa branch própria (nunca `master`/`develop`); se não estiver, crie `feat/issue-<N>-<slug>` ou `fix/issue-<N>-<slug>`.
2. Se a issue envolve API, serviço ou documentação externa, delegue **sempre** ao papel **analista** (somente leitura, tem web) para ler a doc oficial e devolver auth, endpoints, limites, erros e o que não conseguiu confirmar. Em área desconhecida do código, também. Só pule o analista se a mudança couber em poucos arquivos que você já leu. Não leia dezenas de arquivos você mesmo.
   - Claude Code: subagente `analista` (`.claude/agents/analista.md`).
   - dsh: ferramenta `subagent` com `prompt` = conteúdo de `.agents/skills/papel-analista/SKILL.md` + a pergunta. Contexto limpo, somente leitura.
   - Antigravity: agente `analista` se existir; senão, a mesma delegação genérica do dsh.
   - Sem subagent no CLI: assuma o papel `papel-analista` você mesmo, sem editar nada.
3. Mostre o plano em poucas linhas e espere minha aprovação antes de editar. Em execução one-shot/headless não há canal de resposta: só continue se o prompt já concedeu aprovação explícita; caso contrário, pare e peça o "sim".
4. Implemente com TDD: teste vermelho primeiro (bug: `Regressao_Issue{N}_...`), depois o código mínimo. Rode build e testes pelos comandos do `AGENTS.md` e mostre a saída.
5. Delegue a revisão ao papel **revisor**, passando só o diff e a issue (não o histórico de quem escreveu). Claude Code: subagente `revisor`; dsh: ferramenta `subagent` com `prompt` = conteúdo de `.agents/skills/papel-revisor/SKILL.md` + diff + issue; Antigravity: agente `revisor` se existir, senão a mesma delegação. Corrija apenas achados que afetem correção ou o requisito; ignore estilo.
6. Commit, push da branch e `gh pr create` linkando a issue. Pare aí: merge e deploy são meus. Sem remote ou sem `gh` autenticado, faça o commit e pare, relatando o que falta.
7. Não faça `ssh`, `docker` em servidor nem deploy. Se a issue exigir infra, descreva o que falta e pare.

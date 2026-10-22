---
name: issue
description: Executa uma issue de ponta a ponta (analista, plano, TDD, revisor, PR). Invocar com /issue <número ou descrição>.
disable-model-invocation: true
---
Execute a issue: $ARGUMENTS

1. Se for número, leia com `gh issue view`. Confirme objetivo, critério de pronto e escopo de arquivos. Confirme que está numa branch própria (nunca `master`/`develop`); se não estiver, crie `feat/issue-<N>-<slug>` ou `fix/issue-<N>-<slug>`.
2. Se a issue envolve API, serviço ou documentação externa, chame **sempre** o subagent **analista** (somente leitura, tem web) para ler a doc oficial e devolver auth, endpoints, limites, erros e o que não conseguiu confirmar. Em área desconhecida do código, também. Só pule o analista se a mudança couber em poucos arquivos que você já leu. Não leia dezenas de arquivos você mesmo.
3. Mostre o plano em poucas linhas e espere minha aprovação antes de editar.
4. Implemente com TDD: teste vermelho primeiro (bug: `Regressao_Issue{N}_...`), depois o código mínimo. Rode build e testes pelos comandos do `AGENTS.md` e mostre a saída.
5. Chame o subagent **revisor** passando só o diff e a issue. Corrija apenas achados que afetem correção ou o requisito; ignore estilo.
6. Commit, push da branch e `gh pr create` linkando a issue. Pare aí: merge e deploy são meus.
7. Não faça `ssh`, `docker` em servidor nem deploy. Se a issue exigir infra, descreva o que falta e pare.

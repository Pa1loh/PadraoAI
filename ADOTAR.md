# Roteiro de adoção

Serve para projeto **novo** ou **existente**. Princípio: instalar o mínimo que muda o comportamento, com enforcement mecânico.

## 0. Descobrir (sem perguntar o que o repo responde)
Ler: manifestos (`*.sln`, `package.json`…), CI existente, README, `git log -20`. Perguntar só o que faltar:
stack e comando de build/teste · onde roda em produção/QA e como faz deploy · há dados sensíveis/credenciais de terceiros? · um dev ou time?

## 1. Instrução do agente
- Criar `AGENTS.md` (≤ ~120 linhas) a partir de `templates/AGENTS.md`: stack, comandos, invariantes, armadilhas, ponteiros.
- `CLAUDE.md` e `GEMINI.md` = só `@AGENTS.md`.
- Regras genéricas desejadas entram por `@import` apenas se pequenas; domínio extenso → `.claude/rules/*.md` com `paths:`.
- Projeto existente com AGENTS.md/CLAUDE.md grande: **enxugar**, movendo domínio para rules/ADR.

## 2. Enforcement (o que torna as regras reais)
Escolher o que cabe na stack, a partir de `templates/`:
- pre-commit: gitleaks + format · pre-push: testes unitários
- hooks do agente (`.claude/settings.json`): bloquear escrita em arquivos de segredo; rodar build/lint após edição; bloquear commit com teste vermelho
- CI: build + teste + gitleaks + (integração/E2E antes de produção) + cache de build
- PR template (issue #, teste de regressão, evidência) e issue template de bug
- analyzers/lint no nível *erro* para o que importa (complexidade, parâmetros, código morto)

## 3. Memória do projeto
- `docs/adr/` com 1 ADR por decisão já tomada (data, contexto, decisão, porquê). Comece pelas que o dono repete toda hora.
- Doc de visão/roadmap curto; histórico fica em arquivo separado.
- Memória de sessão/handoff: ai-memory (se instalado), nunca em arquivo paralelo.

## 4. Testes
- Convenção de regressão: `Regressao_Issue{N}_<comportamento>`.
- Meta de cobertura onde há regra de negócio; fronteiras externas testadas com cenários de falha (vazio, não-2xx, JSON inválido, campo ausente).

## 5. Ciclo de trabalho
issue → branch → plano (só se o diff não cabe em 1 frase) → TDD → PR pequeno → revisão em contexto limpo → CI verde → deploy → kaizen.

## 6. Verificação da adoção (reporte com evidência)
- [ ] AGENTS.md ≤ ~120 linhas; sem bloco duplicado entre arquivos
- [ ] `grep -r` por segredo no repo limpo; gitleaks roda
- [ ] hook de bloqueio testado (tentar escrever `.env`)
- [ ] build + testes verdes pelo comando documentado
- [ ] CI roda e está verde
- [ ] ADRs das decisões principais existem
Relatar o que não coube e por quê. Não declarar "adotado" sem estes checks.

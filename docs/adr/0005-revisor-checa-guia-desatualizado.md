# 0005. Revisor checa guia desatualizado (imposição no papel, não em CI nem hook)

- Data: 2026-10-29 · Status: Aceito

## Contexto

A regra "mudou regra, fluxo, convenção ou comando? Atualize o guia no mesmo PR" só estava escrita no AGENTS.md dos projetos: advisory, sem verificação.

## Decisão

- O papel `revisor` (`agents/revisor.md`, com a skill `pr-audit`) registra o achado IMPORTANTE, não bloqueante, "guia possivelmente desatualizado" quando o diff toca código ou configuração (`src/`, `bin/`, `package.json`, comandos, regras de domínio) e não toca `docs/guia-de-desenvolvimento/` nem o corpo do PR traz uma frase "guia não precisa mudar porque ...". O achado cita as seções candidatas (`grep -n 'id="' docs/guia-de-desenvolvimento/index.html`).
- Se o guia foi tocado, o revisor roda `node docs/guia-de-desenvolvimento/checar.mjs` e reporta a saída.
- `test/agents-sync.test.mjs` garante que o papel gerado contém a checagem e continua com corpo ≤25 linhas.

## Por quê (e o que foi descartado)

CI não é padrão por enquanto nos projetos, e o revisor já roda em todo PR, em contexto limpo.
- Hook: descartado. Hook pré-commit/PreToolUse não sabe se o PR é "grande"; "tocou código sem guia" tem muito falso positivo (refactor, teste) e um bloqueio determinístico sem a frase de dispensa trava o fluxo.
- CI: descartado por ora. Não é padrão nos adotantes; quando for, vale um job que falha sem a frase de dispensa.

## Consequências

Imposição é por instrução ao revisor (não determinística) e não bloqueia o merge. Adotantes recebem o papel novo rodando `npx github:Pa1loh/PadraoAI agents`.

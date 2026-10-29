# 0002. `extras/infra-pessoal/` é do mantenedor e fica fora do padrão

- Data: 2026-10-28 (commit `bec830b`, que adiciona o mapa do homelab pessoal) · Status: Aceito

## Contexto

O repositório é open source e é copiado para outros projetos (`npx github:Pa1loh/PadraoAI init`). O commit `bec830b` ("mapa do homelab pessoal para o agente de infra e para a issue") colocou em `extras/infra-pessoal/` dados do homelab do mantenedor.

## Decisão

`extras/infra-pessoal/` não faz parte do padrão: não se copia para projetos adotantes e não se cita em `templates/`. Quem adota preenche as próprias linhas de infra no `AGENTS.md` (seção "Time de agentes"). O `extras/infra-exemplos/INFRA.md` diz o mesmo: "o homelab é pessoal e não se replica".

## Por quê (e o que foi descartado)

Fonte: seção Invariantes do `AGENTS.md` ("homelab do mantenedor, não faz parte do padrão. Não copie, não cite em template") e `templates/AGENTS.md`, que manda não copiar essa pasta. Descartado: publicar o mapa como se fosse padrão (o repositório é público).

## Consequências

`extras/` não entra em `package.json` `files`, então não vai no pacote. Dado pessoal de infra não deve vazar para template, skill publicada ou ADR.

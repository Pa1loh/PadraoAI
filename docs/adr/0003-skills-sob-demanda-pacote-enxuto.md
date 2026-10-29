# 0003. Skills sob demanda: o pacote publica só issue, issue-criar e proximas

- Data: 2026-10-22 (commit `4658c97`, "catálogo sob demanda e skill-on/off por projeto"); lista de `files` com as skills do fluxo em `c584d9c` (2026-10-27) · Status: Aceito

## Contexto

Skill, plugin ou MCP global entra no contexto de toda sessão (`CATALOGO-SOB-DEMANDA.md`). O inegociável 11 pede poucas skills, cada uma com um trabalho, e trata "skill encostada" como dívida.

## Decisão

- Global fica só com o que se usa em quase toda sessão; o resto liga por projeto (`bin/skill-on`), com conteúdo guardado em `skills/` e `extras/skills/` (`CATALOGO-SOB-DEMANDA.md`).
- `package.json` `files` publica apenas `bin`, `agents`, `templates`, `dsh`, `skills/issue`, `skills/issue-criar`, `skills/proximas`, `inegociaveis.md`, `ADOTAR.md` e `LEIA-ME-AGENTE.md`. `rules/`, `docs/`, `extras/` e as demais skills não são publicados.

## Por quê (e o que foi descartado)

Fontes: `CATALOGO-SOB-DEMANDA.md` ("Por quê: ... entra no contexto de TODA sessão"), `inegociaveis.md` itens 10 e 11 e `package.json`. Descartado: instalar todas as skills no global e publicar o repositório inteiro.

## Consequências

Arquivo que o projeto adotante precisa tem que entrar em `files`. Exceção ao lint de contexto só em `.contexto-allow`, com motivo. Skill nova exige uso recorrente.

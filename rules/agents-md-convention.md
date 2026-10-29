# Regra: AGENTS.md — Config de Agente Portável Entre Ferramentas

Aplicável a qualquer projeto deste setup que use mais de um agente de IA
(Claude Code, Antigravity, dsh, GitHub Copilot, Cursor, etc.).

> Gemini CLI é legado neste setup: não se cria `GEMINI.md`. Antigravity e dsh leem o `AGENTS.md` direto.

## Problema

`CLAUDE.md` e `.github/copilot-instructions.md` cobrindo o
mesmo terreno viram cópias manuais que divergem silenciosamente — a
primeira vítima é sempre a regra mais recente, adicionada em só um dos
arquivos e esquecida nos outros.

## Padrão

1. **`AGENTS.md` na raiz do projeto é a fonte única, agnóstica de agente.**
   Contém tudo que qualquer agente precisa saber sobre stack, arquitetura,
   convenções de código, deploy, segurança e checklist de PR.
2. `CLAUDE.md` (suporta `@imports`) vira ponteiro fino: `@AGENTS.md` + qualquer regra exclusiva daquele agente (ex:
   protocolo de economia de token é só do Claude Code).
3. `.github/copilot-instructions.md` **não** suporta `@imports` — vira um
   resumo curto manual (15-25 linhas) apontando pra `AGENTS.md`, não uma
   cópia completa.
4. Dentro do próprio `AGENTS.md`, os `@imports` para as regras genéricas
   do PadraoAI (`clean-architecture.md`, `tdd-protocol.md`, `dotnet-10.md`,
   `clean-code-agents.md`) continuam — mas **sempre seguidos de um bloco de
   fallback inline curto**, porque nem todo agente expande `@imports`
   (Antigravity e outros clientes que só leem o arquivo literal precisam
   de algo lá, não um `@path` cru sem sentido).

## Checklist ao criar/editar regra que afeta múltiplos agentes

- [ ] A regra entrou em `AGENTS.md` (não direto em `CLAUDE.md`)?
- [ ] Se `AGENTS.md` cresceu, o bloco de fallback inline (pro agente sem
      `@import`) ainda reflete o essencial das regras importadas?
- [ ] `.github/copilot-instructions.md` ainda é um resumo — não voltou a
      virar cópia completa?
- [ ] Nenhum arquivo de config de agente ficou órfão (ex: um
      `copilot-instructions.md` extra em subpasta que o Copilot nunca lê —
      Copilot só lê o da raiz de `.github/`).

## Origem

Projeto: `AfonsoV2` (Hub Afiliado) — reordenamento de AI tooling, ago/2026.

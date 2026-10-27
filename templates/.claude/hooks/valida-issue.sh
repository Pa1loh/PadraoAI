#!/usr/bin/env bash
# PreToolUse (Bash): barra `gh issue create` que um agente não consegue executar bem (inegociável 9).
# Exige as seções da skill /issue-criar e corpo curto. Saída 2 = bloqueia e explica o que falta.
# Corpo vem de --body-file <arquivo>; com heredoc, stdin ou --body inline, valida o próprio texto do comando.
# Issue pelo site usa o form tarefa-agente.yml; `gh api` direto não é coberto.
in=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$in")
Q=$'\''
P="(^|[;&|(\`]|\\\$\\(|(ba|z|da)?sh[[:space:]]+-c[[:space:]]+[${Q}\"])[[:space:]]*"
grep -Eq "${P}gh[[:space:]]+issue[[:space:]]+create" <<<"$cmd" || exit 0

MAX=${ISSUE_MAX_PALAVRAS:-400}
texto=$cmd
arquivo=$(grep -Eo -- '(--body-file|-F)[ =]+[^ ]+' <<<"$cmd" | head -1 | sed -E 's/^(--body-file|-F)[ =]+//; s/^["'"'"']//; s/["'"'"']$//')
[ -n "$arquivo" ] && [ "$arquivo" != "-" ] && [ -f "$arquivo" ] && texto=$(cat "$arquivo")

falta=()
for secao in "Problema" "Comportamento esperado" "Crit[eé]rio de pronto" "Onde mexer"; do
  grep -Eiq "$secao" <<<"$texto" || falta+=("${secao//\[eé\]/é}")
done
palavras=$(wc -w <<<"$texto")

[ ${#falta[@]} -eq 0 ] && [ "$palavras" -le "$MAX" ] && exit 0
{
  echo "Issue bloqueada: não está pronta para um agente executar (rode /issue-criar)."
  [ ${#falta[@]} -gt 0 ] && echo "- Seções que faltam: $(IFS=,; echo "${falta[*]}")."
  [ "$palavras" -gt "$MAX" ] && echo "- Corpo com $palavras palavras (máx. $MAX): corte e divida em issues menores."
} >&2
exit 2

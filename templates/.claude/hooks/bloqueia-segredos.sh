#!/usr/bin/env bash
# PreToolUse (Edit|Write): bloqueia escrita em arquivos de segredo. Saída 2 = bloqueia e avisa o agente.
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  *.env|*.env.*|*.pem|*.key|*.session)
    case "$f" in *.example) exit 0;; esac
    echo "Bloqueado: $f é arquivo de segredo. Use variável de ambiente/cofre." >&2; exit 2;;
esac

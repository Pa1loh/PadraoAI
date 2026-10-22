#!/usr/bin/env bash
# PreToolUse (Bash): limites duros por papel. Saída 2 = bloqueia e avisa o agente.
# Casa o programa só em posição de comando (início, após ; & | ( $( ou `bash -c '`), então pega
# `bash -c 'ssh x'` e `git -C . push -f`, mas não a palavra "ssh" dentro de uma mensagem de commit.
# Papéis infra/deploy (claude --agent infra|deploy) podem o que o resto não pode.
in=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$in")
papel=$(jq -r '.agent_type // empty' <<<"$in")
bloqueia() { echo "Bloqueado ($1). Peça ao usuário ou use o agente certo: claude --agent infra|deploy." >&2; exit 2; }

Q=$'\''
P="(^|[;&|(\`]|\\\$\\(|(ba|z|da)?sh[[:space:]]+-c[[:space:]]+[${Q}\"])[[:space:]]*(sudo[[:space:]]+)?"
tem() { grep -Eq "$P$1" <<<"$cmd"; }

# Sempre bloqueado, para qualquer papel
tem 'git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+push[[:space:]]+(.*[[:space:]])?(--force[^[:space:]]*|-f)([[:space:]]|$)' && bloqueia "git push --force"
tem 'rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+)+(/|~|\$HOME)([[:space:]/]|$)' && bloqueia "rm -rf na raiz ou no home"

# Só infra e deploy
case "$papel" in infra|deploy) ;; *)
  tem '(ssh|scp|sftp|kubectl)[[:space:]]' && bloqueia "acesso a host/cluster"
  tem 'docker[[:space:]]+(-H|--host|--context)' && bloqueia "docker em host remoto"
esac
case "$papel" in deploy) ;; *)
  tem 'gh[[:space:]]+pr[[:space:]]+merge' && bloqueia "merge de PR é decisão humana"
esac
exit 0

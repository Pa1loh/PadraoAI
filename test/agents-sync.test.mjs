import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sincronizar } from '../bin/agents-sync.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origem = join(raiz, 'agents');
const projeto = mkdtempSync(join(tmpdir(), 'agents-'));
sincronizar(projeto, origem);
const ler = (rel) => readFileSync(join(projeto, rel), 'utf8');
const PAPEIS = ['analista', 'revisor', 'infra', 'deploy'];

test('gera os 3 formatos para cada papel e a skill /issue', () => {
  for (const n of PAPEIS) {
    for (const rel of [`.claude/agents/${n}.md`, `.agents/agents/${n}.md`, `.agents/skills/papel-${n}/SKILL.md`]) {
      assert.ok(existsSync(join(projeto, rel)), `falta ${rel}`);
    }
  }
  assert.ok(existsSync(join(projeto, '.claude/skills/issue/SKILL.md')));
  assert.ok(existsSync(join(projeto, '.agents/skills/issue/SKILL.md')));
  assert.ok(!existsSync(join(projeto, '.claude/agents/dev.md')), 'dev é a sessão da aba, não um agent');
});

test('nenhum papel edita código nem cria subagents', () => {
  for (const n of PAPEIS) {
    const tools = ler(`.claude/agents/${n}.md`).match(/^tools: (.*)$/m)[1];
    assert.doesNotMatch(tools, /\b(Edit|Write|Agent)\b/, `${n} não pode editar nem delegar`);
    assert.match(ler(`.claude/agents/${n}.md`), /Não crie subagents/);
    assert.match(ler(`.agents/agents/${n}.md`), /^model: (inherit|flash|pro)$/m);
  }
});

test('infra e deploy não têm web; analista e revisor delegam com "proactively"', () => {
  for (const n of ['infra', 'deploy']) assert.match(ler(`.claude/agents/${n}.md`), /^disallowedTools: .*WebFetch/m);
  for (const n of ['analista', 'revisor']) assert.match(ler(`.claude/agents/${n}.md`), /^description: .*proactively/m);
});

test('skill /issue é invocável pelo modelo (dsh headless não tem slash command) e cita analista, revisor e PR', () => {
  const s = ler('.agents/skills/issue/SKILL.md');
  assert.doesNotMatch(s, /^disable-model-invocation: true/m, 'dsh só expõe ao modelo skills sem disable-model-invocation');
  for (const palavra of ['analista', 'revisor', 'gh pr create', 'TDD']) assert.match(s, new RegExp(palavra));
});

test('/issue continua explícito no Claude, mas a cópia do dsh é invocável pelo modelo', () => {
  assert.match(ler('.claude/skills/issue/SKILL.md'), /^disable-model-invocation: true/m);
  assert.doesNotMatch(ler('.agents/skills/issue/SKILL.md'), /^disable-model-invocation: true/m);
});

test('skill /issue ensina o caminho do dsh: subagent genérico com o papel e argumento vindo da mensagem', () => {
  const s = ler('.agents/skills/issue/SKILL.md');
  assert.match(s, /\.agents\/skills\/papel-analista\/SKILL\.md/);
  assert.match(s, /\.agents\/skills\/papel-revisor\/SKILL\.md/);
  assert.match(s, /dsh/);
  assert.match(s, /subagent/);
  assert.match(s, /dsh[^\n]*mensagem|mensagem[^\n]*dsh/i, 'sem substituição de $ARGUMENTS, o argumento está na mensagem');
});

test('init não sobrescreve papel já customizado no projeto', () => {
  const alvo = join(projeto, '.claude/agents/revisor.md');
  writeFileSync(alvo, 'meu revisor customizado');
  sincronizar(projeto, origem, { sobrescrever: false });
  assert.equal(readFileSync(alvo, 'utf8'), 'meu revisor customizado');
  sincronizar(projeto, origem);
  assert.match(readFileSync(alvo, 'utf8'), /Você é o revisor/);
});

const hook = join(raiz, 'templates/.claude/hooks/bloqueia-comandos.sh');
const roda = (command, agent_type) =>
  spawnSync('bash', [hook], { input: JSON.stringify({ tool_input: { command }, ...(agent_type && { agent_type }) }) }).status;

test('hook: sessão comum não acessa host nem faz merge/force push, mesmo disfarçado', () => {
  for (const c of ['ssh pi@host ls', "bash -c 'ssh pi@host'", 'scp a b:c', 'kubectl get pods', 'docker --context prod ps',
    'git push --force origin x', 'git -C . push -f origin x', 'git push --force-with-lease', 'gh pr merge 12', 'rm -rf /', 'rm -rf ~']) {
    assert.equal(roda(c), 2, `deveria bloquear: ${c}`);
  }
});

test('hook: trabalho normal passa', () => {
  for (const c of ['dotnet test', 'git push origin feature/x', 'git commit -m "fix: ssh timeout"', 'rm -rf bin obj', 'gh pr create --fill', 'docker compose up -d']) {
    assert.equal(roda(c), 0, `deveria liberar: ${c}`);
  }
});

test('hook: infra acessa host, deploy faz merge, mas force push segue bloqueado para todos', () => {
  assert.equal(roda('ssh pi@host ls', 'infra'), 0);
  assert.equal(roda('docker --context prod ps', 'deploy'), 0);
  assert.equal(roda('gh pr merge 12', 'deploy'), 0);
  assert.equal(roda('gh pr merge 12', 'infra'), 2);
  assert.equal(roda('git push --force origin x', 'infra'), 2);
  assert.equal(roda('git push -f origin x', 'deploy'), 2);
});

import { bloco, aplicar } from '../bin/dsh-setup.mjs';

test('dsh-setup: patch idempotente, preserva o que o usuário já tinha', () => {
  const vazio = '# camada do usuário\n[]\n';
  const uma = aplicar(vazio, bloco('/x/PadraoAI'));
  assert.match(uma, /configPath: '\/x\/PadraoAI\/dsh\/hooks\.json'/);
  assert.doesNotMatch(uma, /^\[\]$/m);
  assert.equal(aplicar(uma, bloco('/x/PadraoAI')), uma, 'rodar de novo não muda nada');
  assert.match(aplicar(uma, bloco('/y/Outro')), /pluginRoot: '\/y\/Outro'/);
  assert.equal((aplicar(uma, bloco('/y/Outro')).match(/padraoai-hooks/g) ?? []).length, 1);
});

test('dsh/hooks.json aponta para os 2 hooks reais e casa ferramentas em minúsculo', () => {
  const j = JSON.parse(readFileSync(join(raiz, 'dsh/hooks.json'), 'utf8')).hooks.PreToolUse;
  assert.match(j[0].matcher, /write/); assert.match(j[1].matcher, /bash/);
  for (const h of j) assert.ok(existsSync(join(raiz, h.hooks[0].command.replace('${CLAUDE_PLUGIN_ROOT}/', ''))));
});

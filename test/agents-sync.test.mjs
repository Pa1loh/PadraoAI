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
});

test('dev é worker de lote: edita só na própria worktree, não delega, não abre PR', () => {
  const d = ler('.claude/agents/dev.md');
  assert.match(d, /^isolation: worktree$/m, 'dev paralelo sem worktree pisa no outro');
  assert.match(d, /^tools: .*\bEdit\b/m);
  assert.doesNotMatch(d.match(/^tools: (.*)$/m)[1], /\bAgent\b/, 'subagent não cria subagent');
  assert.match(d, /^disallowedTools: .*\bAgent\b/m);
  assert.match(d, /Não crie subagents/);
  assert.match(d, /TDD/);
  assert.match(d, /gh pr create/, 'deve dizer que PR é do orquestrador');
});

test('/proximas: triagem com paralelismo, para antes de começar, e orquestra dev → revisor → PR', () => {
  for (const rel of ['.claude/skills/proximas/SKILL.md', '.agents/skills/proximas/SKILL.md']) {
    const s = ler(rel);
    assert.doesNotMatch(s, /^disable-model-invocation: true/m, 'a pergunta em linguagem natural precisa acionar a skill');
    for (const palavra of ['gh issue list', 'Onde mexer', 'paralel', 'começa', 'dev', 'revisor', 'gh pr create', 'worktree', 'docs/engines.yml']) {
      assert.match(s, new RegExp(palavra), `${rel} sem "${palavra}"`);
    }
  }
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

test('/issue-criar é distribuída nos dois catálogos, explícita no Claude e invocável pelo modelo no dsh', () => {
  assert.match(ler('.claude/skills/issue-criar/SKILL.md'), /^disable-model-invocation: true/m);
  const s = ler('.agents/skills/issue-criar/SKILL.md');
  assert.doesNotMatch(s, /^disable-model-invocation: true/m);
  for (const palavra of ['analista', 'Critério de pronto', 'Onde mexer', 'gh issue create', 'sim']) assert.match(s, new RegExp(palavra));
});

test('/issue tem portão de issue pronta, padrão solo, engines.yml e registro por issue', () => {
  const s = ler('.claude/skills/issue/SKILL.md');
  for (const palavra of ['solo', 'docs/engines.yml', 'Portão', 'docs/agent-log.md']) assert.match(s, new RegExp(palavra));
});

test('templates: engines.yml cobre os papéis e o form da issue exige as seções-chave', () => {
  const engines = readFileSync(join(raiz, 'templates/docs/engines.yml'), 'utf8');
  for (const papel of ['issue', 'analista', 'dev', 'revisor']) assert.match(engines, new RegExp(`^  ${papel}:`, 'm'));
  const form = readFileSync(join(raiz, 'templates/.github/ISSUE_TEMPLATE/tarefa-agente.yml'), 'utf8');
  for (const id of ['problema', 'esperado', 'pronto', 'onde']) assert.match(form, new RegExp(`id: ${id}\\n(?:.*\\n)+?    validations:\\n      required: true`));
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

test('dsh/hooks.json aponta para os 3 hooks reais e casa ferramentas em minúsculo', () => {
  const j = JSON.parse(readFileSync(join(raiz, 'dsh/hooks.json'), 'utf8')).hooks.PreToolUse;
  assert.match(j[0].matcher, /write/); assert.match(j[1].matcher, /bash/);
  const comandos = j.flatMap((m) => m.hooks.map((h) => h.command));
  assert.equal(comandos.length, 3);
  for (const c of comandos) assert.ok(existsSync(join(raiz, c.replace('${CLAUDE_PLUGIN_ROOT}/', ''))), c);
  assert.ok(comandos.some((c) => c.endsWith('valida-issue.sh')), 'dsh também barra issue mal formada');
});

test('settings do Claude e do dsh registram os mesmos hooks (nenhuma engine fica sem portão)', () => {
  const nomes = (arq) => JSON.parse(readFileSync(join(raiz, arq), 'utf8')).hooks.PreToolUse
    .flatMap((m) => m.hooks.map((h) => h.command.split('/').pop())).sort();
  assert.deepEqual(nomes('templates/.claude/settings.json'), nomes('dsh/hooks.json'));
});

const hookIssue = join(raiz, 'templates/.claude/hooks/valida-issue.sh');
const rodaIssue = (command) => spawnSync('bash', [hookIssue], { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8' });
const corpoOk = '## Problema\nx\n## Comportamento esperado\ny\n## Critério de pronto\n- [ ] z\n## Onde mexer\na.ts\n';

test('hook valida-issue: barra gh issue create sem seções, longa demais ou disfarçada; libera o resto', () => {
  const dir = mkdtempSync(join(tmpdir(), 'issue-'));
  const bom = join(dir, 'bom.md'); writeFileSync(bom, corpoOk);
  const longo = join(dir, 'longo.md'); writeFileSync(longo, corpoOk + 'palavra '.repeat(450));
  assert.equal(rodaIssue('gh issue create --title x --body "so isso"').status, 2);
  assert.match(rodaIssue('gh issue create --title x --body "so isso"').stderr, /Problema/);
  assert.equal(rodaIssue(`gh issue create --title x --body-file ${longo}`).status, 2);
  assert.match(rodaIssue(`gh issue create --title x --body-file ${longo}`).stderr, /palavras/);
  assert.equal(rodaIssue("bash -c 'gh issue create --title x'").status, 2);
  assert.equal(rodaIssue(`gh issue create --title x --body-file ${bom}`).status, 0);
  for (const c of ['gh issue list', 'gh issue view 3', 'git commit -m "docs: gh issue create"']) assert.equal(rodaIssue(c).status, 0, c);
});

test('revisor checa guia desatualizado (achado IMPORTANTE, não bloqueante) e roda checar.mjs, ainda ≤25 linhas', () => {
  const r = ler('.claude/agents/revisor.md');
  assert.match(r, /docs\/guia-de-desenvolvimento/, 'revisor sem a checagem do guia');
  assert.match(r, /IMPORTANTE/);
  assert.match(r, /não bloqueante/);
  assert.match(r, /guia possivelmente desatualizado/);
  assert.match(r, /guia não precisa mudar porque/);
  assert.match(r, /node docs\/guia-de-desenvolvimento\/checar\.mjs/);
  const corpo = r.split(/^---$/m)[2].trim().split('\n').length;
  assert.ok(corpo <= 25, `corpo do revisor com ${corpo} linhas (máx. 25)`);
});

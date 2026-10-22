import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sincronizar } from '../bin/agents-sync.mjs';

const origem = join(dirname(fileURLToPath(import.meta.url)), '..', 'agents');
const projeto = mkdtempSync(join(tmpdir(), 'agents-'));
sincronizar(projeto, origem);
const ler = (rel) => readFileSync(join(projeto, rel), 'utf8');

test('gera os 3 formatos para cada papel', () => {
  for (const n of ['analista', 'dev', 'revisor', 'infra', 'deploy']) {
    for (const rel of [`.claude/agents/${n}.md`, `.agents/agents/${n}.md`, `.agents/skills/papel-${n}/SKILL.md`]) {
      assert.ok(existsSync(join(projeto, rel)), `falta ${rel}`);
    }
  }
});

test('papéis de leitura não recebem Edit/Write no Claude', () => {
  for (const n of ['analista', 'revisor', 'infra', 'deploy']) {
    const tools = ler(`.claude/agents/${n}.md`).match(/^tools: (.*)$/m)[1];
    assert.doesNotMatch(tools, /\b(Edit|Write)\b/, `${n} não pode editar`);
  }
});

test('só o dev edita código e ninguém tem WebFetch junto de Bash em infra/deploy', () => {
  assert.match(ler('.claude/agents/dev.md'), /^tools: .*Edit/m);
  for (const n of ['infra', 'deploy']) {
    assert.match(ler(`.claude/agents/${n}.md`), /^disallowedTools: .*WebFetch/m);
  }
});

test('nenhum papel cria subagents e modelo do Antigravity é válido', () => {
  for (const n of ['analista', 'dev', 'revisor', 'infra', 'deploy']) {
    assert.match(ler(`.claude/agents/${n}.md`), /Não crie subagents/);
    assert.match(ler(`.agents/agents/${n}.md`), /^model: (inherit|flash|pro)$/m);
  }
});

test('init não sobrescreve papel já customizado no projeto', async () => {
  const { writeFileSync } = await import('node:fs');
  const alvo = join(projeto, '.claude/agents/dev.md');
  writeFileSync(alvo, 'meu dev customizado');
  sincronizar(projeto, origem, { sobrescrever: false });
  assert.equal(readFileSync(alvo, 'utf8'), 'meu dev customizado');
  sincronizar(projeto, origem);
  assert.match(readFileSync(alvo, 'utf8'), /Você é o dev/);
});

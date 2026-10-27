import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checar, LIMITES } from '../bin/lint-contexto.mjs';
import { sincronizar } from '../bin/agents-sync.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

test('o próprio PadraoAI cumpre as regras de contexto (inegociáveis 10 e 11)', () => {
  assert.deepEqual(checar(raiz), []);
});

test('lint pega AGENTS.md grande ou com @import, skill gorda, descrição longa e papel inchado', () => {
  const d = mkdtempSync(join(tmpdir(), 'lint-'));
  writeFileSync(join(d, 'AGENTS.md'), '@outro.md\n' + 'linha\n'.repeat(130));
  mkdirSync(join(d, 'skills/gorda'), { recursive: true });
  writeFileSync(join(d, 'skills/gorda/SKILL.md'), `---\nname: gorda\ndescription: ${'x'.repeat(400)}\n---\n` + 'l\n'.repeat(130));
  mkdirSync(join(d, 'agents'), { recursive: true });
  writeFileSync(join(d, 'agents/inchado.md'), `---\nname: inchado\nskills: a, b, c\n---\n` + 'l\n'.repeat(40));
  const erros = checar(d).join('\n');
  for (const trecho of ['AGENTS.md: 131', '@import', 'skills/gorda: 134 linhas', 'description com 400', 'inchado.md: corpo com 40', '3 skills']) {
    assert.match(erros, new RegExp(trecho));
  }
});

test('exceção só vale listada em .contexto-allow', () => {
  const d = mkdtempSync(join(tmpdir(), 'lint-'));
  mkdirSync(join(d, 'skills/vendor'), { recursive: true });
  writeFileSync(join(d, 'skills/vendor/SKILL.md'), '---\nname: vendor\ndescription: ok\n---\n' + 'l\n'.repeat(200));
  assert.equal(checar(d).length, 1);
  writeFileSync(join(d, '.contexto-allow'), 'vendor vendorizada\n');
  assert.deepEqual(checar(d), []);
});

test('papéis não pré-carregam skill: a lista vai como dica em texto, carga sob demanda', () => {
  const projeto = mkdtempSync(join(tmpdir(), 'ctx-'));
  sincronizar(projeto, join(raiz, 'agents'));
  for (const f of readdirSync(join(projeto, '.claude/agents'))) {
    const frontmatter = readFileSync(join(projeto, '.claude/agents', f), 'utf8').split('\n---\n')[0];
    assert.doesNotMatch(frontmatter, /^skills:/m, `${f}: skills: no frontmatter injeta a skill inteira a cada chamada do subagent`);
  }
  assert.ok(LIMITES.papelSkills <= 2);
});

test('revisor não carrega a auditoria de segurança de 300+ linhas a cada revisão', () => {
  assert.doesNotMatch(readFileSync(join(raiz, 'agents/revisor.md'), 'utf8'), /^skills:.*security-audit/m);
});

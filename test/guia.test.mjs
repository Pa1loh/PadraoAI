import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { request } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checarGuia, OBRIGATORIAS } from '../docs/guia-de-desenvolvimento/checar.mjs';
import { dados, criarServidor } from '../docs/guia-de-desenvolvimento/servir.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUIA = join(raiz, 'docs/guia-de-desenvolvimento/index.html');
const secoes = OBRIGATORIAS.map((id) => `<section id="${id}"></section>`).join('');

test('o guia real passa: caminhos citados existem, âncoras têm id, seções obrigatórias presentes', () => {
  assert.deepEqual(checarGuia(readFileSync(GUIA, 'utf8'), raiz), []);
});

test('guia:check pega caminho inexistente, âncora sem id, seção faltando e id duplicado', () => {
  const html = `<code>bin/nao-existe.mjs</code><code>README.md</code><code class="ext">AGENTS.md</code>
    <code>npm run guia</code><code>skills/*/SKILL.md</code><a href="#sumiu">x</a><a href="../../README.md">r</a>
    <a href="../../NADA.md">n</a><p id="dup"></p><p id="dup"></p><section id="inicio"></section>`;
  const erros = checarGuia(html, raiz).join('\n');
  for (const trecho of ['bin/nao-existe.mjs', '#sumiu', 'NADA.md', 'em-30-segundos', 'id duplicado: dup']) assert.match(erros, new RegExp(trecho));
  for (const ok of ['README.md não existe', 'AGENTS.md', 'npm run guia', 'skills/\\*']) assert.doesNotMatch(erros, new RegExp(ok));
});

test('guia:check aceita guia mínimo correto', () => {
  assert.deepEqual(checarGuia(`${secoes}<a href="#inicio">i</a><code>bin/padraoai.mjs:12</code>`, raiz), []);
});

test('dados do guia vêm do repo: papéis, skills (com description dobrada) e rules, sem chamar gh', () => {
  const d = dados(raiz, { gh: false });
  assert.ok(d.papeis.some((p) => p.nome === 'revisor' && p.acesso === 'leitura'));
  assert.ok(d.skills.some((s) => s.nome === 'issue' && s.origem === 'skills' && s.publicada));
  assert.ok(d.skills.some((s) => s.nome === 'humanizer' && s.origem === 'extras/skills'));
  assert.ok(d.skills.find((s) => s.nome === 'sonarqube').descricao.length > 10);
  assert.ok(d.rules.some((r) => r.arquivo === 'rules/tdd-protocol.md'));
  assert.equal(d.estado, null);
});

test('servidor do guia: só Host local, serve a página e o JSON, não sai da raiz nem expõe .git', async () => {
  const s = criarServidor(raiz, { gh: false });
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${s.address().port}`;
  try {
    assert.equal((await fetch(base + '/docs/guia-de-desenvolvimento/index.html')).status, 200);
    assert.ok((await (await fetch(base + '/dados.json')).json()).skills.length > 5);
    assert.equal((await fetch(base + '/', { redirect: 'manual' })).status, 302);
    assert.equal((await fetch(base + '/.git/config')).status, 404);
    assert.equal((await fetch(base + '/%2e%2e/%2e%2e/etc/passwd')).status, 404);
    // fetch ignora o header Host; node:http não (simula DNS rebinding).
    const status = await new Promise((ok) => request(base + '/dados.json', { headers: { host: 'evil.com' } }, (r) => ok(r.statusCode)).end());
    assert.equal(status, 403);
  } finally { s.close(); }
});

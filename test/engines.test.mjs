import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { spawnSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerEngines, escreverEngines, validar, resolver } from '../bin/engines.mjs';
import { criarServidor, catalogo } from '../bin/engines-ui.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const modelo = readFileSync(join(raiz, 'templates/docs/engines.yml'), 'utf8');

test('lê o template e a escrita preserva o conteúdo (ida e volta)', () => {
  const e = lerEngines(modelo);
  assert.equal(e.perfil, 'base');
  assert.deepEqual(e.tiers.forte, { engine: 'claude', modelo: 'opus', esforco: 'high' });
  assert.equal(e.papeis.revisor.outra_familia, true);
  assert.deepEqual(e.fallback.claude, ['agy', 'dsh']);
  assert.deepEqual(lerEngines(escreverEngines(e)), e);
  assert.deepEqual(validar(e), []);
});

test('validação aponta o valor errado: perfil, tier inexistente, nome malformado', () => {
  const e = lerEngines(modelo);
  e.perfil = 'barato'; e.papeis.dev.base = 'ultra'; e.fallback['x y'] = [];
  const erros = validar(e).join('\n');
  assert.match(erros, /perfil "barato"/);
  assert.match(erros, /tier "ultra" não existe/);
  assert.match(erros, /fallback "x y"/);
  assert.throws(() => escreverEngines(e), /inválido/);
});

test('resolver: revisor "outra família" não cai na engine do dev; sem alternativa, avisa', () => {
  const e = lerEngines(modelo);
  const rev = () => resolver(e).find((l) => l.papel === 'revisor');
  assert.equal(resolver(e).find((l) => l.papel === 'dev').engine, 'claude');
  assert.equal(rev().engine, 'agy'); assert.match(rev().via, /outra família \(dev usa claude\)/);
  e.indisponivel = ['agy', 'dsh'];
  assert.equal(rev().engine, 'claude'); assert.match(rev().via, /sem engine diferente/);
});

test('resolver: engine indisponível cai no fallback; sem nenhuma, avisa', () => {
  const e = lerEngines(modelo);
  e.indisponivel = ['claude'];
  const dev = resolver(e).find((l) => l.papel === 'dev');
  assert.equal(dev.engine, 'agy'); assert.match(dev.via, /fallback de claude/);
  e.indisponivel = ['claude', 'agy', 'dsh'];
  assert.equal(resolver(e).find((l) => l.papel === 'dev').engine, null);
  e.indisponivel = []; e.perfil = 'qualidade';
  assert.equal(resolver(e).find((l) => l.papel === 'dev').esforco, 'high');
});

// fetch ignora o header Host; http.request deixa forjar, como faria um site com DNS rebinding.
const statusComHost = (base, caminho, host) => new Promise((ok, falha) => {
  const u = new URL(base);
  request({ host: u.hostname, port: u.port, path: caminho, headers: { host } }, (r) => { r.resume(); ok(r.statusCode); }).on('error', falha).end();
});

async function comServidor(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'eng-'));
  const arq = join(dir, 'engines.yml'); writeFileSync(arq, modelo);
  const cat = join(dir, 'catalogo.json');
  writeFileSync(cat, JSON.stringify({ entries: [{ agent: 'claude', discovered: { models: [{ id: 'opus', efforts: [{ value: 'high' }] }] } }] }));
  const { servidor, token } = criarServidor(arq, { catalogoArq: cat });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  try { await fn({ base, token, arq }); } finally { servidor.close(); }
}

test('servidor: exige token e Host local; GET/PUT/plano e catálogo funcionam; PUT inválido não grava', async () => {
  await comServidor(async ({ base, token, arq }) => {
    assert.equal((await fetch(`${base}/api/engines`)).status, 403, 'sem token');
    assert.equal((await fetch(`${base}/api/engines?t=errado`)).status, 403);
    assert.equal(await statusComHost(base, `/api/engines?t=${token}`, 'evil.com:80'), 403, 'DNS rebinding');
    assert.equal(await statusComHost(base, `/api/engines?t=${token}`, new URL(base).host), 200);
    const { engines } = await (await fetch(`${base}/api/engines?t=${token}`)).json();
    assert.equal(engines.perfil, 'base');
    assert.match(await (await fetch(`${base}/?t=${token}`)).text(), /Quem faz o quê/);
    assert.deepEqual((await (await fetch(`${base}/api/catalogo?t=${token}`)).json()).claude[0], { id: 'opus', esforcos: ['high'] });

    const antes = readFileSync(arq, 'utf8');
    const ruim = await fetch(`${base}/api/engines?t=${token}`, { method: 'PUT', body: JSON.stringify({ ...engines, perfil: 'x' }) });
    assert.equal(ruim.status, 422); assert.equal(readFileSync(arq, 'utf8'), antes);
    const pre = await (await fetch(`${base}/api/plano?t=${token}`, { method: 'POST', body: JSON.stringify({ ...engines, indisponivel: ['claude'] }) })).json();
    assert.equal(pre.plano.find((l) => l.papel === 'dev').engine, 'agy'); assert.equal(readFileSync(arq, 'utf8'), antes, 'pré-visualizar não grava');

    const ok = await fetch(`${base}/api/engines?t=${token}`, { method: 'PUT', body: JSON.stringify({ ...engines, perfil: 'economico' }) });
    assert.equal(ok.status, 200); assert.equal(lerEngines(readFileSync(arq, 'utf8')).perfil, 'economico');
    const grande = await fetch(`${base}/api/engines?t=${token}`, { method: 'PUT', body: 'x'.repeat(70000) }).catch((e) => e);
    assert.ok(grande instanceof Error || grande.status >= 400, 'corpo enorme é recusado');
  });
});

test('catálogo ausente ou quebrado devolve vazio, não derruba a página', () => {
  assert.deepEqual(catalogo('/nao/existe.json'), {});
  const dir = mkdtempSync(join(tmpdir(), 'cat-')); writeFileSync(join(dir, 'c.json'), '{quebrado');
  assert.deepEqual(catalogo(join(dir, 'c.json')), {});
});

test('CLI: `engines plano` mostra a engine efetiva por papel e não cai no init', () => {
  const proj = mkdtempSync(join(tmpdir(), 'cli-'));
  mkdirSync(join(proj, 'docs')); copyFileSync(join(raiz, 'templates/docs/engines.yml'), join(proj, 'docs/engines.yml'));
  const r = spawnSync('node', [join(raiz, 'bin/padraoai.mjs'), 'engines', 'plano'], { cwd: proj, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /perfil: base/); assert.match(r.stdout, /dev\s+claude\s+sonnet medium/); assert.match(r.stdout, /revisor\s+agy/);
  assert.doesNotMatch(r.stdout, /Criados/);
});

test('pacote npm leva o que o init e o agents precisam (skills do fluxo, dsh, página do editor)', () => {
  const r = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: raiz, encoding: 'utf8' });
  const arquivos = JSON.parse(r.stdout)[0].files.map((f) => f.path);
  for (const f of ['skills/issue/SKILL.md', 'skills/issue-criar/SKILL.md', 'dsh/hooks.json', 'bin/engines-ui.html', 'templates/.claude/hooks/valida-issue.sh', 'templates/docs/engines.yml']) {
    assert.ok(arquivos.includes(f), `falta no pacote: ${f}`);
  }
});

const navegador = ['chromium', 'google-chrome-stable', 'google-chrome', 'chrome'].find((b) => spawnSync('which', [b]).status === 0);

test('página: renderiza tiers, papéis, fallback e plano de verdade no navegador (pula sem Chromium/Chrome)', { skip: !navegador && 'sem navegador' }, async () => {
  await comServidor(async ({ base, token }) => {
    // assíncrono de propósito: o servidor roda neste processo e um spawnSync o travaria
    const { stdout: dom } = await promisify(execFile)(navegador, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=4000', '--dump-dom', `${base}/?t=${token}`], { timeout: 60000 });
    for (const trecho of ['<td>forte</td>', '<td>revisor</td>', '<td>claude</td><td><input', 'claude · sonnet · medium', 'outra família (dev usa claude)']) assert.ok(dom.includes(trecho), `a página não renderizou: ${trecho}`);
  });
});

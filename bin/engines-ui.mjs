// padraoai engines [arquivo] [--porta N] [--abrir]  → página local para editar docs/engines.yml.
// Só 127.0.0.1, token por execução e checagem de Host (um site aberto no navegador não consegue gravar o arquivo).
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerEngines, escreverEngines, validar, resolver } from './engines.mjs';

const PAGINA = join(dirname(fileURLToPath(import.meta.url)), 'engines-ui.html');
const LIMITE_CORPO = 64 * 1024;

// Catálogo de modelos que o Orca já mantém por agente; sem ele a página aceita texto livre.
export function catalogo(arquivo = join(homedir(), '.config', 'orca', 'agent-model-catalog.json')) {
  if (!existsSync(arquivo)) return {};
  try {
    const entradas = JSON.parse(readFileSync(arquivo, 'utf8')).entries ?? [];
    return Object.fromEntries(entradas.map((e) => [e.agent, (e.discovered?.models ?? []).map((m) => ({ id: m.id, esforcos: (m.efforts ?? []).map((x) => x.value) }))]));
  } catch { return {}; }
}

const corpo = (req) => new Promise((ok, falha) => {
  let t = '';
  req.on('data', (c) => { t += c; if (t.length > LIMITE_CORPO) { req.destroy(); falha(new Error('corpo grande demais')); } });
  req.on('end', () => ok(t));
});

// Pré-visualização sem gravar: valida e resolve o que está na tela.
const planoDe = (texto) => {
  const e = JSON.parse(texto);
  const erros = validar(e);
  return erros.length ? { erros } : { plano: resolver(e) };
};

export function criarServidor(arquivo, { token = randomBytes(16).toString('hex'), catalogoArq } = {}) {
  const lido = () => lerEngines(readFileSync(arquivo, 'utf8'));
  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const hostOk = /^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? '');
    const json = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (!hostOk || url.searchParams.get('t') !== token) return json(403, { erro: 'acesso negado' });
    try {
      if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(readFileSync(PAGINA, 'utf8')); }
      if (url.pathname === '/api/catalogo') return json(200, catalogo(catalogoArq));
      if (url.pathname === '/api/plano' && req.method === 'POST') return json(200, planoDe(await corpo(req)));
      if (url.pathname !== '/api/engines') return json(404, { erro: 'não existe' });
      if (req.method === 'GET') { const e = lido(); return json(200, { engines: e, plano: resolver(e) }); }
      if (req.method !== 'PUT') return json(405, { erro: 'método não permitido' });
      const e = JSON.parse(await corpo(req));
      const erros = validar(e);
      if (erros.length) return json(422, { erros });
      writeFileSync(arquivo, escreverEngines(e));
      return json(200, { engines: e, plano: resolver(e) });
    } catch (erro) { return json(400, { erro: erro.message }); }
  });
  return { servidor, token };
}

export function iniciar(arquivo, porta = 4317) {
  const { servidor, token } = criarServidor(arquivo);
  return new Promise((ok) => servidor.listen(porta, '127.0.0.1', () => ok({ servidor, url: `http://127.0.0.1:${servidor.address().port}/?t=${token}` })));
}

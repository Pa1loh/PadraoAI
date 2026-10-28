#!/usr/bin/env node
// npm run guia [-- --porta N]  → serve o repo só em 127.0.0.1 e monta /dados.json AO VIVO a partir de
// agents/, skills/, extras/skills/, rules/ e do `gh` (estado). Nada gerado em disco: não fica velho.
// Por file:// a página abre igual; só o catálogo e o estado pedem o servidor.
import { createServer } from 'node:http';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { lerAgente } from '../../bin/agents-sync.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PAGINA = '/docs/guia-de-desenvolvimento/index.html';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8' };

// description pode vir em 1 linha, entre aspas ou dobrada (`>`), como no sonarqube.
function frontmatter(texto) {
  const fm = texto.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const nome = fm.match(/^name:\s*(.*)$/m)?.[1].trim() ?? '';
  let desc = fm.match(/^description:\s*(.*)$/m)?.[1].trim() ?? '';
  if (/^[>|]-?$/.test(desc)) desc = (fm.split(/^description:.*$/m)[1] ?? '').split(/\n(?=\S)/)[0].replace(/\s+/g, ' ').trim();
  return { nome, descricao: desc.replace(/^["']|["']$/g, '') };
}

const pastas = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => existsSync(join(dir, n, 'SKILL.md'))) : []);

function skills(raiz) {
  const publicadas = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).files ?? [];
  return ['skills', 'extras/skills'].flatMap((origem) => pastas(join(raiz, origem)).map((pasta) => {
    const texto = readFileSync(join(raiz, origem, pasta, 'SKILL.md'), 'utf8');
    const { nome, descricao } = frontmatter(texto);
    return { nome: nome || pasta, pasta: `${origem}/${pasta}`, origem, descricao, linhas: texto.split('\n').length, publicada: publicadas.includes(`${origem}/${pasta}`) };
  }));
}

function papeis(raiz) {
  return readdirSync(join(raiz, 'agents')).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => {
    const { meta } = lerAgente(readFileSync(join(raiz, 'agents', f), 'utf8'));
    return { nome: meta.name, descricao: meta.description, modelo: meta.model, acesso: meta.acesso, skills: meta.skills ?? '', arquivo: `agents/${f}` };
  });
}

const rules = (raiz) => readdirSync(join(raiz, 'rules')).filter((f) => f.endsWith('.md')).map((f) => {
  const texto = readFileSync(join(raiz, 'rules', f), 'utf8');
  return { arquivo: `rules/${f}`, titulo: texto.match(/^#\s+(.*)$/m)?.[1] ?? f, linhas: texto.split('\n').length };
});

// Estado vem do GitHub; sem `gh` autenticado a página diz isso em vez de quebrar.
function estado(raiz) {
  const gh = (...args) => JSON.parse(execFileSync('gh', args, { cwd: raiz, timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  try {
    return {
      issues: gh('issue', 'list', '--state', 'open', '--limit', '30', '--json', 'number,title,url,labels'),
      prs: gh('pr', 'list', '--state', 'all', '--limit', '12', '--json', 'number,title,url,state,mergedAt,headRefName'),
    };
  } catch { return null; }
}

export function dados(raiz = RAIZ, { gh = true } = {}) {
  return { papeis: papeis(raiz), skills: skills(raiz), rules: rules(raiz), estado: gh ? estado(raiz) : null, gerado: new Date().toISOString() };
}

export function criarServidor(raiz = RAIZ, opcoes = {}) {
  return createServer((req, res) => {
    const fim = (status, corpo = '', tipo = 'text/plain; charset=utf-8') => { res.writeHead(status, { 'content-type': tipo }); res.end(corpo); };
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? '')) return fim(403, 'acesso negado');
    const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (caminho === '/') { res.writeHead(302, { location: PAGINA }); return res.end(); }
    if (caminho === '/dados.json') return fim(200, JSON.stringify(dados(raiz, opcoes)), TIPOS['.json']);
    const arq = resolve(raiz, '.' + caminho);
    const dentro = arq.startsWith(raiz + sep) && !arq.slice(raiz.length).split(sep).includes('.git');
    if (!dentro || !existsSync(arq) || !statSync(arq).isFile()) return fim(404, 'não existe');
    return fim(200, readFileSync(arq), TIPOS[extname(arq)] ?? 'text/plain; charset=utf-8');
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const porta = Number(args[args.indexOf('--porta') + 1]) || 4318;
  const servidor = criarServidor();
  servidor.listen(porta, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${servidor.address().port}${PAGINA}`;
    console.log(`Guia de desenvolvimento: ${url}\nCtrl+C para sair.`);
    if (args.includes('--abrir')) for (const abre of ['omarchy-launch-webapp', 'xdg-open', 'open']) { try { execFileSync(abre, [url], { stdio: 'ignore' }); break; } catch { /* tenta o próximo */ } }
  });
}

#!/usr/bin/env node
// guia:check  → o guia não pode citar o que não existe (guia desatualizado é pior que nenhum).
//   - todo caminho em <code> existe no repo (glob: confere a pasta antes do *; `arquivo:linha` vale)
//   - todo href="#x" tem id="x"; todo href relativo aponta para arquivo existente
//   - seções obrigatórias presentes e nenhum id duplicado
// <code class="ext"> marca caminho de OUTRO lugar (projeto que adota, máquina): não é checado.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OBRIGATORIAS = ['inicio', 'em-30-segundos', 'dominio', 'arquitetura', 'regras', 'pode-nao-pode', 'como-fazer', 'estado', 'fontes'];
const DIR_GUIA = 'docs/guia-de-desenvolvimento';

const pareceCaminho = (t) => !/[\s&<>{}$]|:\/\//.test(t) && !/^[~/@#-]/.test(t)
  && (t.includes('/') || /^\.?[\w.-]+\.(md|mjs|js|json|ya?ml|sh|html)$/.test(t) || /^\.[\w-]+$/.test(t));

function caminhoFalta(t, raiz) {
  const limpo = t.replace(/:\d+$/, '').replace(/\/$/, '');
  const prefixo = limpo.split('*')[0];
  const alvo = limpo.includes('*') ? prefixo.slice(0, prefixo.lastIndexOf('/')) || '.' : limpo;
  return !existsSync(join(raiz, alvo));
}

export function checarGuia(html, raiz) {
  const erros = [];
  for (const [, attrs = '', texto] of html.matchAll(/<code(\s[^>]*)?>([^<]+)<\/code>/g)) {
    if (/class="[^"]*\bext\b/.test(attrs) || !pareceCaminho(texto)) continue;
    if (caminhoFalta(texto, raiz)) erros.push(`caminho citado não existe: ${texto}`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) erros.push(`id duplicado: ${id}`);
  for (const [, alvo] of html.matchAll(/href="#([\w-]+)"/g)) if (!ids.includes(alvo)) erros.push(`âncora sem id: #${alvo}`);
  for (const [, rel] of html.matchAll(/href="((?!#|[a-z]+:)[^"]+)"/g)) {
    if (!existsSync(resolve(raiz, DIR_GUIA, rel.split('#')[0]))) erros.push(`link relativo quebrado: ${rel}`);
  }
  for (const id of OBRIGATORIAS) if (!ids.includes(id)) erros.push(`seção obrigatória ausente: #${id}`);
  return erros;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const erros = checarGuia(readFileSync(join(raiz, DIR_GUIA, 'index.html'), 'utf8'), raiz);
  if (erros.length) { console.error(`guia:check: ${erros.length} problema(s)\n- ${erros.join('\n- ')}`); process.exit(1); }
  console.log('guia:check: ok (caminhos, âncoras, links e seções)');
}

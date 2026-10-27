#!/usr/bin/env node
// lint-contexto [raiz=.]  → inegociáveis 10 e 11: cada papel carrega só o que é dele, nada de contexto inchado.
//   - AGENTS.md ≤ 120 linhas e sem @import (Antigravity e dsh leem o texto literal)
//   - skills/*/SKILL.md ≤ 120 linhas e description de 1 linha ≤ 350 caracteres (a description entra no contexto de TODA sessão)
//   - papel (agents/*.md): corpo ≤ 25 linhas e no máximo 2 skills; o agents-sync não pode pré-carregar skill no frontmatter
// Exceção só com motivo escrito em .contexto-allow ("<skill> <motivo>"): vendorizada ou gerenciada por outra ferramenta.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITES = { agentsMd: 120, skillLinhas: 120, descricao: 350, papelLinhas: 25, papelSkills: 2 };

const linhas = (t) => t.replace(/\n$/, '').split('\n').length;
const descricao = (t) => t.match(/^description:\s*(.*)$/m)?.[1].replace(/^["']|["']$/g, '') ?? '';

export function permitidos(raiz) {
  const arq = join(raiz, '.contexto-allow');
  if (!existsSync(arq)) return new Set();
  return new Set(readFileSync(arq, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]));
}

export function checar(raiz) {
  const erros = [];
  const ok = permitidos(raiz);
  for (const rel of ['AGENTS.md', 'templates/AGENTS.md']) {
    const arq = join(raiz, rel);
    if (!existsSync(arq)) continue;
    const t = readFileSync(arq, 'utf8');
    if (linhas(t) > LIMITES.agentsMd) erros.push(`${rel}: ${linhas(t)} linhas (máx. ${LIMITES.agentsMd}); mova domínio para rules com paths: ou ADR`);
    if (/^@\S+/m.test(t)) erros.push(`${rel}: tem @import; Antigravity e dsh leem o texto literal`);
  }
  const skills = join(raiz, 'skills');
  for (const nome of existsSync(skills) ? readdirSync(skills) : []) {
    const arq = join(skills, nome, 'SKILL.md');
    if (!existsSync(arq) || ok.has(nome)) continue;
    const t = readFileSync(arq, 'utf8');
    if (linhas(t) > LIMITES.skillLinhas) erros.push(`skills/${nome}: ${linhas(t)} linhas (máx. ${LIMITES.skillLinhas}); mova detalhe para references/ ou justifique em .contexto-allow`);
    const d = descricao(t).length;
    if (d > LIMITES.descricao) erros.push(`skills/${nome}: description com ${d} caracteres (máx. ${LIMITES.descricao}); ela pesa em toda sessão`);
  }
  const agents = join(raiz, 'agents');
  for (const f of existsSync(agents) ? readdirSync(agents).filter((x) => x.endsWith('.md') && x !== 'README.md') : []) {
    const m = readFileSync(join(agents, f), 'utf8').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) { erros.push(`agents/${f}: sem frontmatter`); continue; }
    const corpo = linhas(m[2]);
    if (corpo > LIMITES.papelLinhas) erros.push(`agents/${f}: corpo com ${corpo} linhas (máx. ${LIMITES.papelLinhas}); o papel lê só o que é dele`);
    const skillsPapel = (m[1].match(/^skills:\s*(.*)$/m)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (skillsPapel.length > LIMITES.papelSkills) erros.push(`agents/${f}: ${skillsPapel.length} skills (máx. ${LIMITES.papelSkills})`);
  }
  return erros;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const erros = checar(resolve(process.argv[2] ?? '.'));
  if (erros.length) { console.error(`lint-contexto: ${erros.length} problema(s)\n- ${erros.join('\n- ')}`); process.exit(1); }
  console.log('lint-contexto: ok');
}

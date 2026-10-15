#!/usr/bin/env node
// padraoai init  → copia templates/ para o projeto atual sem sobrescrever nada.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.cwd();
const [cmd] = process.argv.slice(2);

function copiar(origem, base = origem, criados = [], pulados = []) {
  for (const nome of readdirSync(origem)) {
    const abs = join(origem, nome);
    const rel = relative(base, abs);
    if (statSync(abs).isDirectory()) { copiar(abs, base, criados, pulados); continue; }
    const alvo = join(destino, rel);
    if (existsSync(alvo)) { pulados.push(rel); continue; }
    mkdirSync(dirname(alvo), { recursive: true });
    copyFileSync(abs, alvo);
    criados.push(rel);
  }
  return { criados, pulados };
}

if (cmd !== 'init') {
  console.log('Uso: npx github:Pa1loh/PadraoAI init');
  process.exit(cmd ? 1 : 0);
}
const { criados, pulados } = copiar(join(raiz, 'templates'));
const doc = join(destino, 'docs', 'padraoai');
mkdirSync(doc, { recursive: true });
for (const f of ['inegociaveis.md', 'ADOTAR.md']) if (!existsSync(join(doc, f))) { copyFileSync(join(raiz, f), join(doc, f)); criados.push(`docs/padraoai/${f}`); }
console.log(`Criados (${criados.length}):\n  ${criados.join('\n  ') || '-'}`);
if (pulados.length) console.log(`Já existiam, mantidos (${pulados.length}):\n  ${pulados.join('\n  ')}`);
console.log('\nPróximo passo: diga ao seu agente "leia docs/padraoai/ADOTAR.md e adote o padrão neste projeto".');

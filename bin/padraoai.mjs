#!/usr/bin/env node
// padraoai init  → copia templates/ para o projeto atual sem sobrescrever nada.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { sincronizar } from './agents-sync.mjs';
import { lerEngines, resolver } from './engines.mjs';
import { iniciar } from './engines-ui.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.cwd();
const [cmd, ...resto] = process.argv.slice(2);

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

if (cmd === 'agents') {
  const gerados = sincronizar(destino, join(raiz, 'agents'));
  console.log(`Papéis gerados/atualizados (${gerados.length}):\n  ${gerados.join('\n  ')}`);
  process.exit(0);
}
if (cmd === 'engines') {
  const plano = resto[0] === 'plano';
  const arquivo = join(destino, resto.find((x, i) => !x.startsWith('--') && !(i === 0 && plano) && resto[i - 1] !== '--porta') ?? 'docs/engines.yml');
  if (!existsSync(arquivo)) { console.error(`Sem ${arquivo}. Rode \`init\` ou copie templates/docs/engines.yml.`); process.exit(1); }
  if (plano) {
    const e = lerEngines(readFileSync(arquivo, 'utf8'));
    console.log(`perfil: ${e.perfil}  indisponivel: ${e.indisponivel.join(', ') || '-'}`);
    for (const l of resolver(e)) console.log(`${l.papel.padEnd(10)} ${String(l.engine).padEnd(8)} ${l.modelo} ${l.esforco}  (${l.via})`);
    process.exit(0);
  }
  const porta = Number(resto[resto.indexOf('--porta') + 1]) || 4317;
  const { url } = await iniciar(arquivo, porta);
  console.log(`Editor do engines.yml: ${url}\nCtrl+C para sair.`);
  if (resto.includes('--abrir')) for (const abre of ['omarchy-launch-webapp', 'xdg-open']) { try { execFileSync(abre, [url], { stdio: 'ignore' }); break; } catch { /* tenta o próximo */ } }
  await new Promise(() => {}); // segura o processo (e não cai no init) até Ctrl+C
} else if (cmd !== 'init') {
  console.log('Uso: npx github:Pa1loh/PadraoAI init | agents | engines [plano] [arquivo] [--porta N] [--abrir]');
  process.exit(cmd ? 1 : 0);
}
const { criados, pulados } = copiar(join(raiz, 'templates'));
criados.push(...sincronizar(destino, join(raiz, 'agents'), { sobrescrever: false }));
const doc = join(destino, 'docs', 'padraoai');
mkdirSync(doc, { recursive: true });
for (const f of ['inegociaveis.md', 'ADOTAR.md']) if (!existsSync(join(doc, f))) { copyFileSync(join(raiz, f), join(doc, f)); criados.push(`docs/padraoai/${f}`); }
console.log(`Criados (${criados.length}):\n  ${criados.join('\n  ') || '-'}`);
if (pulados.length) console.log(`Já existiam, mantidos (${pulados.length}):\n  ${pulados.join('\n  ')}`);
console.log('\nPróximo passo: diga ao seu agente "leia docs/padraoai/ADOTAR.md e adote o padrão neste projeto".');

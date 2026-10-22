#!/usr/bin/env node
// dsh-setup  → liga no dsh (DeepSeek) os mesmos hooks de segurança do Claude Code (bloqueia segredo, ssh, merge, force push).
// O dsh não lê .claude/settings.json; o plugin dsh-hooks-claude-code roda o hook por processo, nos perfis abaixo.
// Idempotente: instala o plugin (e o dsh-hook-protocol) na versão do dsh e (re)escreve só o bloco marcado do cordis.patch.yml.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INI = '# >>> padraoai-dsh-hooks (gerenciado por PadraoAI: bin/dsh-setup.mjs) >>>';
const FIM = '# <<< padraoai-dsh-hooks <<<';
export const PERFIS = ['dsh-tui', 'headless'];

export function bloco(raiz) {
  return [INI, '- insert:', '    - id: padraoai-hooks', "      name: '@deepseek-ai/dsh-hooks-claude-code'", '      config:',
    `        configPath: '${join(raiz, 'dsh', 'hooks.json')}'`, `        pluginRoot: '${raiz}'`, FIM].join('\n');
}

export function aplicar(texto, novoBloco) {
  const re = new RegExp(`${INI.replace(/[()>.]/g, '\\$&')}[\\s\\S]*?${FIM}`);
  if (re.test(texto)) return texto.replace(re, novoBloco);
  const semVazio = texto.replace(/^\[\]\s*$/m, '');
  return `${semVazio.trimEnd()}\n${novoBloco}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const versao = execFileSync('dsh', ['--version'], { encoding: 'utf8' }).trim().split(/\s+/).pop();
  for (const perfil of PERFIS) {
    const dir = join(homedir(), '.dsh', 'profiles', perfil);
    if (!existsSync(dir)) { console.log(`- ${perfil}: perfil não existe, pulado`); continue; }
    // o plugin importa o dsh-hook-protocol, que o pnpm não traz sozinho (sem ele o plugin falha ao carregar e nada é bloqueado)
    for (const pacote of ['dsh-hook-protocol', 'dsh-hooks-claude-code']) {
      execFileSync('dsh', ['plugin', '--profile', perfil, 'add', `@deepseek-ai/${pacote}@${versao}`], { stdio: 'ignore' });
    }
    const alvo = join(dir, 'cordis.patch.yml');
    writeFileSync(alvo, aplicar(existsSync(alvo) ? readFileSync(alvo, 'utf8') : '[]\n', bloco(raiz)));
    console.log(`✓ ${perfil}: plugin ${versao} + hooks do PadraoAI`);
  }
}

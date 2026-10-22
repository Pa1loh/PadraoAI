#!/usr/bin/env node
// agents-sync [projeto=.]  → gera, a partir de agents/*.md, os papéis nos 3 CLIs:
//   Claude Code  → .claude/agents/<n>.md        (tools/disallowedTools reais)
//   Antigravity  → .agents/agents/<n>.md        (model flash|pro; subagent nativo)
//   dsh-tui etc. → .agents/skills/papel-<n>/    (SKILL.md: lido por dsh, agy e claude)
//   + skill /issue em .claude/skills e .agents/skills. O dev não é agent: é a sessão da aba.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELO_AGY = { haiku: 'flash', sonnet: 'pro', opus: 'pro', inherit: 'inherit' };

export function lerAgente(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('agente sem frontmatter');
  const meta = Object.fromEntries(m[1].split('\n').map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  return { meta, corpo: m[2].trim() };
}

const linhaSkills = (meta) => (meta.skills ? `\n\nSkills deste papel (carregue sob demanda): ${meta.skills}.` : '');
const fm = (campos) => `---\n${Object.entries(campos).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n`;

export function gerar({ meta, corpo }) {
  const texto = corpo + linhaSkills(meta) + '\n';
  const n = meta.name;
  return {
    [`.claude/agents/${n}.md`]: fm({ name: n, description: meta.description, model: meta.model, tools: meta.tools, disallowedTools: meta.disallowedTools }) + texto,
    [`.agents/agents/${n}.md`]: fm({ name: n, description: meta.description, model: MODELO_AGY[meta.model] ?? 'inherit' }) + texto,
    [`.agents/skills/papel-${n}/SKILL.md`]: fm({ name: `papel-${n}`, description: `Assuma o papel ${n}. ${meta.description}` })
      + `${texto}\nLimites do papel (acesso: ${meta.acesso}): ferramentas permitidas = ${meta.tools}; proibidas = ${meta.disallowedTools ?? 'nenhuma'}. Respeite mesmo que a ferramenta não imponha.\n`,
  };
}

export function sincronizar(projeto, origem, { sobrescrever = true } = {}) {
  const escritos = [];
  for (const f of readdirSync(origem).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
    const arquivos = gerar(lerAgente(readFileSync(join(origem, f), 'utf8')));
    for (const [rel, conteudo] of Object.entries(arquivos)) {
      const alvo = join(projeto, rel);
      if (!sobrescrever && existsSync(alvo)) continue;
      mkdirSync(dirname(alvo), { recursive: true });
      writeFileSync(alvo, conteudo);
      escritos.push(rel);
    }
  }
  // skill /issue: o fluxo da issue (analista → TDD → revisor → PR) como comando explícito, não como esperança de delegação
  const skill = readFileSync(join(origem, '..', 'skills', 'issue', 'SKILL.md'), 'utf8');
  for (const rel of ['.claude/skills/issue/SKILL.md', '.agents/skills/issue/SKILL.md']) {
    const alvo = join(projeto, rel);
    if (!sobrescrever && existsSync(alvo)) continue;
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, skill);
    escritos.push(rel);
  }
  return escritos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const origem = join(dirname(fileURLToPath(import.meta.url)), '..', 'agents');
  const escritos = sincronizar(resolve(process.argv[2] ?? '.'), origem);
  console.log(`Gerados (${escritos.length}):\n  ${escritos.join('\n  ')}`);
}

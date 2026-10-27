// engines.yml: ler, validar, gravar e resolver "quem faz o quê" (o /issue recomenda; a página local edita).
// Só o subconjunto de YAML que o template usa (escalares, listas e mapas em linha), sem dependência.
export const PERFIS = ['economico', 'base', 'qualidade'];
const NOME = /^[\w.-]+$/;

const valor = (s) => {
  const v = s.trim();
  if (v === 'true' || v === 'false') return v === 'true';
  return v.replace(/^["']|["']$/g, '');
};
const lista = (s) => s.replace(/^\[|\]$/g, '').split(',').map(valor).filter((x) => x !== '');
const mapa = (s) => Object.fromEntries(s.replace(/^\{|\}$/g, '').split(',').map((p) => {
  const i = p.indexOf(':');
  return [p.slice(0, i).trim(), valor(p.slice(i + 1))];
}));
const semComentario = (l) => l.replace(/\s+#.*$/, '').trimEnd();

export function lerEngines(texto) {
  const r = { perfil: 'base', indisponivel: [], tiers: {}, papeis: {}, fallback: {} };
  let secao = null;
  for (const bruta of texto.split('\n')) {
    const l = semComentario(bruta);
    if (!l.trim() || l.trim().startsWith('#')) continue;
    const m = l.match(/^(\s*)([\w.-]+):\s*(.*)$/);
    if (!m) continue;
    const [, indent, chave, resto] = m;
    if (!indent && resto === '') { secao = chave; continue; }
    if (!indent) { r[chave] = resto.startsWith('[') ? lista(resto) : valor(resto); secao = null; continue; }
    if (secao === 'fallback') r.fallback[chave] = lista(resto);
    else if (secao in r) r[secao][chave] = mapa(resto);
  }
  return r;
}

export function validar(e) {
  const erros = [];
  if (!PERFIS.includes(e.perfil)) erros.push(`perfil "${e.perfil}" inválido (use ${PERFIS.join(', ')})`);
  if (!Array.isArray(e.indisponivel) || e.indisponivel.some((x) => !NOME.test(x))) erros.push('indisponivel deve ser lista de nomes');
  for (const [t, v] of Object.entries(e.tiers ?? {})) {
    if (!NOME.test(t) || !NOME.test(v.engine ?? '') || !v.modelo || !v.esforco) erros.push(`tier "${t}" precisa de engine, modelo e esforco`);
  }
  for (const [papel, perfis] of Object.entries(e.papeis ?? {})) {
    for (const p of PERFIS) if (!(perfis[p] in e.tiers)) erros.push(`papel "${papel}", perfil ${p}: tier "${perfis[p]}" não existe`);
  }
  for (const [eng, ordem] of Object.entries(e.fallback ?? {})) {
    if (!NOME.test(eng) || !Array.isArray(ordem) || ordem.some((x) => !NOME.test(x))) erros.push(`fallback "${eng}" inválido`);
  }
  return erros;
}

const mapaEmLinha = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
const secaoTexto = (nome, o, fmt) => [`${nome}:`, ...Object.entries(o).map(([k, v]) => `  ${k}: ${fmt(v)}`)].join('\n');

export function escreverEngines(e) {
  const erros = validar(e);
  if (erros.length) throw new Error(`engines.yml inválido: ${erros.join('; ')}`);
  return [
    '# Quem faz o quê, por qualidade x custo. O /issue e o /issue-criar leem este arquivo e RECOMENDAM;',
    '# só mudam de engine se você aprovar. Edite aqui ou em `padraoai engines` (página local).',
    `perfil: ${e.perfil}          # ${PERFIS.join(' | ')}`,
    `indisponivel: [${e.indisponivel.join(', ')}]      # engines sem quota ou fora do ar agora`,
    '',
    secaoTexto('tiers', e.tiers, mapaEmLinha),
    '',
    secaoTexto('papeis', e.papeis, mapaEmLinha) + '    # tier por perfil; outra_familia: revisor em engine diferente da do dev',
    '',
    secaoTexto('fallback', e.fallback, (v) => `[${v.join(', ')}]`) + '    # ordem de engines quando a primeira está em indisponivel',
    '',
  ].join('\n');
}

// Engine efetiva por papel no perfil ativo: se a do tier está indisponível, a primeira disponível do fallback.
// Papel com outra_familia (revisor) não pode cair na engine do dev: pega a primeira disponível do fallback que seja outra
// (o modelo vira o padrão do CLI, porque o do tier pertence à engine do dev).
export function resolver(e) {
  const fora = new Set(e.indisponivel);
  const linhas = Object.entries(e.papeis).map(([papel, perfis]) => {
    const tier = e.tiers[perfis[e.perfil]];
    const alvo = fora.has(tier.engine) ? (e.fallback[tier.engine] ?? []).find((x) => !fora.has(x)) : tier.engine;
    return { papel, tier: perfis[e.perfil], engine: alvo ?? null, modelo: tier.modelo, esforco: tier.esforco,
      via: alvo === tier.engine ? 'direto' : alvo ? `fallback de ${tier.engine}` : 'sem engine disponível', outra_familia: perfis.outra_familia === true };
  });
  const dev = linhas.find((l) => l.papel === 'dev');
  for (const l of linhas.filter((x) => x.outra_familia && dev?.engine && x.engine === dev.engine)) {
    const outra = (e.fallback[dev.engine] ?? []).find((x) => x !== dev.engine && !fora.has(x));
    if (outra) Object.assign(l, { engine: outra, modelo: 'padrao-do-cli', via: `outra família (dev usa ${dev.engine})` });
    else l.via += ' (sem engine diferente da do dev disponível)';
  }
  return linhas;
}

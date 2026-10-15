---
name: tdd-regressao
description: Corrigir bug com teste de regressão primeiro (vermelho → fix → verde → evidência). Use quando o usuário pedir "corrigir bug", "fix", "regressão", "issue de bug" ou reportar comportamento errado.
---

# Bug = teste de regressão primeiro

1. **Reproduzir pelo sintoma**, não pelo palpite de causa. Ler a issue; separar o observado do diagnosticado.
2. **Escrever o teste vermelho** `Regressao_Issue{N}_<comportamento>` no nível mais baixo que reproduz. Rodar e **ver falhar pelo motivo certo** (colar a saída).
3. **Corrigir a causa-raiz**, mínimo de código. Não suprimir o erro nem afrouxar o teste.
4. Rodar o teste novo, depois a suíte inteira. Colar a saída verde.
5. PR: link da issue + nome do teste + saída vermelha (antes) e verde (depois).

Sem como reproduzir em teste? Diga isso na issue e descreva a verificação manual; não declare corrigido.
Ao terminar, pergunte: que falha do processo deixou o bug passar? Vira teste, hook ou linha no AGENTS.md.

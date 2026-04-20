# Regra: Áudio no Pipeline de Vídeo

## Separação de Responsabilidades (CRÍTICO)

O áudio de um Reel/TikTok/Short gerado pelo Hub Afiliado tem **duas camadas** que vivem em **etapas diferentes** do pipeline. Confundir onde cada uma é aplicada quebra o objetivo de growth hacking.

| Camada | Onde é aplicada | Responsável |
|---|---|---|
| **Narração ElevenLabs** | Geração local (FFmpeg) | `GeradorDeVideoService` (Épico 0.1-B) |
| **Música Trend** | Postagem (UI Instagram/TikTok) | `PlaywrightSocialProvider` (Épico 0.2-A) |

**NUNCA mixe música de fundo localmente via `amix`/`volume` no FFmpeg.**

## Por quê (regra de negócio — não é arbitrária)

O algoritmo do Instagram/TikTok dá **boost de viralização** para vídeos que usam músicas da **biblioteca oficial** marcadas como "Em Alta" / "Trending". Uma trilha embutida no MP4 é tratada pela plataforma como "áudio original" — **não recebe boost algorítmico** e ainda pode ser flageada por direitos autorais.

Só a seleção via UI nativa (o que o Playwright simula) dispara o sinal algorítmico que o time quer explorar. Por isso a música trend é responsabilidade do **postador**, não do **gerador**.

## Regras do `GeradorDeVideoService` (Épico 0.1-B)

- Áudio final do MP4 = **apenas narração ElevenLabs**.
- Aplicar `loudnorm` (EBU R128) para normalização consistente entre vídeos:
  ```
  -af "loudnorm=I=-16:TP=-1.5:LRA=11"
  ```
- Duração ~15s. Corte seco no fim funciona melhor em Reels (nada de fade out artificial).
- Ken Burns fallback via `zoompan` quando `Oferta.VideoUrl` for null — não mixar música para "compensar".

## Regras do `PlaywrightSocialProvider` (Épico 0.2-A)

- Após upload, SEMPRE selecionar uma música da aba "Em Alta" / "Trending".
- Se a plataforma expuser slider de mix: narração ≈ **80%**, música ≈ **20%**.
- Se a seleção automática falhar: postar sem música + log warning + screenshot do estado do DOM.
- Instagram, TikTok e Shorts têm UIs diferentes — cada um precisa do seu próprio caminho de navegação.

## Checklist QA pré-publicação

- [ ] Vídeo local (MP4 saindo do `GeradorDeVideoService`) tem só narração, sem música embutida
- [ ] Loudness normalizado (sem picos gritantes entre vídeos sequenciais)
- [ ] Na postagem, música trend foi aplicada pela UI da plataforma
- [ ] Narração continua audível por cima da música trend (slider ajustado)
- [ ] Sem clipping reportado no log do FFmpeg

## Origem

Projeto: `AfonsoV2` (Hub Afiliado)
Fonte: `AfonsoV2/.claude/rules/video-audio-mix.md`

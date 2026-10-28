# Infra pessoal do mantenedor

O [PadraoAI](https://github.com/Pa1loh/PadraoAI) é open source. Este arquivo é o homelab pessoal de quem mantém o repositório. Não faz parte do padrão a adotar, não é template e não deve ser copiado para o `AGENTS.md` de outro projeto.

Sem senha, token, conteúdo de banco ou nome de rede Wi-Fi. Os IPs são da rede local (Tailscale e o cabo entre as duas máquinas).

Quem executa nestes hosts é o agente `infra`, em sessão própria, e só muda estado com um "sim". A sessão da issue sugere e para. Não dá `ssh` nem sobe serviço no meio da issue.

Mapa lido em 2026-10-28, em leitura no PC. Se o comando não bater com o arquivo, o comando manda.

## Máquinas

| Máquina | Acesso | Serve para |
|---|---|---|
| PC x86 | `ssh paulo@100.122.231.113` | GPU, Blender, NAS, backups, Penpot, containers que já estão no ar |
| Orange Pi 3B | `ssh orangepi@100.106.88.49` | Gateway do cabo até o PC e o Nginx que manda `/r/` antigo para `go.autoafiliado.app` |
| Laptop de trabalho | esta máquina | Código, agente, issue. Não é servidor |

O Orange Pi (RK3566, ARM64) recebe a internet no Wi-Fi e entrega a sub-rede `10.42.0.0/24` no `eth0` (`ipv4.method = shared`). O cabo entra no `eno1` do PC, com métrica 100, na frente do Wi-Fi do PC (métrica 600). O Pi não renderiza, não roda LLM e não é o lugar de build .NET nem de Penpot.

## PC — o que está no ar

- **CPU:** Intel Core i7-870 (4 núcleos, 8 threads). Tem SSE4.2. Não tem AVX nem AVX2. Binário moderno (Ollama oficial, wheel de Whisper) morre com instrução ilegal. Build local sai com AVX desligado.
- **RAM:** 7,7 GB. Com o Penpot no ar, a leitura ficou em cerca de 4,8 GB em uso e 2,8 GB disponíveis. ZRAM de 7,7 GB (`zstd`); swap em disco está desligado. `earlyoom` (`Nice=-20`) mata processo antes de travar o kernel. `GRUB_RECORDFAIL_TIMEOUT=2`.
- **GPU:** NVIDIA GeForce GTX 980 Ti, 6 GB, compute 5.2, driver 580.178.04. Maxwell. Confira com `nvidia-smi`.
- **Blender:** 4.2.7 LTS em `/usr/local/bin/blender`. Headless: `ssh paulo@100.122.231.113 'blender -b -P script.py'`. MCP no repo `/home/paulo/blender-mcp`. Cycles em CUDA. OptiX não existe nesta placa.
- **Penpot:** no ar, com MCP (`penpot-penpot-mcp-1`). O stack ocioso passa de 1,5 GB; o backend sozinho ficou em cerca de 1,1 GB. MCP só no projeto com UI: ensaio-ia e imobiflow-crm. No AfonsoV2 o Penpot entra só se a issue for o WebAdmin (Blazor). Fora isso, não ligue.
- **SonarQube:** cerca de 1,0 GB, teto 1,5 GB. Antes de Blender ou de LLM, a sugestão é parar o Sonar e o stack do Penpot. Hub de produção e o Postgres de mensageria ficam de pé.
- **NVENC:** `/usr/bin/ffmpeg`. H.264 e HEVC em `yuv420p` passaram. HEVC em `yuv444p` a placa recusa. AV1 responde `Codec not supported`. Decode `h264_cuvid` passou em H.264 `yuv420p` e falhou em H.264 4:4:4 com `CUDA_ERROR_NOT_SUPPORTED`.

Um serviço pesado por vez. Penpot, render do Blender e LLM local disputam os mesmos 7,7 GB. O `earlyoom` escolhe a vítima. Não ofereça Penpot e Blender na mesma issue.

## Discos e backup

Dois discos, papéis diferentes:

| Disco | Onde | Sistema | Livre na leitura | Uso |
|---|---|---|---|---|
| Sistema (`sda`, LVM) | `/` e `/srv/nas` | ext4 | ~370 GB | Sistema, containers, **cópia de banco** |
| 1 TB (`sdb`, ST1000LM035) | `/mnt/hd2` | exFAT | ~469 GB | Já tem mídia. Volume grande, não cópia única de banco |

`/srv/nas/backups/` já existe no ext4, com `dumps_bancos/`, `fotos/` e `documentos/`. A biblioteca de jogos fica em `/srv/nas/jogos/` e também no `/mnt/hd2`. Backup não entra em pasta de jogo.

Padrão, para qualquer projeto com banco ou volume Docker:

1. Banco SQLite: `sqlite3 arquivo.db ".backup 'destino'"` . Cópia de arquivo com o banco aberto não é backup.
2. Postgres: `pg_dump` do container, arquivo no ext4.
3. Destino da cópia que precisa voltar inteira: `/srv/nas/backups/dumps_bancos/<projeto>/<YYYYMMDD_HHMMSS>/`.
4. Imagem Docker e asset grande, depois de um "sim": `/mnt/hd2/backups/<projeto>/`. O exFAT não guarda dono nem permissão e remonta só leitura se der erro. Não é o único lugar da cópia.
5. Retenção sugerida, ainda sem cron: 7 dias diários e 4 semanais no ext4. Apagar dump antigo também é mudança de estado: peça o "sim".

Exemplo que já vale para o Hub Afiliado, no PC:

- Produção: `/home/paulo/autoafiliado-data/catalogo.db` e `/home/paulo/autoafiliado-data/tenants/*/hubafiliado.db`
- QA: volume Docker `hubafiliado-qa_dados_qa`
- Destino: `/srv/nas/backups/dumps_bancos/`

Penpot entra na mesma regra: `pg_dump` do container `penpot-penpot-postgres-1` e os assets no ext4. Confirme o nome do database na hora. O outro Postgres de mensageria também entra, depois de confirmar o nome do database. O volume não mora só no exFAT. ensaio-ia usa Supabase: backup local de SQLite não cobre. imobiflow não tem volume neste PC.

## GPU sob demanda

Nada fica residente. Sobe, gera, encerra o processo. `ollama` não estava instalado na leitura, e o binário oficial pede AVX: nesta CPU ele não é o caminho.

A 980 Ti é Maxwell (sm_52) com 6 GB. Toolkit e runtime novos abandonam essa arquitetura. O apt não tem `cuda-toolkit-12-4`. O que está instalado é o nvcc 12.6 em `/usr/local/cuda-12.6/bin/nvcc`, fora do PATH, e o driver continua 580. O runfile 12.4.1 traz o driver 550: não executar. Antes de trocar uma API paga, o agente `infra` confirma com um hello-world na GPU. Texto na CPU, neste i7 sem AVX, é o último recurso e disputa a mesma RAM do Penpot.

- **Texto (AfonsoV2):** o seletor usa só o primeiro provedor configurado. A ordem é local, Groq, Gemini, OpenRouter, OpenAI, Anthropic. Com `LlmLocalEndpoint` e modelo gravados, o processo caído não cai no Groq. Grave o endpoint no job que acabou de subir e apague ao terminar. Cabe um 3B Q4 (cerca de 2 GB) para copy curta, com contexto pequeno. 7B só com Sonar e Penpot parados. Roteiro, texto que vai publicado e qualquer coisa com Penpot, Blender ou Sonar no ar continuam na API paga.
- **Voz:** o Afonso já chama Kokoro em `http://localhost:8880` e, se falhar, cai no ElevenLabs. Não há container Kokoro neste PC, e a imagem usual pede AVX. Piper não está ligado no código. Narração publicada continua no ElevenLabs.

## O que levantar numa issue

No plano, no máximo três frases, cada uma com projeto, máquina e o porquê. Sugestão, não tarefa. Sem o "sim", ninguém executa.

| Se a issue mexe com | Ofereça |
|---|---|
| Banco, volume Docker, mídia que custa regerar | Backup no ext4 do PC, no padrão acima |
| Texto pago por API no Afonso | LLM 3B no PC, sobe e fecha. Não deixe `LlmLocalEndpoint` gravado com o processo fora do ar |
| Áudio do Afonso | Kokoro em `:8880` se o binário arrancar sem AVX. ElevenLabs segue para o que vai publicado. Não troque no mesmo PR |
| Tela, funil, landing, estado vazio/erro/loading | Penpot, já no ar. O código e o guia HTML continuam a fonte da verdade |
| WebAdmin do Afonso | Penpot, só nessa issue. Bot, Telegram, copy e backup ficam de fora |
| Asset 3D, glTF, render | Blender headless no PC, com Sonar e Penpot parados |
| Vídeo curto | `h264_nvenc` ou `hevc_nvenc` em `yuv420p`. Sem `yuv444p` e sem AV1 |
| Projeto sem UI | Nada de Penpot nem de MCP visual |

ensaio-ia e imobiflow-crm têm UI. O AfonsoV2 tem WebAdmin em Blazor; o resto do produto não é tela. O Orange Pi não entra nessa lista, salvo a issue ser o redirect ou o cabo.

## Ordem que vale a pena

Cruzamento de 2026-10-28: o que já existe no código, o que a placa provou, e o que a RAM deixa de pé. Não invente ferramenta fora desta lista.

1. **Penpot no ensaio-ia.** Stack e MCP já estão no ar. Piloto é landing e funil (preço, checkout). O `globals.css` e o `TEMAS` continuam a fonte. imobiflow vem depois, se o piloto render. WebAdmin do Afonso só se a issue for essa tela.
2. **Backup no ext4**, quando a issue mexer em banco ou volume. Não é ferramenta nova: é o padrão da seção de discos. O exFAT não é a cópia única.
3. **NVENC no render do Afonso.** `RenderizadorFfmpegDeAvatar` grava com `libx264` no i7 sem AVX, em 1080×1920 e `yuv420p`. A placa já codifica H.264 e HEVC nesse formato. A troca é um argumento do ffmpeg, não um serviço. O teste do Afonso que exige `libx264` não muda de codec no CI do laptop.
4. **Kokoro sob demanda**, porque o Afonso já cai no ElevenLabs se o `:8880` falhar. Ainda não há container. O binário tem de arrancar sem AVX. Narração que vai publicada continua no ElevenLabs.
5. **LLM 3B sob demanda**, só depois de um hello-world na GPU. Não há llama.cpp nem Ollama instalados. O exemplo `llama3.1:8b` do catálogo de credenciais não cabe aqui. Sem endpoint gravado com o processo fora do ar.

Blender fica para issue de asset 3D, com Sonar e Penpot parados. Fora desta lista: modelo residente, vLLM, AV1, Whisper, Piper como substituto do Kokoro, Paper junto com Penpot, e qualquer coisa no Orange Pi que não seja o cabo ou o redirect.

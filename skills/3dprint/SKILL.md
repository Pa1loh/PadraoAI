---
name: 3dprint
description: >
  Assistente especializado em impressão 3D com OrcaSlicer, Creality Ender 3 V3 KE e filamentos PETG/PLA.
  Use quando o usuário mencionar: OrcaSlicer, impressora 3D, Ender 3, PETG, PLA, filamento, entupimento,
  clog, calibração, flow rate, pressure advance, temperatura de impressão, mesa aquecida, brim, suporte,
  retração, underextrusion, stringing, primeira camada, slicer, fatiador, perfil de impressão.
---

# 3D Print Skill

Assistente especializado para impressão 3D com o setup do Paulo:
- **Impressora:** Creality Ender 3 V3 KE (direct drive, hotend all-metal, max 300°C)
- **Filamento:** Voolt PETG (230–245°C, mesa 75–85°C)
- **Slicer:** OrcaSlicer
- **Contexto completo:** `/home/paulo/3D/README.md`

Sempre leia `/home/paulo/3D/README.md` para contexto atualizado antes de responder.

---

## Comandos Disponíveis

### `/3dprint diagnose` — Diagnosticar Problema

**Quando usar:** Underextrusion, clog, stringing excessivo, primeira camada ruim, peça soltando da mesa, layer shifting, etc.

**Protocolo:**
1. Ler `/home/paulo/3D/README.md` para ver histórico de incidentes
2. Solicitar: foto/vídeo da impressão, filamento usado, temp configurada, quanto tempo de impressão
3. Analisar sintomas seguindo a árvore de diagnóstico abaixo
4. Propor solução passo a passo
5. Atualizar `/home/paulo/3D/README.md` com o incidente e solução

**Árvore de Diagnóstico PETG:**

```
Filamento não sai?
├── Saiu pouco e parou → Heat creep ou clog parcial
│   ├── Fix: Cold pull (230°C → empurrar → resfriar 90°C → puxar)
│   └── Fix: Aumentar temp para 250°C e forçar extrusão
├── Nunca saiu → Clog completo ou extrusora pulando
│   ├── Ver se extrusora está clicando → back-pressure alta
│   ├── Fix: Desmontar e limpar bico a 260°C
│   └── Fix: Atomic pull agressivo
└── Filamento está quebrando na extrusora → umidade no filamento
    └── Fix: Secar filamento 60°C por 4-6h

Primeira camada ruim?
├── Muito fina/raspando → Z offset muito baixo → subir Z
├── Não gruda → Z offset muito alto ou mesa fria → baixar Z ou aumentar temp mesa
├── Bolhas/crackling → filamento úmido → secar
└── Não gruda mesmo colando → limpar mesa com IPA + aumentar brim

Stringing excessivo?
├── Aumentar retração (máx 2mm direct drive)
├── Aumentar temp (PETG flui melhor = menos stringing)
├── Habilitar wipe on retract no OrcaSlicer
└── Calibrar Pressure Advance

Underextrusion nas camadas?
├── Flow rate baixo → calibrar com cubo de fluxo
├── Temp baixa → aumentar para 240-245°C
├── Velocidade alta → reduzir para 60mm/s
└── Pressure Advance mal calibrado → recalibrar
```

---

### `/3dprint config` — Gerenciar Configurações

**Quando usar:** Adicionar novo perfil, mudar configuração, calibrar parâmetro, otimizar para nova peça/filamento.

**Protocolo:**
1. Ler config atual em `/home/paulo/3D/README.md`
2. Identificar o parâmetro a mudar e o motivo
3. Propor o novo valor com justificativa técnica
4. Confirmar com o usuário antes de documentar
5. Atualizar `/home/paulo/3D/README.md` com a mudança e o **porquê**

**Parâmetros Chave OrcaSlicer para PETG:**

| Parâmetro | Valor Base | Range | Motivo |
|-----------|-----------|-------|--------|
| Temp bico | 240°C | 230–250°C | PETG precisa de mais calor que PLA |
| Temp mesa | 80°C | 70–85°C | Adesão sem warping |
| Fan (max) | 50% | 20–60% | PETG cristaliza melhor com menos cooling |
| Retração | 1.5mm | 1–2mm | Direct drive: menos retração que bowden |
| Flow rate | 100% | 95–105% | Calibrar com cubo |
| Pressure Adv. | 0.05 | 0.02–0.1 | Calibrar com torre PA |
| Velocidade | 60mm/s | 40–80mm/s | PETG não gosta de velocidade alta |
| 1ª camada | 25mm/s | 20–30mm/s | Adesão melhor devagar |

---

### `/3dprint calibrate` — Calibração

**Sequência recomendada de calibração (nova impressora ou após troca de bico):**

1. **PID Tuning** — estabilizar temperatura do bico
   ```gcode
   M303 E0 S240 C8  ; calibrar PID a 240°C, 8 ciclos
   ```

2. **E-steps** — quantos mm o extrusor puxa por step
   - Marcar 100mm no filamento
   - Extrudir 100mm via terminal
   - Medir o quanto realmente saiu
   - Ajustar: `novo_e_steps = e_steps_atual × (100 / real_extrudido)`

3. **Flow Rate** — imprimir cubo de parede única, medir com paquímetro
   - `flow_correto = (espessura_bico / espessura_medida) × flow_atual`

4. **Pressure Advance** — imprimir torre PA do OrcaSlicer
   - Calibration → Pressure Advance → gerar G-code
   - Escolher a linha mais uniforme

5. **First Layer / Z Offset** — papel A4 entre bico e mesa
   - Sentir resistência leve = correto

---

### `/3dprint new-piece` — Planejar Nova Peça

**Quando usar:** Antes de imprimir uma peça nova, especialmente complexa.

**Checklist:**
- [ ] Verificar orientação ótima (mínimo de suporte)
- [ ] Definir se precisa de suporte (onde e qual tipo)
- [ ] Brim ou raft? (PETG = sempre brim pelo menos)
- [ ] Checar se precisa de múltiplos materiais/cores (multicolor = pausas de filamento)
- [ ] Estimar tempo e consumo
- [ ] Verificar que filamento não está úmido
- [ ] Fazer purge line antes de iniciar

---

## Manutenção Preventiva

**A cada 200h de impressão:**
- Verificar aperto dos parafusos das correias
- Lubrificar trilhos com grease PTFE
- Verificar desgaste do bico (substituir se >300h)
- Limpar mesa com IPA

**Sinais de bico gasto:**
- Underextrusion progressiva mesmo com config correta
- Stringing aumentando sem mudança de configuração
- Superfície da peça irregular

**Secar filamento (quando necessário):**
- PETG: 60–65°C por 4–6h (forno, desidratador ou Polymaker PolyDryer)
- Sinais de umidade: crackling/estalo durante impressão, bolhas na superfície, vapor visível no bico

---

## Estrutura de Arquivos

```
/home/paulo/3D/
├── README.md              # Contexto geral, config atual, histórico de incidentes
├── perfis/                # Backups de perfis OrcaSlicer
│   └── ender3ke_petg_v1.json
└── pecas/                 # STLs e notas de peças impressas
    └── porta-escova/
```

## Quando Atualizar README.md

Sempre atualizar `/home/paulo/3D/README.md` quando:
- Mudar qualquer configuração (e o motivo)
- Ter um incidente (diagnóstico + solução)
- Imprimir uma peça com sucesso (adicionar na tabela)
- Fazer manutenção na impressora

## Origem

Skill global do Claude Code.
Fonte: `~/.claude/skills/3dprint/SKILL.md`

---
name: unity-gamedev
description: Assistente especializado em desenvolvimento de jogos com Unity 6, Netcode for GameObjects (NGO), URP, Steamworks, shaders retrô/pixelados, física, otimização de performance e automação de builds. Use quando o usuário mencionar: Unity, Unity 6, Netcode, NGO, multiplayer Unity, Steamworks, shaders URP, Lethal Company, low-poly, física de jogos, CharacterController, builds Unity, c# game development, cenas Unity, GameObjects, prefabs.
---

# Unity Game Development & Networking Skill

Guia definitivo de boas práticas, padrões arquiteturais e resolução de problemas para projetos modernos em **Unity 6**, **Universal Render Pipeline (URP)**, **Netcode for GameObjects (NGO)** e **Steamworks Multiplayer**.

---

## 1. Arquitetura Multiplayer (Unity Netcode for GameObjects - NGO)

### Ciclo de Vida do `NetworkBehaviour`
- Use sempre `OnNetworkSpawn()` em vez de `Start()` para inicializar lógica que depende de autoridade ou rede:
  ```csharp
  public override void OnNetworkSpawn()
  {
      base.OnNetworkSpawn();
      if (IsOwner)
      {
          // Inicializa câmera local, áudio e controles do jogador local
      }
      else
      {
          // Desativa câmeras e componentes locais de outros jogadores
      }
  }
  ```

### RPCs & Sincronização
- **`[ServerRpc]`**: Enviado pelo cliente para o servidor executar uma ação autoritativa (ex: arar terra, disparar arma, coletar item).
  - Use `RequireOwnership = false` quando qualquer cliente conectado puder solicitar a ação no objeto.
- **`[ClientRpc]`**: Enviado pelo servidor para todos os clientes conectados atualizarem seus estados visuais ou eventos de gameplay.
- **`NetworkVariable<T>`**: Sincronização automática de variáveis (ex: Vida, Cor, Ferramenta ativa).
  - Permissões: `NetworkVariableReadPermission.Everyone`, `NetworkVariableWritePermission.Server` (ou `Owner`).

---

## 2. Integração com Steamworks (Steam Lobbies & Relay P2P)

### AppID 480 (Spacewar)
- Use sempre `steam_appid.txt` contendo `480` na raiz do projeto e na pasta ao lado do executável da Build.
- Permite testar lobbies, convites de amigos (`Shift + Tab`) e conexões P2P através do Steam Relay da Valve sem portas abertas no roteador.

### Padrão de Inicialização
```csharp
if (SteamAPI.Init())
{
    // Registra callbacks de criação e entrada em lobbies
}
```

---

## 3. Estética Retrô & Shaders (Estilo Lethal Company / PS1)

### Pipeline de Pixelização em Baixa Resolução
- Renderize a câmera principal para uma `RenderTexture` de baixa resolução (ex: 320x180 ou 240x135).
- Amostragem com `FilterMode.Point` para garantir pixels nítidos e "quadriculados" sem borrado bilinear.
- No URP, utilize um `ScriptableRendererFeature` ou blit OnGUI com Point filtering.

### Iluminação & Atmosfera
- Névoa exponencial volumétrica: `RenderSettings.fog = true; RenderSettings.fogMode = FogMode.ExponentialSquared;`
- Flat shading / Low-poly: sem suavização de normais para realçar as facetas geométricas dos modelos 3D.

---

## 4. Input System & Character Controller

- Utilize o `CharacterController` para movimentação precisa de personagens em 1ª pessoa sem interferência de torque de RigidBody.
- Movimentação horizontal desacoplada da vertical (gravidade):
  ```csharp
  controller.Move(direction * speed * Time.deltaTime);
  velocity.y += Physics.gravity.y * Time.deltaTime;
  controller.Move(velocity * Time.deltaTime);
  ```

---

## 5. Automação de Builds (CLI & Scripts)

### Compilação Sem Interface (Batchmode)
Para compilar builds sem abrir o Unity Editor manualmente:
```bash
~/Unity/Hub/Editor/<VERSAO>/Editor/Unity -batchmode -quit -projectPath "<CAMINHO_DO_PROJETO>" -executeMethod FarmRoguelike.Editor.BuildScript.BuildWindowsGame -logFile build.log
```

---

## 6. Solução de Problemas Comuns

- **Cena vazia ("Untitled") ao abrir o Unity**: Unity inicia por padrão em cena temporária. Abra explicitamente a cena em `Assets/Scenes/MainScene.unity`.
- **Erro CS0619 (Obsolete em Unity 6)**: Funções legadas como `GetInstanceID()` foram atualizadas para `GetEntityId()`. Verifique se os pacotes do UPM estão na versão LTS compatível com Unity 6.
- **SteamAPI.Init() falhando**: Certifique-se de que o aplicativo cliente da Steam está aberto e logado na máquina antes de iniciar o jogo ou o Editor.

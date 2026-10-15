---
name: release
description: Cortar release com versão do changelog e tag só com CI verde. Use para "release", "publicar versão", "tag", "subir para produção".
---

# Release

1. Árvore limpa, branch certa, `git fetch`. Listar commits desde a última tag.
2. Classificar: breaking → major; feature → minor; fix/chore → patch. Propor a versão e atualizar o CHANGELOG.
3. **CI verde no SHA exato** que vai ser tagueado (`gh run list --commit <sha>`). Vermelho ou pendente → parar.
4. Suíte completa (unit + integração + E2E) verde, saída colada.
5. Tag e push só com confirmação do usuário. Nunca reescrever tag publicada.
6. Pós-deploy: healthcheck e logs de erro. Falhou → rollback e issue.

# 📝 Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [2.0.0] - 2026-08-14

### Adicionado
- Implementação da ferramenta `generate_orgchart` com validação de hierarquia e detecção de ciclos por DFS.
- Servidor Express embutido com suporte a Server-Sent Events (`/events`) e API REST (`/api/diagrams`) na porta 3001.
- Contrato padronizado `meta.json` gerado automaticamente para cada diagrama.
- Aplicação frontend em Vite + Alpine.js com navegação em 4 abas, busca instantânea e miniaturas.
- Motor de estilização em 3 camadas com 4 temas visuais: Educacional, Corporativo, Minimalista e Dark Mode.
- Pós-processador DOM de SVG para nós C4 e filtros de sombra suave.
- Utilitário client-side para exportação de PNG (2x retina canvas) e SVG.
- Quadro `KANBAN.md`, documentação `docs/API.md` e suíte de testes `test-v2.ts`.

### Modificado
- Refatoração das ferramentas `generate_mindmap`, `generate_architecture_diagram` e `generate_flowchart` para emitir metadados e notificar o hub SSE.
- Atualização do `server.ts` para integrar todas as 4 ferramentas e inicializar a API em background.

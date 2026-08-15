# 📝 Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [3.0.0] - 2026-08-15

### Adicionado
- **Motor Universal de Análise Léxica de AST (`src/engine/`)**:
  - `ast-parser-ts.ts`: Extração ultra-rápida de classes, interfaces, métodos, rotas Express/Nest/Fastify e chamadas cruzadas em TypeScript/JavaScript sem dependências externas.
  - `ast-parser-lexical.ts`: Parser léxico universal para Python, Go, Java, Kotlin, Rust, PHP e C#, com mapeamento de imports, structs, decorators e chamadas de métodos.
  - `universal-scanner.ts`: Varredura recursiva de diretórios com filtro de `.gitignore`, detecção automática de frameworks e resolução determinística de chamadas entre módulos.
  - `trace-parser.ts`: Parser polimórfico de logs (JSON estruturado, OpenTelemetry spans, texto de logs e stack traces) com transpilação para Mermaid `sequenceDiagram`.
- **4 Novas Ferramentas MCP**:
  - `scan_codebase_topology`: Mapeamento de repositórios em C4 com subgrafos e camadas semânticas (`view_mode: 'hybrid' | 'layered' | 'folders'`).
  - `trace_call_graph`: Rastreamento bidirecional widescreen (`LR`) de chamadas de funções/símbolos com agrupamento por arquivos de origem.
  - `trace_execution_flow`: Ingestão de traces e geração de diagramas de sequência com atores, participantes e blocos `alt/else` de erro.
  - `analyze_codebase_overview`: Raio-X completo 360 com mapa mental modular, topologia e relatório de métricas.
- **Endpoints REST HTTP (`src/utils/sse.ts`)**:
  - `POST /api/ingest/trace`: Ingestão de logs/traces via HTTP.
  - `POST /api/codebase/scan`: Varredura remota de diretórios.
  - `POST /api/codebase/trace-call`: Rastreamento de chamadas via HTTP.
- **Aba "Codebase Explorer" no Web Studio**:
  - Painel interativo para disparo de varreduras de topologia e rastreamento de símbolos diretamente pela interface web.
- **Suíte de Testes TDD v3.0 (`tests/tdd-v3.test.ts`)**:
  - Cobertura de parsers, scanner universal, resolução de chamadas cruzadas e execução das 4 novas ferramentas MCP com 100% de aprovação.

## [2.5.0] - 2026-08-15

### Adicionado
- **Formas Semânticas Nativas do Mermaid**: Cilindros `[("...")]` para bancos e storage, subprocessos/filas `[["..."]]`, documentos `[\"..."\]`, losangos `{"..."}` para decisões e pílulas `(["..."])` para início/fim e atores.
- **Otimização Inteligente de Direção**: Detecção automática de direção `LR` (horizontal widescreen 16:9) para pipelines sequenciais lineares e preservação de `TD` para fluxos de decisão ramificados e organogramas.
- **Âncoras Visuais Padronizadas**: Prefixação inteligente de ícones semânticos (👤, 🤖, 📦, 💾, 📬, 🚀, 🏁, ❓, 🛡️, 🌐) com prevenção contra emojis duplicados.
- **Diferenciação de Conexões**: Linhas sólidas (`-->`) para chamadas síncronas e linhas tracejadas (`-.->`) para mensageria assíncrona, filas e streaming Server-Sent Events.
- **Design System de Classes CSS**: Bloco `classDef` padronizado com bordas arredondadas suaves (`rx:8px, ry:8px`) e paleta de cores harmoniosa em conformidade com o Web Studio.
- **Agrupamento Automático e Explícito por Subgrafos**: Suporte a `subgraph sg_N[" Nome "] ... end` via propriedade `group` nos geradores de arquitetura e fluxogramas.
- **Modo Flowchart para Arquitetura**: Parâmetro `notation: 'flowchart'` na ferramenta de arquitetura para renderização nítida e responsiva no GitHub.

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

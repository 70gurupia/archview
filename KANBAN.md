# 📋 Quadro Kanban: MCP Visual Server (ArchView) v5.0

> WIP Limit: 1 tarefa ativa por vez.

---

## 📥 Backlog

*(Todas as tarefas planejadas para as Fases 1.0, 2.0, 2.5, 3.0, 4.0 e 5.0 foram concluídas com 100% de sucesso)*

---

## ⏳ Em Progresso (WIP: 0/1)

---

## ✅ Concluído (Done)

- [x] **TASK-039 (v5.0)**: Validação pelos 13 gates, testes TDD da v5.0 (`tests/tdd-html-generator-v5.test.ts`), regeneração de self-docs com HTML e sincronização no GitHub.
- [x] **TASK-038 (v5.0)**: Adição de botões de download de HTML individual e Dashboard consolidado no Web Studio SPA (`frontend/`).
- [x] **TASK-037 (v5.0)**: Criação de endpoints HTTP REST `GET /api/diagrams/:id/html` e `GET /api/export/dashboard-html` no Express (`src/utils/sse.ts`).
- [x] **TASK-036 (v5.0)**: Implementação da 11ª ferramenta MCP `export_html_report` (`src/tools/export-html.ts`) com modos `single` e `dashboard`.
- [x] **TASK-035 (v5.0)**: Implementação do motor de geração de HTML standalone e Dashboard executivo consolidado com Pan/Zoom e 4 temas (`src/engine/html-generator.ts`).

- [x] **TASK-034 (v4.0)**: Criação da suíte de testes TDD da v4.0 (`tests/tdd-observability-v4.test.ts`), compilação TypeScript/Vite e passagem de todos os 13 gates.
- [x] **TASK-033 (v4.0)**: Construção da aba "Observability Hub" no Web Studio com cards de saúde, métricas de memória, ingestão de traces e amostra Prometheus.
- [x] **TASK-032 (v4.0)**: Registro da 10ª ferramenta `get_system_observability` no MCP Server dispatcher e schemas Zod.
- [x] **TASK-031 (v4.0)**: Implementação da 10ª ferramenta MCP `get_system_observability` com suporte a gráficos Mermaid (`xychart-beta` e `quadrantChart`).
- [x] **TASK-030 (v4.0)**: Atualização do Express com endpoint `GET /metrics`, middleware de medição HTTP e health checks enriquecidos no `/api/health`.
- [x] **TASK-029 (v4.0)**: Implementação do módulo resiliente do OpenTelemetry SDK com exportador OTLP opcional (`src/utils/otel.ts`).
- [x] **TASK-028 (v4.0)**: Implementação do registro Prometheus e métricas customizadas do ArchView (`src/utils/metrics.ts`).
- [x] **TASK-027 (v4.0)**: Pinning e instalação de dependências de observabilidade (`prom-client`, `@opentelemetry/api`, `@opentelemetry/sdk-node`).

- [x] **TASK-026 (v3.0)**: Criação da aba "Codebase Explorer" no Web Studio, integração com endpoints REST e validação completa dos 13 gates.
- [x] **TASK-025 (v3.0)**: Implementação da tool `analyze_codebase_overview` (Raio-X completo 360 do repositório com mapa mental, topologia e métricas).
- [x] **TASK-024 (v3.0)**: Implementação da tool `trace_execution_flow` (Diagramas de sequência a partir de logs/traces com blocos alt/else).
- [x] **TASK-023 (v3.0)**: Ingestão de traces/logs via HTTP e criação do endpoint `POST /api/ingest/trace` na porta 3001.
- [x] **TASK-022 (v3.0)**: Implementação do mapeamento bidirecional de dependências e da tool `trace_call_graph`.
- [x] **TASK-021 (v3.0)**: Implementação da tool MCP `scan_codebase_topology` (Topologia C4 com subgrafos e camadas semânticas).
- [x] **TASK-020 (v3.0)**: Desenvolvimento do motor universal de análise de diretórios, frameworks e AST léxica (`src/engine/`).

- [x] **TASK-019 (v2.5)**: Implementação de agrupamento automático e explícito por subgrafos nomeados (`subgraph [Nome] ... end`) nos geradores de arquitetura e fluxograma.
- [x] **TASK-018 (v2.5)**: Aplicação de classes de design system com bordas curvas (`rx:8px, ry:8px`) e paleta de cores semântica harmonizada (Azul Safira, Verde-Petróleo, Índigo e Âmbar).
- [x] **TASK-017 (v2.5)**: Diferenciação de tipos de conexão (sólidas `-->` para chamadas síncronas e tracejadas `-.->` para eventos assíncronos/filas).
- [x] **TASK-016 (v2.5)**: Padronização de âncoras visuais com ícones semânticos (🤖 IA, 👤 Usuário, ⚙️ Core, 📡 SSE, 💾 Disco, 🎨 UI, 🛡️ Segurança).
- [x] **TASK-015 (v2.5)**: Otimização inteligente de direção (`LR` horizontal widescreen para pipelines lineares e `TD` para fluxos de decisão/árvores).
- [x] **TASK-014 (v2.5)**: Integração de formas semânticas nativas do Mermaid (cilindros `[(...)]`, losangos `{"..."}`, pílulas `([...])`, subprocessos `[[...]]` e documentos `[\...\]`) em fluxogramas e arquitetura.

- [x] **TASK-001**: Leitura e diagnóstico técnico completo do documento de requisitos (`Prompt MCP Ferramentas Gratuitas.docx`).
- [x] **TASK-002**: Realização do alinhamento técnico `/grill-me` com definição de 5 decisões arquiteturais.
- [x] **TASK-003**: Implementação da ferramenta `generate_orgchart` com algoritmo DFS para detecção de ciclos hierárquicos e estilização por níveis.
- [x] **TASK-004**: Criação do padrão de manifesto de metadados `.meta.json` com telemetria e sanitização anti-path traversal.
- [x] **TASK-005**: Refatoração das ferramentas existentes (`mindmap`, `architecture`, `flowchart`, `export`) para emissão de `.meta.json`.
- [x] **TASK-006**: Implementação do servidor Express integrado com streaming Server-Sent Events (SSE) `/events` e API REST `/api/diagrams`.
- [x] **TASK-007**: Construção do frontend SPA reativo em Vite + Alpine.js com 4 abas, 4 temas e controles de zoom/pan.
- [x] **TASK-008**: Criação do pipeline de estilização em 3 camadas e pós-processamento SVG no DOM.
- [x] **TASK-009**: Implementação e execução da suíte de testes unitários (TDD) com 100% de aprovação.
- [x] **TASK-010**: Implementação e execução da suíte de observabilidade (ODD) com validação de telemetria e integridade da API REST.
- [x] **TASK-011**: Implementação e execução da suíte de Pentest de segurança (8 vetores OWASP) com bloqueio anti-traversal e anti-injeção.
- [x] **TASK-012**: Geração dos 4 diagramas visuais do próprio projeto (Dogfooding) integrados à documentação (`README.md` e `docs/ARCHITECTURE.md`).
- [x] **TASK-013**: Sincronização, commit semântico e `git push` para o repositório remoto GitHub (`origin main`).

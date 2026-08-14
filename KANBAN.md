# 📋 Quadro Kanban: MCP Visual Server & Frontend Engine v2.0

> WIP Limit: 1 (Foco em entrega contínua com validação de gates)

---

## 🟢 Concluído (Done)

- [x] **TASK-001 (Spike #0):** Validação técnica das 3 camadas de estilização (themeVariables + CSS Variables + SVG DOM Post-Processor).
- [x] **TASK-002 (Contrato de Metadados):** Criação da especificação e gerador de `meta.json` com nomenclatura híbrida (`slug-shortid`).
- [x] **TASK-003 (Backend MCP - Tool OrgChart):** Implementação de `generate_orgchart` com validação de hierarquia, detecção de ciclos por DFS e estilização por níveis.
- [x] **TASK-004 (Backend MCP - Refatoração das Tools):** Atualização de `generate_mindmap`, `generate_architecture_diagram`, `generate_flowchart` e `export_diagram` com suporte ao manifesto de metadados.
- [x] **TASK-005 (Servidor SSE & REST):** Implementação de servidor Express embutido na porta 3001 com endpoints `/events` (SSE em tempo real) e `/api/diagrams`.
- [x] **TASK-006 (Frontend - Estrutura e Temas):** Setup Vite + Alpine.js com motor de 4 temas (Educacional, Corporativo, Minimalista e Dark Mode).
- [x] **TASK-007 (Frontend - Pós-Processamento e Exportação):** Implementação do pós-processador DOM SVG e exportador client-side PNG (2x retina) / SVG.
- [x] **TASK-008 (Frontend - Interface Reativa):** Navegação por 4 abas, busca instantânea, miniaturas de cards, modal de visualização e controles de zoom/pan.
- [x] **TASK-009 (Testes e Documentação):** Suíte de testes `test-v2.ts` automatizada, `README.md` e `docs/API.md`.

---

## 🟡 Em Progresso (WIP: 0)

*Nenhuma tarefa em andamento no momento (todas as tarefas do MVP concluídas).*

---

## 🔵 Próximo na Fila (Backlog - Fase 2 e 3)

1. **TASK-010 (Fase 2):** Implementar ferramenta MCP `apply_style_system` para re-estilizar diagramas existentes programaticamente.
2. **TASK-011 (Fase 2):** Adicionar filtros avançados no dashboard (por data, quantidade de nós e tags).
3. **TASK-012 (Fase 3):** Implementar ferramenta `generate_dependency_graph` com parser AST para análise estática de código TypeScript/Python.
4. **TASK-013 (Fase 3):** Adicionar ferramenta `generate_infographic` com layout Bento Grid.
5. **TASK-014 (Fase 3):** Exportação multi-página para PDF e PPTX.

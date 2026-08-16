# 📋 ArchView v6.0 Kanban Board (Fusão kg-infra)

> **Status:** Todas as tarefas da fusão v6.0 foram concluídas com 100% de aprovação nos testes TDD, ODD, SAST, Pentest e Quality Gates.

---

## 🚀 Fila de Execução

### 📥 A Fazer (Backlog)
*(Vazio - Todas as etapas planejadas foram concluídas)*

---

### 🔄 Em Progresso (WIP: 0)
*(Nenhuma tarefa em andamento)*

---

### ✅ Concluído (Done)
- [x] **Task 0:** Planejamento arquitetural, definição do schema e criação das issues no repositório GitHub (#12 a #16).
- [x] **Task 1:** Motor SQLite & Schema Relacional Integrado (`src/kg/db.ts` + `schema.sql` + `better-sqlite3` + FTS5).
- [x] **Task 2:** Portar Algoritmos de Rede para TypeScript (`Louvain`, `PageRank`, `Betweenness`, `Blast Radius`, `What-If`, `Multi-Path` em `src/kg/algorithms.ts`).
- [x] **Task 3:** Implementar as Novas Ferramentas MCP de Knowledge Graph e Integrar com Scanner de Código e rotas REST (`/api/kg/*`).
- [x] **Task 4:** Desenvolver Studio Web Dual-Mode no Frontend (Abas Mermaid + Knowledge Graph Explorer com busca FTS5 e métricas PageRank).
- [x] **Task 5:** Suíte Completa de Testes TDD/ODD/Pentest com 9 vetores OWASP (incluindo SQLi) e compilação limpa do Vite e TypeScript.

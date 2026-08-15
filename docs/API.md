# Documentação da API MCP - ArchView v2.0

O ArchView expõe 5 ferramentas principais via Model Context Protocol.

## 1. `generate_mindmap`
Gera mapas mentais. Implementa guardrails rígidos de máximo de 50 nós e 5 níveis de profundidade.
- **Input (Zod)**
  - `central_topic` (string, max 100): Tópico central.
  - `branches` (Array, max 20): Lista de ramos. Cada ramo tem `title` e opcionalmente `sub_branches`.
- **Output:** Metadados, payload markdown e salva em `.mmd` no `output/`.

## 2. `generate_orgchart`
Gera organogramas com validação estrita anti-ciclos.
- **Input (Zod)**
  - `title` (string): Título do organograma.
  - `nodes` (Array, max 50): Lista de objetos contendo `id`, `label`, `role` e `reports_to`.

## 3. `generate_architecture_diagram`
Diagramas C4 Model.
- **Input (Zod)**
  - `c4_level` (enum): "C1-context", "C2-container", "C3-component".
  - `system_name` (string): Nome do sistema central.
  - `elements` (Array): Componentes e dependências (type person, container, database, etc).

## 4. `generate_flowchart`
Fluxos lógicos.
- **Input (Zod)**
  - `title` (string): Título.
  - `steps` (Array, max 50): Passos do fluxo e transições lógicas (`next`).

## 5. `export_diagram` (Backend Export Disabled)
- **Status:** **DESATIVADO NO BACKEND**.
- **Motivo:** Restrições extremas de Low-CPU da máquina hospedeira. O Node.js não invocará Puppeteer/mmdc.
- **Alternativa:** O usuário deve usar os botões nativos da UI Web (Client-side export para SVG, PNG, PNG 4K).

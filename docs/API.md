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
Diagramas de Arquitetura de Software (C4 Model ou Flowchart com Subgrafos).
- **Input (Zod)**
  - `c4_level` (enum): `"C1-context"`, `"C2-container"`, `"C3-component"`, `"C4-code"`.
  - `system_name` (string): Nome do sistema central.
  - `description` (string, opcional): Descrição textual.
  - `elements` (Array, max 50): Componentes do sistema.
    - `id` (string): Identificador único.
    - `type` (enum): `"person"`, `"system"`, `"container"`, `"component"`, `"database"`, `"queue"`, `"external"`.
    - `name` (string): Nome do elemento (ícones semânticos automáticos: 👤, 📦, 💾, 📬, 🌐).
    - `description` (string): Responsabilidade do componente.
    - `technology` (string, opcional): Stack tecnológica (ex: TypeScript, PostgreSQL, Express).
    - `group` (string, opcional): Nome do subgrafo para agrupamento visual em camadas.
    - `relationships` (Array, opcional): Relações síncronas (`-->`) ou assíncronas com filas/eventos (`-.->`).
  - `style` (objeto, opcional):
    - `notation` (enum): `"flowchart"` (recomendado para renderização limpa no GitHub) ou `"c4"`.
    - `direction` (enum): `"TB"`, `"LR"`, `"BT"`, `"RL"`.
    - `palette` (enum): `"educational"`, `"corporate"`, `"minimal"`, `"dark"`.

## 4. `generate_flowchart`
Fluxogramas lógicos, pipelines de validação e processos de negócio.
- **Input (Zod)**
  - `title` (string): Título do fluxograma.
  - `description` (string, opcional): Contexto e descrição.
  - `steps` (Array, max 50): Passos e nós do fluxo.
    - `id` (string): Identificador único.
    - `type` (enum): `"start"`, `"end"`, `"process"`, `"decision"`, `"input"`, `"output"`, `"subprocess"`, `"database"`, `"queue"`, `"document"`.
    - `label` (string): Rótulo do passo (ícones semânticos automáticos: 🚀, 🏁, ❓, 💾, 📬, 📄, ⚙️).
    - `group` (string, opcional): Subgrafo para agrupamento por fases ou módulos.
    - `next` (Array, opcional): IDs de destino ou objetos `{ id, label, style: "solid" | "dashed" }`.
  - `style` (objeto, opcional):
    - `direction` (enum): `"TB"`, `"LR"` (horizontal widescreen automático para pipelines lineares), `"BT"`, `"RL"`.
    - `palette` (enum): `"educational"`, `"corporate"`, `"minimal"`, `"dark"`.

## 5. `export_diagram` (Backend Export Disabled)
- **Status:** **DESATIVADO NO BACKEND**.
- **Motivo:** Restrições de Low-CPU da máquina hospedeira. O Node.js não invoca Puppeteer/mmdc.
- **Alternativa:** O usuário deve usar os botões nativos da UI Web (Client-side export para SVG, PNG, PNG 4K).

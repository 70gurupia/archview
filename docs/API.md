# Documentação da API MCP - ArchView v5.0 (11 Ferramentas Nativas)

O ArchView expõe 11 ferramentas principais via Model Context Protocol (stdio), além de endpoints REST para ingestão, observabilidade e entrega de HTML em tempo real.

---

## 1. `generate_mindmap`
Gera mapas mentais radiais com higienização de nós e guardrails de profundidade.
- **Input (Zod)**
  - `central_topic` (string, max 100): Tópico central.
  - `branches` (Array, max 20): Lista de ramos. Cada ramo tem `title`, `icons` e opcionalmente `sub_branches`.
  - `style` (objeto, opcional): `palette`, `layout`, `show_icons`.
- **Output:** Metadados (`.meta.json`), sintaxe Mermaid (`.mmd`), página HTML offline (`.html`) e retorno formatado.

---

## 2. `generate_orgchart`
Gera organogramas corporativos com validação estrita anti-ciclos e classes CSS hierárquicas.
- **Input (Zod)**
  - `title` (string): Título do organograma.
  - `nodes` (Array, max 50): Lista de objetos contendo `id`, `label`, `role` e `reports_to`.

---

## 3. `generate_architecture_diagram`
Diagramas de Arquitetura de Software (Modelo C4 Contexto C1 e Container C2 com subgrafos e ícones semânticos).
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

---

## 4. `generate_flowchart`
Fluxogramas lógicos, pipelines de validação e processos de negócio com formas inteligentes.
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

---

## 5. `scan_codebase_topology` (v3.0)
Varredura determinística de diretórios e geração de diagrama de topologia C4 com subgrafos e camadas de software em menos de 200ms.
- **Input (Zod)**
  - `path` (string, opcional): Caminho do diretório raiz do repositório (padrão: diretório atual).
  - `title` (string, opcional): Título do diagrama.
  - `view_mode` (enum, opcional): `"hybrid"` (pastas + camadas), `"layered"` (camadas puras) ou `"folders"` (árvore de pastas).
  - `direction` (enum, opcional): `"TD"` ou `"LR"`.
  - `max_depth` (number, opcional): Profundidade máxima de diretórios a varrer (padrão: 6).

---

## 6. `trace_call_graph` (v3.0)
Rastreamento bidirecional do grafo de chamadas de uma função, método ou classe com escopo de arquivo (inbound e outbound).
- **Input (Zod)**
  - `symbol_name` (string, obrigatório): Nome do símbolo a rastrear.
  - `path` (string, opcional): Caminho do repositório.
  - `file_path` (string, opcional): Arquivo específico de origem do símbolo.
  - `depth` (number, opcional): Profundidade da árvore de chamadas (1 a 4, padrão: 2).
  - `direction` (enum, opcional): `"LR"` (widescreen) ou `"TD"`.

---

## 7. `trace_execution_flow` (v3.0)
Ingestão polimórfica de logs e traces para geração de Diagrama de Sequência Mermaid com blocos de tratamento de erro alt/else.
- **Input (Zod)**
  - `title` (string, opcional): Título do fluxo.
  - `trace_data` (any, opcional): Array de spans JSON ou formato OpenTelemetry.
  - `raw_log` (string, opcional): Texto bruto de logs com padrões `ServiceA -> ServiceB: action` ou HTTP access logs.
  - `log_file_path` (string, opcional): Caminho de arquivo local (`.log`).

---

## 8. `analyze_codebase_overview` (v3.0)
Gera o Raio-X completo 360 do repositório, combinando mapa mental modular, diagrama C4 de topologia e relatório de métricas.
- **Input (Zod)**
  - `path` (string, opcional): Diretório do projeto.
  - `title` (string, opcional): Título da análise.

---

## 9. `get_system_observability` (v4.0)
Consulta métricas do Prometheus, estado de saúde do runtime, latência e estatísticas agregadas, com geração opcional de gráficos Mermaid (`xychart-beta` ou `quadrantChart`).
- **Input (Zod)**
  - `include_prometheus_raw` (boolean, opcional): Se true, inclui o texto bruto das métricas Prometheus.
  - `generate_chart` (enum, opcional): `"xychart"`, `"quadrant"` ou `"none"`.
  - `output_path` (string, opcional): Caminho seguro para gravação do arquivo `.mmd`, `.meta.json` e `.html`.

---

## 10. `export_diagram` (Client-Side)
- **Status:** Processamento delegado ao navegador cliente via botões na Web Studio (SVG, PNG HD e PNG 4K) para zero consumo de CPU no servidor.

---

## 11. `export_html_report` (v5.0)
Gera arquivo HTML autocontido e interativo de um diagrama específico ou um Dashboard consolidado com todos os diagramas do projeto (100% offline).
- **Input (Zod)**
  - `diagram_id` (string, opcional): ID ou slug do diagrama a exportar (ignorado se mode for dashboard).
  - `mode` (enum, opcional): `"single"` ou `"dashboard"`. Padrão: `"single"`.
  - `theme` (enum, opcional): `"educational"`, `"corporate"`, `"minimal"`, `"dark"`.
  - `output_path` (string, opcional): Caminho opcional do arquivo `.html` gerado na pasta `output/`.

---

## Endpoints HTTP REST e SSE

- `GET /metrics`: Scraping padrão texto do Prometheus.
- `GET /health`: Health check JSON com estado de degradação e uptime.
- `GET /events`: Stream de Server-Sent Events (SSE) para atualização em tempo real.
- `GET /api/diagrams`: Lista de diagramas persistidos com metadados.
- `GET /api/diagrams/:id`: Detalhes e código Mermaid de um diagrama.
- `GET /api/diagrams/:id/html`: Entrega o arquivo HTML standalone correspondente ao ID.
- `GET /api/export/dashboard-html`: Entrega o Dashboard executivo consolidado sob demanda.
- `GET /api/observability/stats`: Estatísticas consolidadas de CPU, Heap e latência.
- `POST /api/codebase/scan`: Disparo de varredura de topologia via REST.
- `POST /api/codebase/trace-call`: Rastreamento de chamadas via REST.
- `POST /api/ingest/trace`: Ingestão de traces/logs para diagramas de sequência.

# Documentação da API MCP - ArchView v3.0

O ArchView expõe 9 ferramentas principais via Model Context Protocol, além de endpoints REST para ingestão em tempo real.

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

## 5. `scan_codebase_topology` (v3.0)
Varredura determinística de diretórios e geração de diagrama de topologia C4 com subgrafos e camadas de software.
- **Input (Zod)**
  - `path` (string, opcional): Caminho do diretório raiz do repositório (padrão: diretório atual).
  - `title` (string, opcional): Título do diagrama.
  - `view_mode` (enum, opcional): `"hybrid"` (pastas + camadas), `"layered"` (camadas puras) ou `"folders"` (árvore de pastas).
  - `direction` (enum, opcional): `"TD"` ou `"LR"`.
  - `max_depth` (number, opcional): Profundidade máxima de diretórios a varrer (padrão: 6).

## 6. `trace_call_graph` (v3.0)
Rastreamento bidirecional do grafo de chamadas de uma função, método ou classe com escopo de arquivo.
- **Input (Zod)**
  - `symbol_name` (string, obrigatório): Nome do símbolo a rastrear.
  - `path` (string, opcional): Caminho do repositório.
  - `file_path` (string, opcional): Arquivo específico de origem do símbolo.
  - `depth` (number, opcional): Profundidade da árvore de chamadas (1 a 4, padrão: 2).
  - `direction` (enum, opcional): `"LR"` (widescreen) ou `"TD"`.

## 7. `trace_execution_flow` (v3.0)
Ingestão polimórfica de logs e traces para geração de Diagrama de Sequência Mermaid interativo.
- **Input (Zod)**
  - `title` (string, opcional): Título do fluxo.
  - `trace_data` (any, opcional): Array de spans JSON ou formato OpenTelemetry.
  - `raw_log` (string, opcional): Texto bruto de logs com padrões `ServiceA -> ServiceB: action` ou HTTP access logs.
  - `log_file_path` (string, opcional): Caminho de arquivo local (`.log`).

## 8. `analyze_codebase_overview` (v3.0)
Gera o Raio-X completo 360 do repositório, combinando mapa mental modular, diagrama C4 de topologia e relatório de métricas.
- **Input (Zod)**
  - `path` (string, opcional): Diretório do projeto.
  - `title` (string, opcional): Título da análise.

## 9. `export_diagram` (Client-Side)
- **Status:** Processamento delegado ao navegador cliente via botões na Web Studio (SVG, PNG, PNG 4K) para zero consumo de CPU no servidor.

## 10. `get_system_observability` (v4.0)
Consulta métricas do Prometheus, estado de saúde do runtime, latência e estatísticas agregadas, com geração opcional de gráficos Mermaid (`xychart-beta` ou `quadrantChart`).
- **Input (Zod)**
  - `include_prometheus_raw` (boolean, opcional): Se true, inclui o texto bruto das métricas Prometheus.
  - `generate_chart` (enum, opcional): `"xychart"`, `"quadrant"` ou `"none"`.
  - `output_path` (string, opcional): Caminho seguro para gravação do arquivo `.mmd` e `.meta.json`.

---

## 🌐 Endpoints HTTP REST (Porta 3001)

* `GET /events`: Stream SSE para atualização de diagramas em tempo real.
* `GET /metrics`: Endpoint padrão texto do Prometheus para scraping de telemetria, CPU, Heap e métricas de negócio.
* `GET /api/observability/stats`: Estatísticas agregadas em JSON (uptime, consumo de memória, conexões SSE e saúde).
* `GET /api/diagrams`: Lista todos os diagramas com metadados e conteúdo `.mmd`.
* `GET /api/diagrams/:id`: Recupera metadados e conteúdo de um diagrama específico.
* `PUT /api/diagrams/:id`: Atualiza o código Mermaid de um diagrama com revalidação de path traversal.
* `GET /api/health`: Status operacional enriquecido (`healthy` | `degraded` | `unhealthy`), uptime, versão e memória.
* `POST /api/ingest/trace`: Ingestão de traces via HTTP para geração de `sequenceDiagram`.
* `POST /api/codebase/scan`: Disparo de varredura de topologia via HTTP.
* `POST /api/codebase/trace-call`: Rastreamento de chamadas de símbolo via HTTP.


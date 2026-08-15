import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import { executeScanTopology } from './src/tools/scan-topology.js';
import { executeTraceCallGraph } from './src/tools/trace-callgraph.js';
import { executeGetObservability } from './src/tools/observability.js';

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [Dogfooding v4.0] Gerando Diagramas de Produção do ArchView ===\n");

  // 1. Mapa Mental Completo do Sistema v4.0
  console.log("1. Gerando Mapa Mental do Ecossistema v4.0...");
  const mindmapRes = executeMindmap({
    central_topic: "ArchView v4.0 Ecosystem",
    description: "Visão 360 graus do servidor MCP, inteligência de código e observabilidade corporativa",
    branches: [
      {
        title: "Ferramentas MCP Nativas (10 Tools)",
        icons: ["🛠️"],
        sub_branches: [
          "generate_mindmap (Mapas Mentais Radiais)",
          "generate_orgchart (Organogramas Hierárquicos DFS)",
          "generate_architecture_diagram (Modelo C4 com Subgrafos)",
          "generate_flowchart (Fluxogramas e Pipelines)",
          "scan_codebase_topology (Topologia C4 Automática)",
          "trace_call_graph (Grafo Bidirecional Inbound/Outbound)",
          "trace_execution_flow (Sequence Diagrams de Logs)",
          "analyze_codebase_overview (Raio-X 360 de Repositórios)",
          "get_system_observability (Telemetria Prometheus & Charts)",
          "export_diagram (Exportação SVG/PNG/4K no Cliente)"
        ]
      },
      {
        title: "Observabilidade e SRE (v4.0)",
        icons: ["📈"],
        sub_branches: [
          "Endpoint /metrics no padrão texto Prometheus",
          "Métricas de Runtime Node.js (CPU, Heap, EventLoop)",
          "Histogramas de latência e contadores por diagrama",
          "Tracing com OpenTelemetry SDK e exportador OTLP",
          "Health check enriquecido com níveis de degradação"
        ]
      },
      {
        title: "Codebase Intelligence Engine",
        icons: ["🧠"],
        sub_branches: [
          "AST Léxica para TypeScript e JavaScript",
          "Parser Léxico Universal (Python, Go, Java, Rust, C#, PHP)",
          "Detecção de Frameworks (Express, Nest, FastAPI, Fiber)",
          "Resolução Determinística de Chamadas Cruzadas",
          "Execução instantânea (< 200ms) sem IA e sem WASM"
        ]
      },
      {
        title: "Web Studio Interativo (Low-CPU)",
        icons: ["🎨"],
        sub_branches: [
          "Aba Observability Hub com telemetria em tempo real",
          "Aba Codebase Explorer com disparo de scans",
          "Editor Split-View com live preview",
          "Playground Didático MCP",
          "GPU-Accelerated Pan e Zoom (0% CPU em repouso)"
        ]
      },
      {
        title: "Segurança e Governança",
        icons: ["🛡️"],
        sub_branches: [
          "Anti-Path Traversal estrito (assertSafePath)",
          "Validação de Schemas Zod com guardrails",
          "Scanner SAST Local e GitHub CodeQL",
          "Pentest Automatizado 8 Vetores OWASP",
          "DOM Sanitizado sem injeção direta de HTML"
        ]
      }
    ],
    style: { palette: "educational" },
    output_path: "self-doc-mindmap.md"
  });
  console.log("  ✅ Mapa Mental:", mindmapRes.file_path);
  console.log("  📄 Metadados:", mindmapRes.meta_path);

  // 2. Organograma Modular da Arquitetura v4.0
  console.log("\n2. Gerando Organograma Modular do Sistema...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do ArchView v4.0",
    description: "Hierarquia de componentes do servidor, engine de inteligência, observabilidade e estúdio web",
    nodes: [
      { id: "core", label: "ArchView Core", role: "Orquestrador Central MCP (stdio)", level: 0, reports_to: null },
      { id: "engine_v3", label: "Codebase Engine", role: "AST & Flow Tracing Determinístico", level: 1, reports_to: "core" },
      { id: "tools_layer", label: "Camada de Tools (10 Tools)", role: "Geradores Especializados", level: 1, reports_to: "core" },
      { id: "infra_layer", label: "Infra & Observability", role: "Express 5 + Prometheus + OTel + SSE (3001)", level: 1, reports_to: "core" },
      { id: "web_studio", label: "Web Studio SPA (Low-CPU)", role: "Alpine.js + Vite (5173)", level: 1, reports_to: "infra_layer" },
      { id: "qa_sec", label: "QA & Segurança SAST", role: "CodeQL, Pentest OWASP, TDD/ODD", level: 1, reports_to: "core" },
      
      // Infra & Obs Sub-modules
      { id: "prom_m", label: "Prometheus Metrics", role: "Coleta e scraping /metrics", department: "Infra", level: 2, reports_to: "infra_layer" },
      { id: "otel_s", label: "OpenTelemetry SDK", role: "Tracing OTLP assíncrono", department: "Infra", level: 2, reports_to: "infra_layer" },
      { id: "sse_h", label: "SSE Hub & REST", role: "Eventos e endpoints de ingestão", department: "Infra", level: 2, reports_to: "infra_layer" },

      // Tools
      { id: "t_mind", label: "Mindmap Tool", role: "Mapas Mentais Radiais", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_org", label: "Orgchart Tool", role: "Validador DFS e Árvore", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_arch", label: "Architecture Tool", role: "Modelo C4 com Subgrafos", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_flow", label: "Flowchart Tool", role: "Processos e Decisões", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_scan_top", label: "scan_codebase_topology", role: "Topologia C4 de Diretórios", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_trace_call", label: "trace_call_graph", role: "Grafo de Chamadas Bidirecional", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_trace_exec", label: "trace_execution_flow", role: "Diagramas de Sequência", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_overview", label: "analyze_codebase_overview", role: "Raio-X 360 do Repositório", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_obs", label: "get_system_observability", role: "Métricas e Gráficos de Saúde", department: "Tools", level: 2, reports_to: "tools_layer" },

      // Web Studio Sub-modules
      { id: "ui_obs", label: "Observability Hub", role: "Dashboard de saúde e traces", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_explorer", label: "Codebase Explorer", role: "Painel de varredura e grafos", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_editor", label: "Editor Split-View", role: "Edição ao vivo com preview", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_play", label: "Playground MCP", role: "Gerador didático de prompts e JSON", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_canvas", label: "GPU Canvas Pan/Zoom", role: "Aceleração por hardware CSS", department: "UI", level: 2, reports_to: "web_studio" }
    ],
    style: { color_by_level: true, palette: "corporate" },
    output_path: "self-doc-orgchart.md"
  });
  console.log("  ✅ Organograma:", orgRes.file_path);
  console.log("  📄 Metadados:", orgRes.meta_path);

  // 3. Diagrama C4 de Arquitetura de Containers (v4.0)
  console.log("\n3. Gerando Diagrama C4 de Arquitetura de Containers...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Arquitetura do ArchView v4.0",
    description: "Visão dos containers executáveis, motor de AST, observabilidade Prometheus e fluxos de dados",
    elements: [
      {
        id: "ai_client",
        type: "person",
        name: "IA / Desenvolvedor",
        description: "Claude Desktop, Cursor, Antigravity ou Terminal",
        group: "Clientes e Consumidores",
        relationships: [
          { target: "mcp_server", description: "Envia comandos MCP (10 Tools)", technology: "JSON-RPC (stdio)" }
        ]
      },
      {
        id: "browser_user",
        type: "person",
        name: "Usuário no Navegador",
        description: "Observability Hub, Codebase Explorer e Editor ao Vivo",
        group: "Clientes e Consumidores"
      },
      {
        id: "prom_collector",
        type: "external",
        name: "Servidor Prometheus / Grafana",
        description: "Scraping contínuo de métricas em /metrics",
        technology: "Prometheus Text Format",
        group: "Sistemas Externos"
      },
      {
        id: "mcp_server",
        type: "container",
        name: "ArchView MCP Server",
        description: "Orquestrador de 10 ferramentas MCP e motor de AST",
        technology: "TypeScript / Node.js 20",
        group: "Servidores e Backend",
        relationships: [
          { target: "engine_v3", description: "Executa varreduras de código", technology: "AST / Regex" },
          { target: "sse_server", description: "Inicia em background", technology: "In-process" },
          { target: "storage", description: "Persiste .mmd e .meta.json", technology: "Filesystem" }
        ]
      },
      {
        id: "engine_v3",
        type: "container",
        name: "Motor de Codebase Intelligence",
        description: "Parsers AST TS/JS e léxico universal (Python, Go, Java, Rust)",
        technology: "TypeScript Lexical Engine (< 200ms)",
        group: "Servidores e Backend"
      },
      {
        id: "sse_server",
        type: "container",
        name: "Express SSE & Prometheus Hub",
        description: "Transmissão SSE, exportador /metrics e endpoints de traces",
        technology: "Express 5 / Porta 3001",
        group: "Servidores e Backend",
        relationships: [
          { target: "storage", description: "Lê e grava arquivos com assertSafePath", technology: "fs" },
          { target: "web_studio", description: "Transmite eventos /events", technology: "Server-Sent Events" },
          { target: "prom_collector", description: "Responde scraping /metrics", technology: "HTTP GET" }
        ]
      },
      {
        id: "storage",
        type: "database",
        name: "Armazenamento output/",
        description: "Diretório local com sintaxes Mermaid e manifestos JSON",
        technology: "Local Disk / JSON",
        group: "Camada de Persistência"
      },
      {
        id: "web_studio",
        type: "container",
        name: "Web Studio SPA (Low-CPU)",
        description: "Observability Hub, Codebase Explorer, Editor e 4 Temas",
        technology: "Alpine.js (~15KB) / Vite / CSS GPU",
        group: "Interface Gráfica Web",
        relationships: [
          { target: "browser_user", description: "Renderiza diagramas com 0% CPU em repouso", technology: "HTML5 / SVG DOM" },
          { target: "sse_server", description: "Dispara scans e consulta métricas", technology: "REST JSON" }
        ]
      }
    ],
    style: { palette: "corporate", show_technology: true, notation: "flowchart" },
    output_path: "self-doc-architecture.md"
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);
  console.log("  📄 Metadados:", archRes.meta_path);

  // 4. Fluxograma do Ciclo de Vida da Requisição e Ingestão
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida e Telemetria...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida: MCP, Codebase Intelligence e Prometheus",
    description: "Do comando da IA até a telemetria do Prometheus e renderização web",
    steps: [
      { id: "input_source", type: "start", label: "Entrada: IA (stdio), Web Studio ou HTTP REST", group: "1. Entrada e Segurança", next: ["sec_filter"] },
      { id: "sec_filter", type: "process", label: "Filtro de Segurança (assertSafePath & Zod)", group: "1. Entrada e Segurança", next: ["valid_gate"] },
      { id: "valid_gate", type: "decision", label: "Payload Válido e Seguro?", group: "1. Entrada e Segurança", next: [{ id: "select_engine", label: "Sim" }, { id: "error_block", label: "Não" }] },
      { id: "error_block", type: "process", label: "Retorna Erro Estruturado (McpError)", group: "1. Entrada e Segurança", next: ["end_error"] },
      { id: "end_error", type: "end", label: "Execução com Erro", group: "1. Entrada e Segurança" },

      { id: "select_engine", type: "process", label: "Executa Motor e Registra Métrica Prometheus", group: "2. Motor Core & Inteligência", next: ["build_mermaid"] },
      { id: "build_mermaid", type: "process", label: "Gera Sintaxe Mermaid (C4, Flowchart, Sequence ou Mindmap)", group: "2. Motor Core & Inteligência", next: ["write_meta"] },
      { id: "write_meta", type: "database", label: "Grava .mmd e .meta.json no output/", group: "2. Motor Core & Inteligência", next: ["sse_emit"] },
      { id: "sse_emit", type: "queue", label: "Dispara SSE (diagram.created / updated)", group: "2. Motor Core & Inteligência", next: ["resp_client"] },
      { id: "resp_client", type: "process", label: "Retorna JSON de Sucesso para IA/UI", group: "2. Motor Core & Inteligência", next: ["fe_catch"] },

      { id: "fe_catch", type: "process", label: "Web Studio atualiza galeria e Observability Hub", group: "3. Experiência Web Reativa", next: ["apply_themes"] },
      { id: "apply_themes", type: "process", label: "Aplica Temas, Subgrafos e Estilização SVG", group: "3. Experiência Web Reativa", next: ["user_actions"] },
      { id: "user_actions", type: "process", label: "Navegação Codebase, Zoom GPU ou Exportação 4K", group: "3. Experiência Web Reativa", next: ["end_done"] },
      { id: "end_done", type: "end", label: "Visualização Interativa Concluída", group: "3. Experiência Web Reativa" }
    ],
    style: { direction: "TB", palette: "educational" },
    output_path: "self-doc-flowchart.md"
  });
  console.log("  ✅ Fluxograma:", flowRes.file_path);
  console.log("  📄 Metadados:", flowRes.meta_path);

  // 5. Topologia C4 Real do Próprio ArchView (via scan_codebase_topology)
  console.log("\n5. Gerando Topologia C4 Real do Projeto (Dogfooding AST)...");
  const topRes = executeScanTopology({
    title: "Topologia Real do Código do ArchView v4.0",
    view_mode: "hybrid",
    max_depth: 5,
    output_path: "self-doc-topology.md"
  });
  console.log("  ✅ Topologia do Código:", topRes.file_path);
  console.log("  📄 Metadados:", topRes.meta_path);

  // 6. Grafo de Chamadas Real (via trace_call_graph)
  console.log("\n6. Gerando Grafo de Chamadas do Motor de Scanner...");
  const callRes = executeTraceCallGraph({
    symbol_name: "scanCodebase",
    direction: "LR",
    output_path: "self-doc-callgraph.md"
  });
  console.log("  ✅ Grafo de Chamadas:", callRes.file_path);
  console.log("  📄 Metadados:", callRes.meta_path);

  // 7. Telemetria e Métricas do Sistema (via get_system_observability)
  console.log("\n7. Gerando Gráfico de Métricas do Sistema (Dogfooding Observability)...");
  const obsRes = await executeGetObservability({
    generate_chart: "xychart",
    output_path: "self-doc-metrics.md"
  });
  console.log("  ✅ Telemetria do Sistema:", obsRes.file_path);
  console.log("  📄 Metadados:", obsRes.meta_path);

  console.log("\n🎉 === Todos os 7 diagramas de produção do ArchView v4.0 foram gerados com sucesso! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

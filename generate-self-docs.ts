import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import { executeScanTopology } from './src/tools/scan-topology.js';
import { executeTraceCallGraph } from './src/tools/trace-callgraph.js';
import { executeGetObservability } from './src/tools/observability.js';
import { executeExportHtmlReport } from './src/tools/export-html.js';
import { KnowledgeGraphDB } from './src/kg/db.js';
import { detectLouvainCommunities, calculateCentrality } from './src/kg/algorithms.js';

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [Dogfooding v6.0] Gerando Diagramas de Produção do ArchView ===\n");

  const targetDir = process.cwd();

  // 1. Mapa Mental Completo do Sistema v6.0
  console.log("1. Gerando Mapa Mental do Ecossistema v6.0...");
  const mindmapRes = executeMindmap({
    central_topic: "ArchView v6.0 Ecosystem",
    description: "Visão 360 graus do servidor MCP unificado: Knowledge Graph nativo, Visual Engine e Observabilidade",
    branches: [
      {
        title: "Knowledge Graph Nativo (SQLite & FTS5)",
        icons: ["🧠"],
        sub_branches: [
          "Banco SQLite em WAL Mode com better-sqlite3",
          "Indexação Textual Ultrarrápida com FTS5 e Triggers",
          "Detecção de Comunidades com Algoritmo de Louvain",
          "Centralidade de Intermediação e PageRank Iterativo",
          "Análise de Impacto (Blast Radius) e Simulação What-If",
          "Busca de Múltiplos Caminhos (Multi-Path Search)"
        ]
      },
      {
        title: "Ferramentas MCP Nativas (27 Tools)",
        icons: ["🛠️"],
        sub_branches: [
          "Visualização: Mindmap, Orgchart, C4 e Flowchart",
          "Codebase: scan_topology, trace_call_graph, trace_execution",
          "Observabilidade: get_system_observability & Prometheus",
          "Knowledge Graph CRUD: add_node, upsert_node, add_edge, delete_node",
          "Knowledge Graph Analytics: detect_communities, get_centrality, get_impact",
          "Exportação: export_html_report, export_diagram (SVG/PNG/4K)"
        ]
      },
      {
        title: "Geração de HTML & Dashboards Offline",
        icons: ["🌐"],
        sub_branches: [
          "Geração automática de .html standalone por diagrama",
          "Dashboard executivo consolidado (All-in-One)",
          "100% Autocontido e offline-first (Zero Servidor)",
          "Controles fluidos de Pan/Zoom e 4 temas visuais"
        ]
      },
      {
        title: "Observabilidade e SRE",
        icons: ["📈"],
        sub_branches: [
          "Endpoint /metrics no padrão texto Prometheus",
          "Métricas de Runtime Node.js (CPU, Heap, EventLoop)",
          "Tracing com OpenTelemetry SDK e Spans Locais",
          "Health check enriquecido com status de degradação"
        ]
      },
      {
        title: "Live Studio Web Dual-Mode",
        icons: ["🎨"],
        sub_branches: [
          "Aba Mermaid Studio com Live Preview e Edição",
          "Aba Knowledge Graph Explorer com Busca FTS5 e Louvain",
          "Aba Observability Hub com Telemetria em Tempo Real",
          "Aba Codebase Explorer com Disparo de Varreduras"
        ]
      }
    ],
    style: { palette: "educational" },
    output_path: "output/self-doc-mindmap.md",
    target_dir: targetDir
  });
  console.log("  ✅ Mapa Mental:", mindmapRes.file_path);

  // 2. Organograma Modular da Arquitetura v6.0
  console.log("\n2. Gerando Organograma Modular do Sistema...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do ArchView v6.0",
    description: "Hierarquia de componentes do servidor, motor de Knowledge Graph, inteligência de código e estúdio web",
    nodes: [
      { id: "core", label: "ArchView Core", role: "Orquestrador Central MCP (27 Tools)", level: 0, reports_to: null },
      { id: "kg_engine", label: "Knowledge Graph Engine", role: "SQLite WAL + FTS5 + Louvain + PageRank", level: 1, reports_to: "core" },
      { id: "codebase_engine", label: "Codebase Engine", role: "AST & Flow Tracing Universal", level: 1, reports_to: "core" },
      { id: "html_gen", label: "HTML Generator Engine", role: "Geração Offline Standalone & Dashboard", level: 1, reports_to: "core" },
      { id: "tools_layer", label: "Camada de Tools (27 MCP Tools)", role: "Handlers Especializados", level: 1, reports_to: "core" },
      { id: "infra_layer", label: "Infra & Observability", role: "Express 5 + Prometheus + OTel + SSE (3001)", level: 1, reports_to: "core" },
      { id: "web_studio", label: "Web Studio Dual-Mode", role: "Mermaid + KG Explorer + Vite (5173)", level: 1, reports_to: "infra_layer" },
      
      // Sub-modules
      { id: "kg_crud", label: "KG CRUD & Arestas", role: "Gerenciamento de Nós e Relacionamentos", department: "Knowledge Graph", level: 2, reports_to: "kg_engine" },
      { id: "kg_algo", label: "Algoritmos de Rede", role: "Louvain, PageRank, Blast Radius, What-If", department: "Knowledge Graph", level: 2, reports_to: "kg_engine" },
      { id: "code_ast", label: "AST Lexical Scanner", role: "TypeScript, Python, Go, Java, Rust", department: "Codebase", level: 2, reports_to: "codebase_engine" },
      { id: "code_trace", label: "Trace Sequence Parser", role: "Sequence Diagrams de Logs e Traces", department: "Codebase", level: 2, reports_to: "codebase_engine" }
    ],
    style: { color_by_level: true, palette: "corporate" },
    output_path: "output/self-doc-orgchart.md",
    target_dir: targetDir
  });
  console.log("  ✅ Organograma:", orgRes.file_path);

  // 3. Diagrama C4 de Arquitetura de Containers (v6.0)
  console.log("\n3. Gerando Diagrama C4 de Arquitetura de Containers...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Arquitetura do ArchView v6.0",
    description: "Visão dos containers executáveis, motor de Knowledge Graph, gerador HTML e observabilidade",
    elements: [
      {
        id: "ai_client",
        type: "person",
        name: "IA / Desenvolvedor",
        description: "Antigravity, Claude Desktop, Cursor ou Terminal CLI",
        group: "Clientes e Consumidores",
        relationships: [
          { target: "mcp_server", description: "Comandos MCP (27 Tools)", technology: "JSON-RPC (stdio)" }
        ]
      },
      {
        id: "browser_user",
        type: "person",
        name: "Usuário no Navegador",
        description: "Live Studio Dual-Mode, Knowledge Graph Explorer e Dashboards HTML",
        group: "Clientes e Consumidores"
      },
      {
        id: "mcp_server",
        type: "container",
        name: "ArchView MCP Server",
        description: "Orquestrador de 27 ferramentas MCP, Knowledge Graph e HTML Generator",
        technology: "TypeScript / Node.js 20",
        group: "Servidores e Backend",
        relationships: [
          { target: "kg_db", description: "Lê e grava grafos e índices", technology: "better-sqlite3" },
          { target: "codebase_engine", description: "Executa varreduras de código", technology: "AST / Regex" },
          { target: "html_engine", description: "Gera páginas HTML autocontidas", technology: "TypeScript Templates" },
          { target: "sse_server", description: "Inicia em background", technology: "In-process" }
        ]
      },
      {
        id: "kg_db",
        type: "database",
        name: "Knowledge Graph DB",
        description: "Banco SQLite local com FTS5, nós, arestas e auditoria",
        technology: "SQLite 3 / WAL Mode",
        group: "Camada de Persistência"
      },
      {
        id: "codebase_engine",
        type: "container",
        name: "Motor de Codebase Intelligence",
        description: "Parsers AST TS/JS e léxico universal (Python, Go, Java, Rust)",
        technology: "TypeScript Lexical Engine (< 200ms)",
        group: "Servidores e Backend"
      },
      {
        id: "html_engine",
        type: "container",
        name: "Motor Standalone HTML",
        description: "Construtor de páginas offline interativas e dashboards",
        technology: "HTML5 / CSS / Mermaid",
        group: "Servidores e Backend"
      },
      {
        id: "sse_server",
        type: "container",
        name: "Express SSE & REST Server",
        description: "Transmissão SSE, API REST /api/kg/*, /metrics e entrega de HTML",
        technology: "Express 5 / Porta 3001",
        group: "Servidores e Backend",
        relationships: [
          { target: "web_studio", description: "Transmite eventos /events e dados de grafo", technology: "Server-Sent Events / REST" }
        ]
      },
      {
        id: "web_studio",
        type: "container",
        name: "Live Studio Web Dual-Mode",
        description: "Mermaid Studio + Knowledge Graph Explorer com Louvain e PageRank",
        technology: "Alpine.js / Vite / CSS GPU",
        group: "Interface Gráfica Web",
        relationships: [
          { target: "browser_user", description: "Renderização vetorial com zero CPU em repouso", technology: "HTML5 / SVG DOM" },
          { target: "sse_server", description: "Consulta métricas, topologia e grafos", technology: "REST JSON" }
        ]
      }
    ],
    style: { palette: "corporate", show_technology: true, notation: "flowchart" },
    output_path: "output/self-doc-architecture.md",
    target_dir: targetDir
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);

  // 4. Fluxograma do Ciclo de Vida da Requisição e Ingestão
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida: MCP, Knowledge Graph, AST e HTML Generator",
    description: "Do comando da IA até a persistência do Knowledge Graph e visualização offline",
    steps: [
      { id: "input_source", type: "start", label: "Entrada: IA (stdio), Web Studio ou HTTP REST", group: "1. Entrada e Segurança", next: ["sec_filter"] },
      { id: "sec_filter", type: "process", label: "Filtro de Segurança (assertSafePath & Zod)", group: "1. Entrada e Segurança", next: ["valid_gate"] },
      { id: "valid_gate", type: "decision", label: "Payload Válido e Seguro?", group: "1. Entrada e Segurança", next: [{ id: "select_engine", label: "Sim" }, { id: "error_block", label: "Não" }] },
      { id: "error_block", type: "process", label: "Retorna Erro Estruturado (McpError)", group: "1. Entrada e Segurança", next: ["end_error"] },
      { id: "end_error", type: "end", label: "Execução com Erro", group: "1. Entrada e Segurança" },

      { id: "select_engine", type: "process", label: "Executa Motor (KG / AST / Diagrama) e Registra Métrica", group: "2. Motor Core & Inteligência", next: ["db_or_mermaid"] },
      { id: "db_or_mermaid", type: "decision", label: "Operação de Knowledge Graph?", group: "2. Motor Core & Inteligência", next: [{ id: "kg_exec", label: "Sim" }, { id: "build_mermaid", label: "Não" }] },
      { id: "kg_exec", type: "database", label: "Atualiza SQLite WAL e Tabela FTS5", group: "2. Motor Core & Inteligência", next: ["sse_emit"] },
      { id: "build_mermaid", type: "process", label: "Gera Sintaxe Mermaid e Relatório HTML Standalone", group: "2. Motor Core & Inteligência", next: ["write_meta"] },
      { id: "write_meta", type: "database", label: "Grava .mmd, .meta.json e .html no output/ do projeto", group: "2. Motor Core & Inteligência", next: ["sse_emit"] },
      { id: "sse_emit", type: "queue", label: "Dispara SSE (diagram.* ou kg.*)", group: "2. Motor Core & Inteligência", next: ["resp_client"] },
      { id: "resp_client", type: "process", label: "Retorna JSON de Sucesso para IA/UI", group: "2. Motor Core & Inteligência", next: ["fe_catch"] },

      { id: "fe_catch", type: "process", label: "Web Studio atualiza Live Preview e KG Explorer", group: "3. Experiência Web Reativa", next: ["apply_themes"] },
      { id: "apply_themes", type: "process", label: "Aplica Temas, Badges Louvain e Estilização SVG", group: "3. Experiência Web Reativa", next: ["user_actions"] },
      { id: "user_actions", type: "process", label: "Abertura Offline (.html), Pan/Zoom ou Exportação 4K", group: "3. Experiência Web Reativa", next: ["end_done"] },
      { id: "end_done", type: "end", label: "Visualização Interativa Concluída", group: "3. Experiência Web Reativa" }
    ],
    style: { direction: "TB", palette: "educational" },
    output_path: "output/self-doc-flowchart.md",
    target_dir: targetDir
  });
  console.log("  ✅ Fluxograma:", flowRes.file_path);

  // 5. Topologia C4 Real do Próprio ArchView (via scan_codebase_topology)
  console.log("\n5. Gerando Topologia C4 Real do Projeto (Dogfooding AST)...");
  const topRes = executeScanTopology({
    path: targetDir,
    title: "Topologia Real do Código do ArchView v6.0",
    view_mode: "hybrid",
    max_depth: 5,
    output_path: "output/self-doc-topology.md"
  });
  console.log("  ✅ Topologia do Código:", topRes.file_path);

  // 6. Grafo de Chamadas Real (via trace_call_graph)
  console.log("\n6. Gerando Grafo de Chamadas do Motor de Scanner...");
  const callRes = executeTraceCallGraph({
    path: targetDir,
    symbol_name: "scanCodebase",
    direction: "LR",
    output_path: "output/self-doc-callgraph.md"
  });
  console.log("  ✅ Grafo de Chamadas:", callRes.file_path);

  // 7. Telemetria e Métricas do Sistema (via get_system_observability)
  console.log("\n7. Gerando Gráfico de Métricas do Sistema...");
  const obsRes = await executeGetObservability({
    generate_chart: "xychart",
    output_path: "output/self-doc-metrics.md",
    target_dir: targetDir
  });
  console.log("  ✅ Telemetria do Sistema:", obsRes.file_path);

  // 8. Povoar e Inicializar Knowledge Graph Local de Demonstração
  console.log("\n8. Inicializando Knowledge Graph nativo com componentes do ArchView...");
  const kg = new KnowledgeGraphDB();
  const n1 = kg.upsertNode({ label: "service", name: "ArchView Core", qualified_name: "src/server.ts", properties: { role: "Orquestrador MCP" } });
  const n2 = kg.upsertNode({ label: "module", name: "Knowledge Graph Engine", qualified_name: "src/kg/db.ts", properties: { db: "sqlite" } });
  const n3 = kg.upsertNode({ label: "module", name: "Codebase Intelligence", qualified_name: "src/engine/universal-scanner.ts", properties: { lang: "ts" } });
  const n4 = kg.upsertNode({ label: "module", name: "HTML Generator", qualified_name: "src/engine/html-generator.ts", properties: { engine: "html5" } });
  const n5 = kg.upsertNode({ label: "ui", name: "Live Web Studio", qualified_name: "frontend/src/main.ts", properties: { framework: "alpine" } });

  if (n1.id && n2.id) kg.addEdge({ source_id: n1.id, target_id: n2.id, type: "IMPORTS" });
  if (n1.id && n3.id) kg.addEdge({ source_id: n1.id, target_id: n3.id, type: "IMPORTS" });
  if (n1.id && n4.id) kg.addEdge({ source_id: n1.id, target_id: n4.id, type: "IMPORTS" });
  if (n5.id && n1.id) kg.addEdge({ source_id: n5.id, target_id: n1.id, type: "CONSUMES" });

  const allNodes = kg.getAllNodes();
  const allEdges = kg.getAllEdges();
  const comms = detectLouvainCommunities(allNodes, allEdges);
  const cents = calculateCentrality(allNodes, allEdges);
  console.log(`  ✅ KG local inicializado: ${allNodes.length} nós, ${allEdges.length} arestas, ${comms.communities_count} comunidades Louvain.`);

  // 9. Dashboard Consolidado HTML (via export_html_report)
  console.log("\n9. Gerando Dashboard Executivo HTML Consolidado (All-in-One)...");
  const dashRes = executeExportHtmlReport({
    mode: "dashboard",
    output_path: "output/archview-dashboard.html",
    target_dir: targetDir
  });
  console.log("  ✅ Dashboard Consolidado:", dashRes.file_path);

  console.log("\n🎉 === Todos os diagramas e páginas HTML do ArchView v6.0 foram gerados com sucesso na pasta output/! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

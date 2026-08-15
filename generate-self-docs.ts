import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import { executeScanTopology } from './src/tools/scan-topology.js';
import { executeTraceCallGraph } from './src/tools/trace-callgraph.js';

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [Dogfooding v3.0] Gerando Diagramas de Produção do ArchView ===\n");

  // 1. Mapa Mental Completo do Sistema v3.0
  console.log("1. Gerando Mapa Mental do Ecossistema v3.0...");
  const mindmapRes = executeMindmap({
    central_topic: "ArchView v3.0 Ecosystem",
    description: "Visão 360 graus do servidor MCP, estúdio web e motor de inteligência de codebase",
    branches: [
      {
        title: "Ferramentas MCP Nativas (9 Tools)",
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
          "export_diagram (Exportação SVG/PNG/4K no Cliente)"
        ]
      },
      {
        title: "Codebase Intelligence (v3.0 Engine)",
        icons: ["🧠"],
        sub_branches: [
          "AST Léxica para TypeScript e JavaScript",
          "Parser Léxico Universal (Python, Go, Java, Rust, C#, PHP)",
          "Detecção de Frameworks (Express, Nest, FastAPI, Fiber, Gin)",
          "Resolução Determinística de Chamadas Cruzadas",
          "Execução instantânea (< 200ms) sem IA e sem WASM"
        ]
      },
      {
        title: "Comunicação e Streaming",
        icons: ["⚡"],
        sub_branches: [
          "MCP Stdio JSON-RPC (Claude, Cursor, Antigravity)",
          "Express 5 API REST na porta 3001",
          "Server-Sent Events (/events em tempo real)",
          "Endpoint POST /api/ingest/trace para logs HTTP",
          "Endpoints POST /api/codebase/* para varreduras remotas"
        ]
      },
      {
        title: "Web Studio Interativo (Low-CPU)",
        icons: ["🎨"],
        sub_branches: [
          "Aba Codebase Explorer com disparo de scans",
          "Editor Split-View com live preview",
          "Playground Didático MCP",
          "GPU-Accelerated Pan e Zoom (0% CPU em repouso)",
          "4 Temas (Educacional, Corporativo, Minimal, Dark)"
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

  // 2. Organograma Modular da Arquitetura v3.0
  console.log("\n2. Gerando Organograma Modular do Sistema...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do ArchView v3.0",
    description: "Hierarquia de componentes do servidor, engine de inteligência e estúdio web",
    nodes: [
      { id: "core", label: "ArchView Core", role: "Orquestrador Central MCP (stdio)", level: 0, reports_to: null },
      { id: "engine_v3", label: "Codebase Engine (v3.0)", role: "AST & Flow Tracing Determinístico", level: 1, reports_to: "core" },
      { id: "tools_layer", label: "Camada de Tools (9 Tools)", role: "Geradores Especializados", level: 1, reports_to: "core" },
      { id: "infra_layer", label: "Infra & Streaming", role: "Express 5 + SSE Hub (3001)", level: 1, reports_to: "core" },
      { id: "web_studio", label: "Web Studio SPA (Low-CPU)", role: "Alpine.js + Vite (5173)", level: 1, reports_to: "infra_layer" },
      { id: "qa_sec", label: "QA & Segurança SAST", role: "CodeQL, Pentest OWASP, TDD/ODD", level: 1, reports_to: "core" },
      
      // Engine v3 Sub-modules
      { id: "v3_ast_ts", label: "AST Parser TS/JS", role: "Extração de classes, rotas e métodos", department: "Engine", level: 2, reports_to: "engine_v3" },
      { id: "v3_ast_lex", label: "Universal Lexical Parser", role: "Suporte Python, Go, Java, Rust, C#", department: "Engine", level: 2, reports_to: "engine_v3" },
      { id: "v3_scanner", label: "Universal Scanner", role: "Varredura recursiva e resolução de deps", department: "Engine", level: 2, reports_to: "engine_v3" },
      { id: "v3_trace_p", label: "Trace/Log Parser", role: "Transpilação para sequenceDiagram", department: "Engine", level: 2, reports_to: "engine_v3" },

      // Tools
      { id: "t_mind", label: "Mindmap Tool", role: "Mapas Mentais Radiais", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_org", label: "Orgchart Tool", role: "Validador DFS e Árvore", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_arch", label: "Architecture Tool", role: "Modelo C4 com Subgrafos", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_flow", label: "Flowchart Tool", role: "Processos e Decisões", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_scan_top", label: "scan_codebase_topology", role: "Topologia C4 de Diretórios", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_trace_call", label: "trace_call_graph", role: "Grafo de Chamadas Bidirecional", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_trace_exec", label: "trace_execution_flow", role: "Diagramas de Sequência", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_overview", label: "analyze_codebase_overview", role: "Raio-X 360 do Repositório", department: "Tools", level: 2, reports_to: "tools_layer" },

      // Web Studio Sub-modules
      { id: "ui_explorer", label: "Codebase Explorer", role: "Painel de varredura e grafos", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_editor", label: "Editor Split-View", role: "Edição ao vivo com preview", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_play", label: "Playground MCP", role: "Gerador didático de prompts e JSON", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_canvas", label: "GPU Canvas Pan/Zoom", role: "Aceleração por hardware CSS", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_themes", label: "Motor de 4 Temas", role: "3 Camadas (Variables + CSS + SVG DOM)", department: "UI", level: 2, reports_to: "web_studio" }
    ],
    style: { color_by_level: true, palette: "corporate" },
    output_path: "self-doc-orgchart.md"
  });
  console.log("  ✅ Organograma:", orgRes.file_path);
  console.log("  📄 Metadados:", orgRes.meta_path);

  // 3. Diagrama C4 de Arquitetura de Containers (v3.0)
  console.log("\n3. Gerando Diagrama C4 de Arquitetura de Containers...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Arquitetura do ArchView v3.0",
    description: "Visão dos containers executáveis, motor de AST e fluxos de dados",
    elements: [
      {
        id: "ai_client",
        type: "person",
        name: "IA / Desenvolvedor",
        description: "Claude Desktop, Cursor, Antigravity ou Terminal",
        group: "Clientes e Consumidores",
        relationships: [
          { target: "mcp_server", description: "Envia comandos MCP", technology: "JSON-RPC (stdio)" }
        ]
      },
      {
        id: "browser_user",
        type: "person",
        name: "Usuário no Navegador",
        description: "Codebase Explorer, Editor Split-View e Exportação 4K",
        group: "Clientes e Consumidores"
      },
      {
        id: "mcp_server",
        type: "container",
        name: "ArchView MCP Server",
        description: "Orquestrador de 9 ferramentas MCP e motor de AST",
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
        name: "Express SSE & REST",
        description: "Transmissão em tempo real e endpoints de ingestão de traces",
        technology: "Express 5 / Porta 3001",
        group: "Servidores e Backend",
        relationships: [
          { target: "storage", description: "Lê e grava arquivos com assertSafePath", technology: "fs" },
          { target: "web_studio", description: "Transmite eventos /events", technology: "Server-Sent Events" }
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
        description: "Codebase Explorer, Editor ao vivo e 4 Temas visuais",
        technology: "Alpine.js (~15KB) / Vite / CSS GPU",
        group: "Interface Gráfica Web",
        relationships: [
          { target: "browser_user", description: "Renderiza diagramas com 0% CPU em repouso", technology: "HTML5 / SVG DOM" },
          { target: "sse_server", description: "Dispara scans e salva edições", technology: "REST JSON" }
        ]
      }
    ],
    style: { palette: "corporate", show_technology: true, notation: "flowchart" },
    output_path: "self-doc-architecture.md"
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);
  console.log("  📄 Metadados:", archRes.meta_path);

  // 4. Fluxograma do Ciclo de Vida da Requisição e Ingestão
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida e Codebase Intelligence...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida: MCP, Codebase Intelligence e Traces",
    description: "Do comando da IA ou HTTP até a renderização do grafo e exportação",
    steps: [
      { id: "input_source", type: "start", label: "Entrada: IA (stdio), Web Studio ou HTTP REST", group: "1. Entrada e Segurança", next: ["sec_filter"] },
      { id: "sec_filter", type: "process", label: "Filtro de Segurança (assertSafePath & Zod)", group: "1. Entrada e Segurança", next: ["valid_gate"] },
      { id: "valid_gate", type: "decision", label: "Payload Válido e Seguro?", group: "1. Entrada e Segurança", next: [{ id: "select_engine", label: "Sim" }, { id: "error_block", label: "Não" }] },
      { id: "error_block", type: "process", label: "Retorna Erro Estruturado (McpError)", group: "1. Entrada e Segurança", next: ["end_error"] },
      { id: "end_error", type: "end", label: "Execução com Erro", group: "1. Entrada e Segurança" },

      { id: "select_engine", type: "process", label: "Seleciona Motor (Diagramação Core ou Codebase AST)", group: "2. Motor Core & Inteligência", next: ["build_mermaid"] },
      { id: "build_mermaid", type: "process", label: "Gera Sintaxe Mermaid (C4, Flowchart, Sequence ou Mindmap)", group: "2. Motor Core & Inteligência", next: ["write_meta"] },
      { id: "write_meta", type: "database", label: "Grava .mmd e .meta.json no output/", group: "2. Motor Core & Inteligência", next: ["sse_emit"] },
      { id: "sse_emit", type: "queue", label: "Dispara SSE (diagram.created / updated)", group: "2. Motor Core & Inteligência", next: ["resp_client"] },
      { id: "resp_client", type: "process", label: "Retorna JSON de Sucesso para IA/UI", group: "2. Motor Core & Inteligência", next: ["fe_catch"] },

      { id: "fe_catch", type: "process", label: "Web Studio recebe evento SSE instantaneamente", group: "3. Experiência Web Reativa", next: ["apply_themes"] },
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
    title: "Topologia Real do Código do ArchView",
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

  console.log("\n🎉 === Todos os 6 diagramas de produção do ArchView v3.0 foram gerados com sucesso! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

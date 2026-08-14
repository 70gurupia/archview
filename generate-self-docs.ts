import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [Dogfooding] Gerando Diagramas Atualizados do ArchView v2.0 ===\n");

  // 1. Mapa Mental Completo do Sistema e Roadmap
  console.log("1. Gerando Mapa Mental do Projeto e Recursos...");
  const mindmapRes = executeMindmap({
    central_topic: "ArchView v2.0 & Roadmap v3.0",
    description: "Visão 360 graus do servidor MCP, estúdio web e motor de inteligência de codebase",
    branches: [
      {
        title: "Ferramentas MCP Nativas",
        icons: ["🛠️"],
        sub_branches: [
          "generate_mindmap (Mapas Mentais)",
          "generate_orgchart (Organogramas com DFS)",
          "generate_architecture_diagram (Modelo C4)",
          "generate_flowchart (Fluxogramas lógicos)",
          "export_diagram (Exportação SVG/PNG/4K)"
        ]
      },
      {
        title: "Comunicação e Streaming",
        icons: ["⚡"],
        sub_branches: [
          "MCP Stdio JSON-RPC (Claude, Cursor, Antigravity)",
          "Express 5 API REST (porta 3001)",
          "Server-Sent Events (/events em tempo real)",
          "Endpoint PUT /api/diagrams/:id para edição"
        ]
      },
      {
        title: "Web Studio Interativo (Low-CPU)",
        icons: ["🎨"],
        sub_branches: [
          "Editor Split-View com live preview",
          "Playground Didático MCP (gerador de prompts/JSON)",
          "Tour de Onboarding na primeira visita",
          "GPU-Accelerated Pan e Zoom (0% CPU em repouso)",
          "4 Temas (Educacional, Corporativo, Minimal, Dark)"
        ]
      },
      {
        title: "Segurança e Governança",
        icons: ["🛡️"],
        sub_branches: [
          "Anti-Path Traversal estrito (assertSafePath)",
          "Scanner SAST Local e GitHub CodeQL",
          "Pentest Automatizado 8 Vetores OWASP",
          "Dependabot e PR Quality Bot no CI/CD"
        ]
      },
      {
        title: "Roadmap v3.0 (Codebase Intelligence)",
        icons: ["🗺️"],
        sub_branches: [
          "scan_codebase_topology (Visão C4 automática)",
          "trace_call_graph (Grafo de quem chama quem)",
          "trace_execution_flow (Diagrama de sequência de logs)",
          "analyze_codebase_overview (Raio-X de projetos)",
          "Ingestão Híbrida (Arquivo JSON + POST /api/ingest/trace)"
        ]
      }
    ],
    style: { palette: "educational" },
    output_path: "self-doc-mindmap.md"
  });
  console.log("  ✅ Mapa Mental:", mindmapRes.file_path);
  console.log("  📄 Metadados:", mindmapRes.meta_path);

  // 2. Organograma Atualizado da Arquitetura Modular
  console.log("\n2. Gerando Organograma Modular do Sistema...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do ArchView",
    description: "Hierarquia de componentes do servidor, estúdio web e motor v3.0",
    nodes: [
      { id: "core", label: "ArchView Core", role: "Orquestrador Central MCP (stdio)", level: 0, reports_to: null },
      { id: "tools_layer", label: "Camada de Tools (v2.0)", role: "Geradores Especializados", level: 1, reports_to: "core" },
      { id: "infra_layer", label: "Infra & Streaming", role: "Express 5 + SSE Hub (3001)", level: 1, reports_to: "core" },
      { id: "web_studio", label: "Web Studio SPA (Low-CPU)", role: "Alpine.js + Vite (5173)", level: 1, reports_to: "infra_layer" },
      { id: "qa_sec", label: "QA & Segurança SAST", role: "CodeQL, Pentest OWASP, TDD/ODD", level: 1, reports_to: "core" },
      { id: "engine_v3", label: "Codebase Engine (v3.0)", role: "AST & Flow Tracing Determinístico", level: 1, reports_to: "core" },
      
      // Tools v2
      { id: "t_mind", label: "Mindmap Tool", role: "Mapas Mentais Radiais", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_org", label: "Orgchart Tool", role: "Validador DFS e Árvore", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_arch", label: "Architecture Tool", role: "Modelo C4 (C1-C3)", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_flow", label: "Flowchart Tool", role: "Processos e Decisões", department: "Tools", level: 2, reports_to: "tools_layer" },
      { id: "t_exp", label: "Export Tool", role: "CLI Mermaid (SVG/PNG/4K)", department: "Tools", level: 2, reports_to: "tools_layer" },

      // Web Studio Sub-modules
      { id: "ui_editor", label: "Editor Split-View", role: "Edição ao vivo com preview", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_play", label: "Playground MCP", role: "Gerador didático de prompts e JSON", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_tour", label: "Tour de Onboarding", role: "Guia interativo de 3 passos", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_canvas", label: "GPU Canvas Pan/Zoom", role: "Aceleração por hardware CSS", department: "UI", level: 2, reports_to: "web_studio" },
      { id: "ui_themes", label: "Motor de 4 Temas", role: "3 Camadas (Variables + CSS + SVG DOM)", department: "UI", level: 2, reports_to: "web_studio" },

      // Engine v3 Sub-modules
      { id: "v3_scan", label: "scan_codebase_topology", role: "Varredura universal de pastas C4", department: "v3", level: 2, reports_to: "engine_v3" },
      { id: "v3_call", label: "trace_call_graph", role: "Mapeamento de chamadas e imports", department: "v3", level: 2, reports_to: "engine_v3" },
      { id: "v3_flow", label: "trace_execution_flow", role: "Diagramas de sequência de traces", department: "v3", level: 2, reports_to: "engine_v3" }
    ],
    style: { color_by_level: true, palette: "corporate" },
    output_path: "self-doc-orgchart.md"
  });
  console.log("  ✅ Organograma:", orgRes.file_path);
  console.log("  📄 Metadados:", orgRes.meta_path);

  // 3. Diagrama C4 de Arquitetura (C2 Container)
  console.log("\n3. Gerando Diagrama C4 de Arquitetura de Containers...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Arquitetura do ArchView v2.0",
    description: "Visão dos containers executáveis, clientes suportados e fluxo de dados",
    elements: [
      {
        id: "ai_client",
        type: "person",
        name: "IA / Desenvolvedor",
        description: "Claude Desktop, Cursor, Antigravity ou Terminal",
        relationships: [
          { target: "mcp_server", description: "Envia requisições MCP", technology: "JSON-RPC (stdio)" }
        ]
      },
      {
        id: "mcp_server",
        type: "container",
        name: "ArchView MCP Daemon",
        description: "Executa tools de diagramação e gerencia estado",
        technology: "TypeScript / Node.js 20",
        relationships: [
          { target: "sse_server", description: "Inicia em background", technology: "In-process" },
          { target: "storage", description: "Persiste .mmd e .meta.json", technology: "Filesystem" }
        ]
      },
      {
        id: "sse_server",
        type: "container",
        name: "Express SSE & REST",
        description: "Transmissão de eventos em tempo real e API REST",
        technology: "Express 5 / Porta 3001",
        relationships: [
          { target: "storage", description: "Lê e grava arquivos editados", technology: "fs / assertSafePath" },
          { target: "web_studio", description: "Transmite stream /events", technology: "Server-Sent Events" }
        ]
      },
      {
        id: "storage",
        type: "database",
        name: "Armazenamento output/",
        description: "Diretório local com sintaxes Mermaid e manifestos JSON",
        technology: "Local Disk / JSON"
      },
      {
        id: "web_studio",
        type: "container",
        name: "Web Studio SPA (Low-CPU)",
        description: "Galeria reativa com Editor Split-View, Playground e 4 Temas",
        technology: "Alpine.js (~15KB) / Vite / CSS GPU",
        relationships: [
          { target: "browser_user", description: "Renderiza interface com 0% CPU em repouso", technology: "HTML5 / SVG DOM" },
          { target: "sse_server", description: "Salva edições ao vivo (PUT /api/diagrams/:id)", technology: "REST JSON" }
        ]
      },
      {
        id: "browser_user",
        type: "person",
        name: "Usuário no Navegador",
        description: "Edita diagramas, usa o playground e exporta em até 4K"
      }
    ],
    style: { palette: "corporate", show_technology: true },
    output_path: "self-doc-architecture.md"
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);
  console.log("  📄 Metadados:", archRes.meta_path);

  // 4. Fluxograma do Ciclo de Vida da Requisição e Edição
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida da Requisição e Interatividade...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida da Geração, Edição e Renderização",
    description: "Do comando da IA ou Playground até a renderização e exportação",
    steps: [
      { id: "input_source", type: "start", label: "Entrada: IA (MCP stdio), Playground Web ou Editor Split-View", next: ["sec_filter"] },
      { id: "sec_filter", type: "process", label: "Filtro de Segurança (Anti-Path Traversal & Validação Zod)", next: ["valid_gate"] },
      { id: "valid_gate", type: "decision", label: "Payload Válido e Seguro?", next: [{ id: "build_mermaid", label: "Sim" }, { id: "error_block", label: "Não" }] },
      { id: "error_block", type: "process", label: "Retorna Erro Estruturado (McpErrorPayload)", next: ["end_error"] },
      { id: "end_error", type: "end", label: "Execução Interrompida com Erro" },
      { id: "build_mermaid", type: "process", label: "Gera Sintaxe Mermaid Pura (.mmd) com Algoritmo DFS Anti-Ciclo", next: ["write_meta"] },
      { id: "write_meta", type: "process", label: "Grava slug-id.mmd e slug-id.meta.json no output/", next: ["sse_emit"] },
      { id: "sse_emit", type: "process", label: "Dispara Evento SSE (diagram.created ou diagram.updated)", next: ["resp_client"] },
      { id: "resp_client", type: "process", label: "Retorna JSON de Sucesso para a IA ou UI", next: ["fe_catch"] },
      { id: "fe_catch", type: "process", label: "Web Studio recebe evento via EventSource sem polling", next: ["apply_themes"] },
      { id: "apply_themes", type: "process", label: "Aplica 3 Camadas: themeVariables -> CSS Vars -> SVG DOM Post-Processor", next: ["user_actions"] },
      { id: "user_actions", type: "process", label: "Interações: GPU Pan/Zoom, Inspetor de Nós, Edição ao Vivo ou Exportação 4K", next: ["end_done"] },
      { id: "end_done", type: "end", label: "Diagrama Pronto e Interativo" }
    ],
    style: { direction: "TB", palette: "educational" },
    output_path: "self-doc-flowchart.md"
  });
  console.log("  ✅ Fluxograma:", flowRes.file_path);
  console.log("  📄 Metadados:", flowRes.meta_path);

  console.log("\n🎉 === Todos os 4 diagramas atualizados foram gerados com sucesso! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

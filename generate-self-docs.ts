import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [Dogfooding] Gerando Diagramas do Próprio MCP Visual Server ===\n");

  // 1. Mapa Mental da Arquitetura e Recursos
  console.log("1. Gerando Mapa Mental do Projeto...");
  const mindmapRes = executeMindmap({
    central_topic: "MCP Visual Server v2.0",
    description: "Visão 360 graus de recursos, camadas e segurança do servidor",
    branches: [
      {
        title: "Ferramentas de Diagramação",
        icons: ["🛠️"],
        sub_branches: [
          "generate_mindmap (Mapas Mentais)",
          "generate_orgchart (Organogramas com DFS)",
          "generate_architecture_diagram (Modelo C4)",
          "generate_flowchart (Fluxogramas lógicos)",
          "export_diagram (Exportação SVG/PNG)"
        ]
      },
      {
        title: "Comunicação e Tempo Real",
        icons: ["⚡"],
        sub_branches: [
          "MCP Stdio (JSON-RPC para IA)",
          "Express API REST (porta 3001)",
          "Server-Sent Events (/events)",
          "Contrato meta.json padronizado"
        ]
      },
      {
        title: "Frontend e Temas",
        icons: ["🎨"],
        sub_branches: [
          "Alpine.js reativo (~15KB)",
          "4 Temas (Educacional, Corporativo, Minimal, Dark)",
          "Pós-processador SVG DOM (Camada 3)",
          "Controles de Zoom, Pan e Exportação 2x"
        ]
      },
      {
        title: "Segurança e Qualidade",
        icons: ["🛡️"],
        sub_branches: [
          "Anti-Path Traversal rigoroso",
          "Detecção de Ciclos Hierárquicos",
          "Pentest 8 Vetores OWASP",
          "Suítes TDD, ODD e E2E"
        ]
      }
    ],
    style: { palette: "educational" },
    output_path: "self-doc-mindmap.md"
  });
  console.log("  ✅ Mapa Mental:", mindmapRes.file_path);
  console.log("  📄 Metadados:", mindmapRes.meta_path);

  // 2. Organograma da Estrutura de Módulos
  console.log("\n2. Gerando Organograma dos Módulos do Sistema...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do MCP Visual Server",
    description: "Hierarquia de componentes do servidor e frontend",
    nodes: [
      { id: "core", label: "VisualServer Core", role: "Orquestrador Central MCP", level: 0, reports_to: null },
      { id: "tools", label: "Camada de Tools", role: "Geradores Especializados", level: 1, reports_to: "core", metadata: { team_size: 5 } },
      { id: "infra", label: "Infra & Streaming", role: "Express + SSE (3001)", level: 1, reports_to: "core" },
      { id: "frontend", label: "Frontend Web Studio", role: "Vite + Alpine.js (5173)", level: 1, reports_to: "infra" },
      { id: "t_mind", label: "Mindmap Tool", role: "Gerador de Mapas Mentais", department: "Tools", level: 2, reports_to: "tools" },
      { id: "t_org", label: "Orgchart Tool", role: "Validador DFS & Árvore", department: "Tools", level: 2, reports_to: "tools" },
      { id: "t_arch", label: "Architecture Tool", role: "Modelo C4 (C1-C3)", department: "Tools", level: 2, reports_to: "tools" },
      { id: "t_flow", label: "Flowchart Tool", role: "Processos e Decisões", department: "Tools", level: 2, reports_to: "tools" },
      { id: "t_exp", label: "Export Tool", role: "Cli Mermaid (SVG/PNG)", department: "Tools", level: 2, reports_to: "tools" },
      { id: "themes", label: "Motor de 4 Temas", role: "Camada 1 (Mermaid) & 2 (CSS)", department: "UI", level: 2, reports_to: "frontend" },
      { id: "post_proc", label: "Pós-Processador SVG", role: "Camada 3 (DOM SVG)", department: "UI", level: 3, reports_to: "themes" }
    ],
    style: { color_by_level: true, palette: "corporate" },
    output_path: "self-doc-orgchart.md"
  });
  console.log("  ✅ Organograma:", orgRes.file_path);
  console.log("  📄 Metadados:", orgRes.meta_path);

  // 3. Diagrama C4 de Arquitetura (C2 Container)
  console.log("\n3. Gerando Diagrama C4 de Arquitetura...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Arquitetura MCP Visual Server v2.0",
    description: "Visão dos containers executáveis e canais de comunicação",
    elements: [
      {
        id: "ai_client",
        type: "person",
        name: "IA / Usuário",
        description: "Claude Desktop, Cursor, Antigravity",
        relationships: [
          { target: "mcp_server", description: "Envia requisições MCP", technology: "JSON-RPC (stdio)" }
        ]
      },
      {
        id: "mcp_server",
        type: "container",
        name: "MCP Server Daemon",
        description: "Executa tools e gerencia estado",
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
        description: "Serviço de streaming e listagem de diagramas",
        technology: "Express 5 / Porta 3001",
        relationships: [
          { target: "storage", description: "Lê arquivos gerados", technology: "fs.readdirSync" },
          { target: "web_studio", description: "Transmite eventos /events", technology: "SSE Stream" }
        ]
      },
      {
        id: "storage",
        type: "database",
        name: "Diretório output/",
        description: "Armazenamento local de diagramas e metadados",
        technology: "JSON / MMD Files"
      },
      {
        id: "web_studio",
        type: "container",
        name: "Web Studio SPA",
        description: "Galeria e estúdio de visualização com 4 temas",
        technology: "Alpine.js / Vite / Vanilla CSS",
        relationships: [
          { target: "browser_user", description: "Renderiza interface interativa", technology: "HTML5 / SVG DOM" }
        ]
      },
      {
        id: "browser_user",
        type: "person",
        name: "Desenvolvedor / Usuário",
        description: "Navega nas abas, troca temas e exporta imagens"
      }
    ],
    style: { palette: "corporate", show_technology: true },
    output_path: "self-doc-architecture.md"
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);
  console.log("  📄 Metadados:", archRes.meta_path);

  // 4. Fluxograma do Ciclo de Vida da Requisição
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida da Requisição...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida da Geração de Diagrama",
    description: "Do comando da IA à renderização reativa com 3 camadas de tema",
    steps: [
      { id: "req_in", type: "start", label: "IA invoca Tool MCP (ex: generate_orgchart)", next: ["sec_check"] },
      { id: "sec_check", type: "process", label: "Validação de Segurança (Anti-Path Traversal & Zod)", next: ["valid_eval"] },
      { id: "valid_eval", type: "decision", label: "Input Válido & Seguro?", next: [{ id: "build_syntax", label: "Sim" }, { id: "err_resp", label: "Não" }] },
      { id: "err_resp", type: "process", label: "Retorna Erro Estruturado (McpErrorPayload)", next: ["end_fail"] },
      { id: "end_fail", type: "end", label: "Execução Interrompida com Erro" },
      { id: "build_syntax", type: "process", label: "Gera Sintaxe Mermaid Pura (.mmd) e Valida Ciclos", next: ["save_disk"] },
      { id: "save_disk", type: "process", label: "Grava slug-id.mmd e slug-id.meta.json no output/", next: ["sse_broadcast"] },
      { id: "sse_broadcast", type: "process", label: "Dispara Evento SSE (diagram.created)", next: ["resp_mcp"] },
      { id: "resp_mcp", type: "process", label: "Retorna JSON de Sucesso para a IA", next: ["fe_receive"] },
      { id: "fe_receive", type: "process", label: "Frontend Alpine.js recebe notificação via EventSource", next: ["render_layers"] },
      { id: "render_layers", type: "process", label: "Aplica 3 Camadas: themeVariables -> CSS Vars -> SVG DOM", next: ["end_success"] },
      { id: "end_success", type: "end", label: "Diagrama Renderizado e Pronto para Interação/Exportação" }
    ],
    style: { direction: "TB", palette: "educational" },
    output_path: "self-doc-flowchart.md"
  });
  console.log("  ✅ Fluxograma:", flowRes.file_path);
  console.log("  📄 Metadados:", flowRes.meta_path);

  console.log("\n🎉 === Todos os 4 diagramas de auto-documentação foram gerados com sucesso! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

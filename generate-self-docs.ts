import fs from 'fs';
import path from 'path';
import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import { executeScanTopology } from './src/tools/scan-topology.js';
import { executeTraceCallGraph } from './src/tools/trace-callgraph.js';
import { executeGetObservability } from './src/tools/observability.js';
import { executeExportHtmlReport } from './src/tools/export-html.js';
import { KnowledgeGraphDB } from './src/kg/db.js';
import { detectLouvainCommunities } from './src/kg/algorithms.js';

function cleanOldDiagrams(outputDir: string): void {
  if (!fs.existsSync(outputDir)) return;
  const files = fs.readdirSync(outputDir);
  for (const f of files) {
    if (f.startsWith('self-doc-') || f === 'archview-dashboard.html') {
      try {
        fs.unlinkSync(path.join(outputDir, f));
      } catch {
        // Ignora
      }
    }
  }
}

function generateCoreDiagrams(targetDir: string): void {
  console.log("1. Gerando Mapa Mental do Ecossistema v7.1...");
  const mindmapRes = executeMindmap({
    central_topic: "ArchView v7.1 Ecosystem",
    description: "Visão 360 graus do servidor MCP: Layout Molécula/Neurônio, Linter Arquitetural, Cache AST, Diff e Knowledge Graph",
    branches: [
      {
        title: "Motor Visual e Layout Concêntrico",
        icons: ["🧬"],
        sub_branches: [
          "Layout Radial de Molécula/Neurônio em 360 graus",
          "Módulo central (entry point) no núcleo do grafo",
          "Distribuição em anéis concêntricos sem limites rígidos",
          "Visualizador Offline Standalone com Pan/Zoom fluido"
        ]
      },
      {
        title: "Inteligência e Linter Arquitetural",
        icons: ["🛡️"],
        sub_branches: [
          "Motor de Regras Declarativas (Rule Engine)",
          "Validação de Camadas (Clean Architecture / SOLID)",
          "Detecção e Alerta de Dependências Circulares",
          "Comparador e Diff Visual de Arquitetura (Drift Score)"
        ]
      },
      {
        title: "Alta Performance e Otimização para IA",
        icons: ["⚡"],
        sub_branches: [
          "Cache Incremental de AST Baseado em SHA-256",
          "Compressor de Contexto para LLM (compress_for_llm: >99% economia)",
          "Clonagem e Varredura Remota Segura (clone_and_scan)",
          "Estimativa Nativa de Tokens (tiktoken) nos Metadados"
        ]
      },
      {
        title: "Knowledge Graph SQLite WAL & FTS5",
        icons: ["🧠"],
        sub_branches: [
          "Banco SQLite em WAL Mode com better-sqlite3",
          "Busca Textual Ultrarrápida com FTS5 e Triggers",
          "Detecção de Comunidades com Algoritmo de Louvain",
          "Centralidade de Intermediação e PageRank Iterativo",
          "Análise de Impacto (Blast Radius) e Simulação What-If"
        ]
      },
      {
        title: "Observabilidade e Desktop GUI",
        icons: ["📊"],
        sub_branches: [
          "Desktop GUI Nativa Tkinter (archview-tk)",
          "Métricas Prometheus (/metrics) e Spans OpenTelemetry",
          "Dashboard Executivo Consolidado (archview-dashboard.html)",
          "16 Suítes de Testes e 6 Quality Gates de Produção"
        ]
      }
    ],
    style: { palette: "educational" },
    output_path: "output/self-doc-mindmap.md",
    target_dir: targetDir
  });
  console.log("  ✅ Mapa Mental:", mindmapRes.file_path);

  console.log("\n2. Gerando Organograma Modular do Sistema v7.1...");
  const orgRes = executeOrgchart({
    title: "Estrutura Modular do ArchView v7.1",
    description: "Hierarquia de componentes do servidor, motor de regras, cache AST, Knowledge Graph e interfaces",
    nodes: [
      { id: "core", label: "ArchView Core v7.1", role: "Orquestrador Central MCP", level: 0, reports_to: null },
      { id: "rule_engine", label: "Rule Engine & Linter", role: "Governança e Regras Arquiteturais", level: 1, reports_to: "core" },
      { id: "ast_cache", label: "AST Cache (SHA-256)", role: "Cache Incremental de Alta Performance", level: 1, reports_to: "core" },
      { id: "diff_engine", label: "Architecture Diff", role: "Comparador de Versões e Drift Score", level: 1, reports_to: "core" },
      { id: "kg_engine", label: "Knowledge Graph Engine", role: "SQLite WAL + FTS5 + Louvain + PageRank", level: 1, reports_to: "core" },
      { id: "codebase_engine", label: "Codebase Engine", role: "Universal Scanner + Layout Molécula", level: 1, reports_to: "core" },
      { id: "html_gen", label: "HTML Generator Engine", role: "Geração Offline Standalone & Dashboard", level: 1, reports_to: "core" },
      { id: "desktop_gui", label: "Desktop GUI (Tkinter)", role: "Painel Nativo Desktop (archview-tk)", level: 1, reports_to: "core" },
      { id: "infra_layer", label: "Infra & Observability", role: "Prometheus + OpenTelemetry + SSE", level: 1, reports_to: "core" }
    ],
    style: { palette: "corporate" },
    output_path: "output/self-doc-orgchart.md",
    target_dir: targetDir
  });
  console.log("  ✅ Organograma:", orgRes.file_path);

  console.log("\n3. Gerando Diagrama C4 de Arquitetura de Containers...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "ArchView v7.1 MCP Server",
    description: "Arquitetura dos containers e subsistemas locais do ArchView",
    elements: [
      { id: "ai_client", name: "Assistente de IA", type: "external", technology: "MCP Client (stdio / SSE)", description: "Consome ferramentas de análise arquitetural", relationships: [{ target: "mcp_server", description: "Chama MCP Tools via stdio/SSE" }] },
      { id: "desktop_ui", name: "ArchView Tk Desktop", type: "system", technology: "Python 3 / Tkinter", description: "Interface desktop leve e rápida", relationships: [{ target: "mcp_server", description: "Executa análises e linter local" }] },
      { id: "mcp_server", name: "ArchView MCP Server", type: "container", technology: "TypeScript / Node 20", description: "Orquestrador central de ferramentas e análises", relationships: [
        { target: "rule_engine", description: "Dispara validações arquiteturais" },
        { target: "ast_cache", description: "Consulta e armazena ASTs" },
        { target: "kg_db", description: "Persiste nós e executa Louvain/PageRank" },
        { target: "html_viewer", description: "Gera relatórios HTML autocontidos" }
      ]},
      { id: "rule_engine", name: "Linter Arquitetural", type: "component", technology: "TypeScript Rule Engine", description: "Aplica regras de Clean Architecture e acoplamento" },
      { id: "ast_cache", name: "Cache Incremental", type: "component", technology: "SHA-256 In-Memory / SQLite", description: "Acelera re-scans em 98%" },
      { id: "kg_db", name: "Knowledge Graph DB", type: "database", technology: "SQLite WAL Mode / FTS5", description: "Armazena nós, arestas e métricas de centralidade" },
      { id: "html_viewer", name: "Visualizador Offline", type: "component", technology: "HTML5 / Mermaid JS / CSS", description: "Renderização em molécula 100% offline" }
    ],
    output_path: "output/self-doc-architecture.md",
    target_dir: targetDir
  });
  console.log("  ✅ Arquitetura C4:", archRes.file_path);
}

function generateFlowAndTopology(targetDir: string): void {
  console.log("\n4. Gerando Fluxograma do Ciclo de Vida...");
  const flowRes = executeFlowchart({
    title: "Ciclo de Vida do ArchView v7.1: AST Cache, Linter, KG e Visualização",
    description: "Do comando da IA até a validação de regras, persistência e visualização concêntrica",
    steps: [
      { id: "input_source", type: "start", label: "Entrada: IA (stdio), Desktop GUI (Tk) ou HTTP REST", group: "1. Entrada e Segurança", next: ["sec_filter"] },
      { id: "sec_filter", type: "process", label: "Filtro de Segurança (assertSafePath, Anti-Injection)", group: "1. Entrada e Segurança", next: ["valid_gate"] },
      { id: "valid_gate", type: "decision", label: "Payload Válido e Seguro?", group: "1. Entrada e Segurança", next: [{ id: "check_cache", label: "Sim" }, { id: "error_block", label: "Não" }] },
      { id: "error_block", type: "process", label: "Retorna Erro Estruturado (McpError)", group: "1. Entrada e Segurança", next: ["end_error"] },
      { id: "end_error", type: "end", label: "Execução com Erro", group: "1. Entrada e Segurança" },

      { id: "check_cache", type: "decision", label: "AST em Cache (SHA-256)?", group: "2. Performance & Motor Core", next: [{ id: "cache_hit", label: "Sim (Hit)" }, { id: "parse_ast", label: "Não (Miss)" }] },
      { id: "cache_hit", type: "process", label: "Recupera AST Instantânea (<0.02ms)", group: "2. Performance & Motor Core", next: ["exec_operation"] },
      { id: "parse_ast", type: "process", label: "Processa AST e Armazena no Cache SHA-256", group: "2. Performance & Motor Core", next: ["exec_operation"] },

      { id: "exec_operation", type: "process", label: "Executa Operação (Linter / Diff / Topologia / KG)", group: "3. Governança e Grafo", next: ["is_linter"] },
      { id: "is_linter", type: "decision", label: "Executando Linter Arquitetural?", group: "3. Governança e Grafo", next: [{ id: "apply_rules", label: "Sim" }, { id: "build_diagram", label: "Não" }] },
      { id: "apply_rules", type: "process", label: "Valida Regras de Camadas e Acoplamento (Rule Engine)", group: "3. Governança e Grafo", next: ["build_diagram"] },

      { id: "build_diagram", type: "process", label: "Gera Layout Concêntrico de Molécula e Relatório HTML", group: "4. Saída e Visualização", next: ["write_meta"] },
      { id: "write_meta", type: "database", label: "Salva .mmd, .meta.json (com contagem de tokens) e .html", group: "4. Saída e Visualização", next: ["resp_client"] },
      { id: "resp_client", type: "process", label: "Retorna Resultado Estruturado para IA/Desktop", group: "4. Saída e Visualização", next: ["end_done"] },
      { id: "end_done", type: "end", label: "Visualização e Análise Concluída", group: "4. Saída e Visualização" }
    ],
    style: { direction: "TB", palette: "educational" },
    output_path: "output/self-doc-flowchart.md",
    target_dir: targetDir
  });
  console.log("  ✅ Fluxograma:", flowRes.file_path);

  console.log("\n5. Gerando Topologia Concêntrica do Código (Dogfooding AST)...");
  const topRes = executeScanTopology({
    path: targetDir,
    title: "Topologia do Código do ArchView v7.1",
    view_mode: "hybrid",
    max_depth: 5,
    output_path: "output/self-doc-topology.md"
  });
  console.log("  ✅ Topologia do Código:", topRes.file_path);

  console.log("\n6. Gerando Grafo de Chamadas do Motor de Scanner...");
  const callRes = executeTraceCallGraph({
    path: targetDir,
    symbol_name: "scanCodebase",
    direction: "LR",
    output_path: "output/self-doc-callgraph.md"
  });
  console.log("  ✅ Grafo de Chamadas:", callRes.file_path);
}

async function generateObservabilityAndKg(targetDir: string): Promise<void> {
  console.log("\n7. Gerando Gráfico de Métricas do Sistema...");
  const obsRes = await executeGetObservability({
    generate_chart: "xychart",
    output_path: "output/self-doc-metrics.md",
    target_dir: targetDir
  });
  console.log("  ✅ Telemetria do Sistema:", obsRes.file_path);

  console.log("\n8. Inicializando Knowledge Graph nativo do ArchView v7.1...");
  const kg = new KnowledgeGraphDB();
  const n1 = kg.upsertNode({ label: "service", name: "ArchView Core", qualified_name: "src/server.ts", properties: { version: "7.1.0" } });
  const n2 = kg.upsertNode({ label: "engine", name: "Rule Engine", qualified_name: "src/engine/rule-engine.ts", properties: { type: "linter" } });
  const n3 = kg.upsertNode({ label: "cache", name: "AST Cache", qualified_name: "src/engine/ast-cache.ts", properties: { hash: "sha256" } });
  const n4 = kg.upsertNode({ label: "diff", name: "Architecture Diff", qualified_name: "src/engine/architecture-diff.ts", properties: { output: "mermaid" } });
  const n5 = kg.upsertNode({ label: "gui", name: "Tkinter Desktop GUI", qualified_name: "scripts/archview-tk.py", properties: { platform: "desktop" } });

  if (n1.id && n2.id) kg.addEdge({ source_id: n1.id, target_id: n2.id, type: "ORCHESTRATES" });
  if (n1.id && n3.id) kg.addEdge({ source_id: n1.id, target_id: n3.id, type: "CONSULTS" });
  if (n1.id && n4.id) kg.addEdge({ source_id: n1.id, target_id: n4.id, type: "CALLS" });
  if (n5.id && n1.id) kg.addEdge({ source_id: n5.id, target_id: n1.id, type: "CONNECTS" });

  const allNodes = kg.getAllNodes();
  const allEdges = kg.getAllEdges();
  const comms = detectLouvainCommunities(allNodes, allEdges);
  console.log(`  ✅ KG local inicializado: ${allNodes.length} nós, ${allEdges.length} arestas, ${comms.communities_count} comunidades Louvain.`);

  console.log("\n9. Gerando Dashboard Executivo HTML Consolidado (All-in-One)...");
  const dashRes = executeExportHtmlReport({
    mode: "dashboard",
    output_path: "output/archview-dashboard.html",
    target_dir: targetDir
  });
  console.log("  ✅ Dashboard Consolidado:", dashRes.file_path);
}

async function generateSelfDocumentationDiagrams() {
  console.log("🚀 === [ArchView v7.1] Limpando e Regenerando Todos os Diagramas de Produção ===\n");
  const targetDir = process.cwd();
  const outputDir = path.join(targetDir, 'output');

  cleanOldDiagrams(outputDir);
  generateCoreDiagrams(targetDir);
  generateFlowAndTopology(targetDir);
  await generateObservabilityAndKg(targetDir);

  console.log("\n🎉 === Todos os diagramas e páginas HTML do ArchView v7.1 foram gerados com sucesso na pasta output/! ===");
}

generateSelfDocumentationDiagrams().catch(console.error);

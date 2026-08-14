import { executeMindmap } from './src/tools/mindmap.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import { executeExport } from './src/tools/export.js';

async function runTests() {
  console.log("Gerando Mapa Mental...");
  const mindmapRes = executeMindmap({
    central_topic: "MCP Visual Server MVP",
    branches: [
      {
        title: "Ferramentas",
        sub_branches: [
          "generate_mindmap (Mapas Mentais)",
          "generate_architecture_diagram (C4 Model)",
          "generate_flowchart (Fluxogramas)",
          "export_diagram (SVG/PNG via mmdc)"
        ]
      },
      {
        title: "Infraestrutura",
        sub_branches: [
          "@modelcontextprotocol/sdk",
          "TypeScript / Node.js",
          "Mermaid JS",
          "Mermaid CLI (mmdc)"
        ]
      },
      {
        title: "Segurança",
        sub_branches: [
          "Anti-Path Traversal",
          "Validação de Inputs"
        ]
      }
    ],
    output_path: "mvp-mindmap.md"
  });
  console.log("Mapa Mental gerado em:", mindmapRes.file_path);

  console.log("Gerando Diagrama de Arquitetura (C4)...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "MCP Visual Server",
    description: "Servidor MCP local para geração de diagramas usando Mermaid JS",
    elements: [
      { id: "ai_client", type: "system", name: "AI Client", description: "Claude, Cursor, Copilot" },
      { id: "mcp_server", type: "container", name: "MCP Visual Server", description: "Node.js Server", technology: "TypeScript" },
      { id: "mermaid_cli", type: "component", name: "Mermaid CLI", description: "Exportador de SVG/PNG", technology: "Puppeteer" }
    ],
    elements: [
      { id: "ai_client", type: "system", name: "AI Client", description: "Claude, Cursor, Copilot", relationships: [{ target: "mcp_server", description: "Chama ferramentas MCP", technology: "JSON-RPC/Stdio" }] },
      { id: "mcp_server", type: "container", name: "MCP Visual Server", description: "Node.js Server", technology: "TypeScript", relationships: [{ target: "mermaid_cli", description: "Executa cli local", technology: "child_process" }] },
      { id: "mermaid_cli", type: "component", name: "Mermaid CLI", description: "Exportador de SVG/PNG", technology: "Puppeteer" }
    ],
    output_path: "mvp-architecture.md"
  });
  console.log("Arquitetura gerada em:", archRes.file_path);

  console.log("Gerando Fluxograma...");
  const flowRes = executeFlowchart({
    title: "Fluxo de Geração de Diagrama",
    steps: [
      { id: "A", type: "start", label: "Recebe Request (JSON)" },
      { id: "B", type: "process", label: "Valida Schema e Segurança" },
      { id: "C", type: "decision", label: "Input Válido?" },
      { id: "D", type: "process", label: "Gera Código Mermaid (Markdown)" },
      { id: "E", type: "process", label: "Exporta (mmdc -> SVG/PNG)" },
      { id: "F", type: "end", label: "Retorna Preview + Caminho do Arquivo" },
      { id: "G", type: "end", label: "Retorna Erro MCP" }
    ],
    // Link edges
    style: { direction: "TD" },
    output_path: "mvp-flowchart.md"
  });
  
  // adding edges manually here for the object since we didn't add it in the first pass
  flowRes.markdown = flowRes.markdown.replace('A(["Recebe Request (JSON)"])', 'A(["Recebe Request (JSON)"]) --> B');
  flowRes.markdown = flowRes.markdown.replace('B["Valida Schema e Segurança"]', 'B["Valida Schema e Segurança"] --> C');
  flowRes.markdown = flowRes.markdown.replace('C{"Input Válido?"}', 'C{"Input Válido?"} -- "Sim" --> D\\n  C{"Input Válido?"} -- "Não" --> G');
  flowRes.markdown = flowRes.markdown.replace('D["Gera Código Mermaid (Markdown)"]', 'D["Gera Código Mermaid (Markdown)"] --> E');
  flowRes.markdown = flowRes.markdown.replace('E["Exporta (mmdc -> SVG/PNG)"]', 'E["Exporta (mmdc -> SVG/PNG)"] --> F');

  // Let's write the updated markdown
  const fs = await import('fs');
  fs.writeFileSync(flowRes.file_path, flowRes.markdown);

  console.log("Fluxograma gerado em:", flowRes.file_path);

  console.log("Exportando os diagramas para SVG...");
  await executeExport({ source_path: mindmapRes.file_path, target_format: "svg" });
  await executeExport({ source_path: archRes.file_path, target_format: "svg" });
  await executeExport({ source_path: flowRes.file_path, target_format: "svg" });
  console.log("Exportação concluída com sucesso!");
}

runTests().catch(console.error);

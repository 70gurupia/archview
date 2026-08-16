import path from 'path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { executeMindmap, MindmapInput } from './tools/mindmap.js';
import { executeOrgchart, OrgchartInput } from './tools/orgchart.js';
import { executeArchitecture, ArchitectureInput } from './tools/architecture.js';
import { executeFlowchart, FlowchartInput } from './tools/flowchart.js';
import { executeExport, ExportInput } from './tools/export.js';
import { executeScanTopology, ScanTopologyInput } from './tools/scan-topology.js';
import { executeTraceCallGraph, TraceCallGraphInput } from './tools/trace-callgraph.js';
import { executeTraceExecution, TraceExecutionInput } from './tools/trace-execution.js';
import { executeAnalyzeOverview, AnalyzeOverviewInput } from './tools/analyze-overview.js';
import { executeGetObservability, ObservabilityInput } from './tools/observability.js';
import { executeExportHtmlReport, ExportHtmlInput } from './tools/export-html.js';
import { startSseServer } from './utils/sse.js';
import { initOpenTelemetry } from './utils/otel.js';

import { KnowledgeGraphDB } from './kg/db.js';
import { handleAddNode, handleUpsertNode, handleAddNodesBatch, handleDeleteNode, handleGetNode, handleSearchGraph } from './tools/kg/nodes.js';
import { handleAddEdge, handleAddEdgesBatch, handleTracePath, handleTracePaths } from './tools/kg/edges.js';
import { handleDetectCommunities, handleGetCentrality, handleGetImpact, handleWhatIfRemove, handleFindOrphans, handleKgHealthCheck } from './tools/kg/analytics.js';

class VisualServer {
  private server: Server;
  private kg: KnowledgeGraphDB;

  constructor() {
    initOpenTelemetry();
    this.kg = new KnowledgeGraphDB();

    this.server = new Server(
      {
        name: "archview",
        version: "6.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      this.kg.close();
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const name = request.params.name;
      const args = (request.params.arguments || {}) as any;

      try {
        const result = await this.dispatchTool(name, args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, tool: name, ...result }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        if (error instanceof McpError) throw error;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                tool: name,
                error: {
                  code: error.message.includes('Path traversal') ? 'PATH_TRAVERSAL' : 'VALIDATION_ERROR',
                  message: error.message
                }
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  private getHandlers(): Record<string, (args: any) => Promise<any> | any> {
    return {
      generate_mindmap: (args) => this.formatVisualResult(executeMindmap(args as MindmapInput)),
      generate_orgchart: (args) => this.formatVisualResult(executeOrgchart(args as OrgchartInput)),
      generate_architecture_diagram: (args) => this.formatVisualResult(executeArchitecture(args as ArchitectureInput)),
      generate_flowchart: (args) => this.formatVisualResult(executeFlowchart(args as FlowchartInput)),
      export_diagram: async (args) => this.formatVisualResult(await executeExport(args as ExportInput)),
      scan_codebase_topology: (args) => this.formatVisualResult(executeScanTopology(args as ScanTopologyInput)),
      trace_call_graph: (args) => this.formatVisualResult(executeTraceCallGraph(args as TraceCallGraphInput)),
      trace_execution_flow: (args) => this.formatVisualResult(executeTraceExecution(args as TraceExecutionInput)),
      analyze_codebase_overview: (args) => this.formatVisualResult(executeAnalyzeOverview(args as AnalyzeOverviewInput)),
      get_system_observability: async (args) => this.formatVisualResult(await executeGetObservability(args as ObservabilityInput)),
      export_html_report: (args) => this.formatVisualResult(executeExportHtmlReport(args as ExportHtmlInput)),
      add_node: (args) => handleAddNode(this.kg, args),
      upsert_node: (args) => handleUpsertNode(this.kg, args),
      add_nodes_batch: (args) => handleAddNodesBatch(this.kg, args),
      delete_node: (args) => handleDeleteNode(this.kg, args),
      get_node: (args) => handleGetNode(this.kg, args),
      search_graph: (args) => handleSearchGraph(this.kg, args),
      add_edge: (args) => handleAddEdge(this.kg, args),
      add_edges_batch: (args) => handleAddEdgesBatch(this.kg, args),
      trace_path: (args) => handleTracePath(this.kg, args),
      trace_paths: (args) => handleTracePaths(this.kg, args),
      detect_communities: (args) => handleDetectCommunities(this.kg, args),
      get_centrality: (args) => handleGetCentrality(this.kg, args),
      get_impact: (args) => handleGetImpact(this.kg, args),
      what_if_remove: (args) => handleWhatIfRemove(this.kg, args),
      find_orphans: (args) => handleFindOrphans(this.kg, args),
      health_check: () => handleKgHealthCheck(this.kg),
    };
  }

  private async dispatchTool(name: string, args: any): Promise<any> {
    const handlers = this.getHandlers();
    const handler = handlers[name];
    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Ferramenta desconhecida: ${name}`);
    }
    return await handler(args);
  }

  private formatVisualResult(result: any) {
    return {
      output: {
        file_path: result.file_path,
        meta_path: result.meta_path,
        html_path: result.html_path || (result.meta?.files?.html ? path.join(path.dirname(result.file_path), result.meta.files.html) : undefined),
        format: result.format
      },
      metadata: result.meta || undefined,
      preview: result.markdown || undefined
    };
  }

  private getToolDefinitions(): any[] {
    return [
      {
        name: "generate_mindmap",
        description: "Gera mapas mentais otimizados para aulas, estudos e documentação técnica.",
        inputSchema: {
          type: "object",
          properties: {
            central_topic: { type: "string", description: "Tópico central" },
            branches: { type: "array", description: "Ramos principais" }
          },
          required: ["central_topic", "branches"]
        }
      },
      {
        name: "generate_orgchart",
        description: "Gera organogramas hierárquicos com estilização por níveis.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            nodes: { type: "array" }
          },
          required: ["title", "nodes"]
        }
      },
      {
        name: "generate_architecture_diagram",
        description: "Gera diagramas arquiteturais C4 (Context, Container) ou Flowchart.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            components: { type: "array" },
            connections: { type: "array" }
          },
          required: ["title", "components", "connections"]
        }
      },
      {
        name: "generate_flowchart",
        description: "Gera fluxogramas de processos com nós de decisão, banco e filas.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            nodes: { type: "array" },
            transitions: { type: "array" }
          },
          required: ["title", "nodes", "transitions"]
        }
      },
      {
        name: "export_diagram",
        description: "Exporta diagramas para SVG, PNG ou JSON.",
        inputSchema: {
          type: "object",
          properties: {
            diagram_id: { type: "string" },
            format: { type: "string", enum: ["svg", "png", "json"] }
          },
          required: ["diagram_id", "format"]
        }
      },
      {
        name: "scan_codebase_topology",
        description: "Analisa a topologia do repositório e agrupa componentes por camadas.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Caminho do repositório" }
          }
        }
      },
      {
        name: "trace_call_graph",
        description: "Gera grafo de chamadas bidirecional centrado em uma função ou classe.",
        inputSchema: {
          type: "object",
          properties: {
            symbol_name: { type: "string" }
          },
          required: ["symbol_name"]
        }
      },
      {
        name: "trace_execution_flow",
        description: "Gera diagrama de sequência a partir de logs ou spans de execução.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            trace_data: { type: "string" }
          },
          required: ["title", "trace_data"]
        }
      },
      {
        name: "analyze_codebase_overview",
        description: "Raio-X 360 do projeto com mapa mental e métricas consolidadas.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" }
          }
        }
      },
      {
        name: "get_system_observability",
        description: "Métricas do Prometheus e gráficos xychart/quadrant.",
        inputSchema: {
          type: "object",
          properties: {
            generate_chart: { type: "string", enum: ["xychart", "quadrant", "none"] }
          }
        }
      },
      {
        name: "export_html_report",
        description: "Gera relatório HTML autocontido individual ou dashboard 100% offline.",
        inputSchema: {
          type: "object",
          properties: {
            diagram_id: { type: "string" },
            mode: { type: "string", enum: ["single", "dashboard"] }
          }
        }
      },
      // Knowledge Graph Tools
      {
        name: "add_node",
        description: "Adiciona um nó ao Knowledge Graph SQLite.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string", description: "Tipo da entidade (ex: Customer, Service, Class)" },
            name: { type: "string", description: "Nome legível" },
            qualified_name: { type: "string" },
            properties: { type: "object" }
          },
          required: ["label", "name"]
        }
      },
      {
        name: "upsert_node",
        description: "Insere ou atualiza um nó no Knowledge Graph baseado no qualified_name.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string" },
            name: { type: "string" },
            qualified_name: { type: "string" },
            properties: { type: "object" }
          },
          required: ["label", "name"]
        }
      },
      {
        name: "add_nodes_batch",
        description: "Adiciona múltiplos nós em uma única transação SQLite.",
        inputSchema: {
          type: "object",
          properties: {
            nodes: { type: "array" }
          },
          required: ["nodes"]
        }
      },
      {
        name: "delete_node",
        description: "Remove um nó do Knowledge Graph e todas as suas arestas em cascata.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            qualified_name: { type: "string" }
          }
        }
      },
      {
        name: "get_node",
        description: "Consulta um nó específico por ID ou qualified_name.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            qualified_name: { type: "string" }
          }
        }
      },
      {
        name: "search_graph",
        description: "Busca textual Full-Text Search (FTS5) em nós do Knowledge Graph.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Termo de busca" },
            label: { type: "string", description: "Filtro opcional por label" },
            limit: { type: "number" }
          }
        }
      },
      {
        name: "add_edge",
        description: "Cria uma aresta direcionada conectando dois nós no Knowledge Graph.",
        inputSchema: {
          type: "object",
          properties: {
            source_id: { type: "number" },
            target_id: { type: "number" },
            type: { type: "string", description: "Tipo da relação (ex: CALLS, DEPENDS_ON)" },
            weight: { type: "number" }
          },
          required: ["source_id", "target_id", "type"]
        }
      },
      {
        name: "add_edges_batch",
        description: "Adiciona múltiplas arestas em uma única transação.",
        inputSchema: {
          type: "object",
          properties: {
            edges: { type: "array" }
          },
          required: ["edges"]
        }
      },
      {
        name: "trace_path",
        description: "Encontra o menor caminho entre dois nós no grafo.",
        inputSchema: {
          type: "object",
          properties: {
            source_id: { type: "number" },
            target_id: { type: "number" },
            max_depth: { type: "number" }
          },
          required: ["source_id", "target_id"]
        }
      },
      {
        name: "trace_paths",
        description: "Encontra múltiplos caminhos entre dois nós no grafo.",
        inputSchema: {
          type: "object",
          properties: {
            source_id: { type: "number" },
            target_id: { type: "number" },
            max_paths: { type: "number" },
            max_depth: { type: "number" }
          },
          required: ["source_id", "target_id"]
        }
      },
      {
        name: "detect_communities",
        description: "Executa o algoritmo de Louvain para detectar comunidades no grafo.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string" },
            max_iterations: { type: "number" }
          }
        }
      },
      {
        name: "get_centrality",
        description: "Calcula métricas de centralidade (PageRank, Betweenness, Closeness).",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string" },
            limit: { type: "number" }
          }
        }
      },
      {
        name: "get_impact",
        description: "Calcula o Blast Radius (raio de impacto) ao alterar ou remover um nó.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            qualified_name: { type: "string" },
            max_depth: { type: "number" }
          }
        }
      },
      {
        name: "what_if_remove",
        description: "Simula o impacto da remoção de um nó (arestas perdidas e nós isolados).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            qualified_name: { type: "string" }
          }
        }
      },
      {
        name: "find_orphans",
        description: "Identifica nós sem nenhuma aresta de entrada ou saída no grafo.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string" }
          }
        }
      },
      {
        name: "health_check",
        description: "Verifica a integridade do banco SQLite e retorna estatísticas do grafo.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];
  }

  async run() {
    try {
      await startSseServer(3001);
    } catch (err) {
      console.error("[SSE Server Warning] Não foi possível iniciar SSE:", err);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("[MCP Server] ArchView v6.0 unificado rodando em stdio.");
  }
}

const server = new VisualServer();
server.run().catch(console.error);

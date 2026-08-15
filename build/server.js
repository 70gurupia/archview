import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { executeMindmap } from './tools/mindmap.js';
import { executeOrgchart } from './tools/orgchart.js';
import { executeArchitecture } from './tools/architecture.js';
import { executeFlowchart } from './tools/flowchart.js';
import { executeExport } from './tools/export.js';
import { executeScanTopology } from './tools/scan-topology.js';
import { executeTraceCallGraph } from './tools/trace-callgraph.js';
import { executeTraceExecution } from './tools/trace-execution.js';
import { executeAnalyzeOverview } from './tools/analyze-overview.js';
import { executeGetObservability } from './tools/observability.js';
import { startSseServer } from './utils/sse.js';
import { initOpenTelemetry } from './utils/otel.js';
class VisualServer {
    server;
    constructor() {
        initOpenTelemetry();
        this.server = new Server({
            name: "mcp-visual-server",
            version: "4.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "generate_mindmap",
                    description: "Gera mapas mentais otimizados para aulas, estudos e documentação técnica.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            central_topic: { type: "string", description: "Tópico central do mapa mental" },
                            description: { type: "string", description: "Descrição ou contexto opcional" },
                            branches: {
                                type: "array",
                                description: "Ramos principais do mapa mental",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string" },
                                        color: { type: "string" },
                                        sub_branches: { type: "array" },
                                        icons: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["title"]
                                }
                            },
                            style: {
                                type: "object",
                                properties: {
                                    palette: { type: "string", enum: ["educational", "corporate", "minimal", "dark"] },
                                    layout: { type: "string", enum: ["radial", "tree-left", "tree-right"] },
                                    show_icons: { type: "boolean" }
                                }
                            },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        },
                        required: ["central_topic", "branches"]
                    }
                },
                {
                    name: "generate_orgchart",
                    description: "Gera organogramas hierárquicos profissionais com validação de ciclos e níveis.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título do organograma" },
                            description: { type: "string", description: "Descrição opcional da estrutura" },
                            nodes: {
                                type: "array",
                                description: "Membros ou departamentos da hierarquia",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string", description: "ID único do nó (ex: ceo, dev_lead)" },
                                        label: { type: "string", description: "Nome da pessoa ou departamento" },
                                        role: { type: "string", description: "Cargo ou função" },
                                        department: { type: "string", description: "Departamento" },
                                        level: { type: "number", description: "Nível hierárquico (0=C-level, 1=Gerente, 2=Lead, 3=Dev)" },
                                        reports_to: { type: "string", description: "ID do supervisor a quem se reporta" },
                                        metadata: {
                                            type: "object",
                                            properties: {
                                                email: { type: "string" },
                                                team_size: { type: "number" }
                                            }
                                        }
                                    },
                                    required: ["id", "label", "role"]
                                }
                            },
                            style: {
                                type: "object",
                                properties: {
                                    color_by_level: { type: "boolean" },
                                    show_metadata: { type: "boolean" },
                                    layout: { type: "string", enum: ["vertical", "horizontal"] },
                                    palette: { type: "string", enum: ["educational", "corporate", "minimal", "dark"] }
                                }
                            },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        },
                        required: ["title", "nodes"]
                    }
                },
                {
                    name: "generate_architecture_diagram",
                    description: "Gera diagramas de arquitetura de software seguindo o Modelo C4 (C1, C2, C3).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            c4_level: {
                                type: "string",
                                enum: ["C1-context", "C2-container", "C3-component", "C4-code"],
                                description: "Nível do modelo C4"
                            },
                            system_name: { type: "string", description: "Nome do sistema ou container" },
                            description: { type: "string", description: "Descrição do sistema" },
                            elements: {
                                type: "array",
                                description: "Elementos do sistema (atores, containers, componentes)",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: {
                                            type: "string",
                                            enum: ["person", "system", "container", "component", "database", "queue", "external"]
                                        },
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        technology: { type: "string" },
                                        relationships: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    target: { type: "string" },
                                                    description: { type: "string" },
                                                    technology: { type: "string" }
                                                },
                                                required: ["target", "description"]
                                            }
                                        }
                                    },
                                    required: ["id", "type", "name", "description"]
                                }
                            },
                            style: {
                                type: "object",
                                properties: {
                                    show_technology: { type: "boolean" },
                                    palette: { type: "string", enum: ["educational", "corporate", "minimal", "dark"] }
                                }
                            },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        },
                        required: ["c4_level", "system_name", "elements"]
                    }
                },
                {
                    name: "generate_flowchart",
                    description: "Gera fluxogramas, processos e árvores de decisão lógicas.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título do fluxograma" },
                            description: { type: "string", description: "Descrição do fluxo" },
                            steps: {
                                type: "array",
                                description: "Passos e nós do fluxo",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: {
                                            type: "string",
                                            enum: ["start", "end", "process", "decision", "input", "output", "subprocess"]
                                        },
                                        label: { type: "string" },
                                        next: { type: "array", description: "Conexões para outros passos (IDs ou objetos rotulados)" },
                                        details: { type: "string" }
                                    },
                                    required: ["id", "type", "label"]
                                }
                            },
                            style: {
                                type: "object",
                                properties: {
                                    direction: { type: "string", enum: ["TB", "LR", "BT", "RL"] },
                                    palette: { type: "string", enum: ["educational", "corporate", "minimal", "dark"] }
                                }
                            },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        },
                        required: ["title", "steps"]
                    }
                },
                {
                    name: "export_diagram",
                    description: "Exporta diagramas Mermaid para SVG ou PNG em alta resolução.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            source_path: { type: "string", description: "Caminho do arquivo .mmd ou .md na pasta output/" },
                            target_format: { type: "string", enum: ["svg", "png", "pdf"] },
                            target_path: { type: "string" },
                            options: {
                                type: "object",
                                properties: {
                                    width: { type: "number" },
                                    height: { type: "number" },
                                    scale: { type: "number" },
                                    background: { type: "string" },
                                    theme: { type: "string" }
                                }
                            }
                        },
                        required: ["source_path", "target_format"]
                    }
                },
                {
                    name: "scan_codebase_topology",
                    description: "Varre repositórios locais (TypeScript, Python, Go, Java, Rust) e gera um diagrama de topologia C4 com subgrafos de pastas e camadas de software.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "Caminho do diretório raiz do repositório (padrão: diretório atual)" },
                            title: { type: "string", description: "Título do diagrama de topologia" },
                            description: { type: "string", description: "Descrição opcional" },
                            view_mode: { type: "string", enum: ["hybrid", "layered", "folders"], description: "Modo de agrupamento: híbrido (pastas + camadas), camadas puras ou pastas" },
                            direction: { type: "string", enum: ["TD", "LR", "BT", "RL"], description: "Direção do diagrama" },
                            max_depth: { type: "number", description: "Profundidade máxima de diretórios a varrer (padrão: 6)" },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        }
                    }
                },
                {
                    name: "trace_call_graph",
                    description: "Rastreia o grafo de chamadas bidirecional de uma função, método ou classe (quem chama e o que ela chama) com escopo por arquivos.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            symbol_name: { type: "string", description: "Nome da função, método ou classe a rastrear" },
                            path: { type: "string", description: "Caminho do repositório (padrão: diretório atual)" },
                            file_path: { type: "string", description: "Caminho do arquivo específico onde o símbolo reside" },
                            depth: { type: "number", description: "Profundidade da árvore de chamadas (1 a 4, padrão: 2)" },
                            direction: { type: "string", enum: ["LR", "TD", "RL", "BT"], description: "Direção do fluxo (padrão: LR widescreen)" },
                            title: { type: "string", description: "Título do grafo de chamadas" },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        },
                        required: ["symbol_name"]
                    }
                },
                {
                    name: "trace_execution_flow",
                    description: "Ingere traces estruturados (JSON/OpenTelemetry), logs textuais ou stack traces e gera um Diagrama de Sequência Mermaid interativo.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título do fluxo de execução" },
                            description: { type: "string", description: "Descrição do cenário de teste ou requisição" },
                            trace_data: { description: "Array JSON de eventos/spans ou objeto OpenTelemetry" },
                            raw_log: { type: "string", description: "Texto bruto de logs ou stack traces" },
                            log_file_path: { type: "string", description: "Caminho de arquivo local (.log) para leitura" },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        }
                    }
                },
                {
                    name: "analyze_codebase_overview",
                    description: "Gera um Raio-X completo do repositório, combinando mapa mental de módulos, diagrama C4 de topologia e métricas de código.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "Caminho do repositório (padrão: diretório atual)" },
                            title: { type: "string", description: "Título da análise geral" },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        }
                    }
                },
                {
                    name: "get_system_observability",
                    description: "Consulta métricas do Prometheus, estado de saúde do runtime, latência e estatísticas agregadas, com geração opcional de gráficos Mermaid (xychart ou quadrantChart).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            include_prometheus_raw: { type: "boolean", description: "Se true, inclui as métricas brutas em formato texto Prometheus" },
                            generate_chart: { type: "string", enum: ["xychart", "quadrant", "none"], description: "Tipo de gráfico Mermaid a ser gerado" },
                            output_path: { type: "string", description: "Caminho opcional do arquivo de saída" }
                        }
                    }
                }
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                let result;
                const name = request.params.name;
                const args = request.params.arguments;
                switch (name) {
                    case "generate_mindmap":
                        result = executeMindmap(args);
                        break;
                    case "generate_orgchart":
                        result = executeOrgchart(args);
                        break;
                    case "generate_architecture_diagram":
                        result = executeArchitecture(args);
                        break;
                    case "generate_flowchart":
                        result = executeFlowchart(args);
                        break;
                    case "export_diagram":
                        result = await executeExport(args);
                        break;
                    case "scan_codebase_topology":
                        result = executeScanTopology(args);
                        break;
                    case "trace_call_graph":
                        result = executeTraceCallGraph(args);
                        break;
                    case "trace_execution_flow":
                        result = executeTraceExecution(args);
                        break;
                    case "analyze_codebase_overview":
                        result = executeAnalyzeOverview(args);
                        break;
                    case "get_system_observability":
                        result = await executeGetObservability(args);
                        break;
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Ferramenta desconhecida: ${name}`);
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                tool: name,
                                output: {
                                    file_path: result.file_path,
                                    meta_path: result.meta_path,
                                    format: result.format
                                },
                                metadata: result.meta || undefined,
                                preview: result.markdown || undefined
                            }, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                if (error instanceof McpError)
                    throw error;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                tool: request.params.name,
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
    async run() {
        // Inicia o servidor HTTP/SSE na porta 3001 em background
        try {
            await startSseServer(3001);
        }
        catch (err) {
            console.error("[SSE Server Warning] Não foi possível iniciar SSE:", err);
        }
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("[MCP Server] MCP Visual Server v2.0 rodando em stdio.");
    }
}
const server = new VisualServer();
server.run().catch(console.error);

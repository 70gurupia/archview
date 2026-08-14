import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { executeMindmap } from './tools/mindmap.js';
import { executeArchitecture } from './tools/architecture.js';
import { executeFlowchart } from './tools/flowchart.js';
import { executeExport } from './tools/export.js';
class VisualServer {
    server;
    constructor() {
        this.server = new Server({
            name: "mcp-visual-server",
            version: "1.0.0",
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
                    description: "Gera mapas mentais otimizados para aulas e documentação.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            central_topic: { type: "string", description: "Tópico central" },
                            branches: {
                                type: "array",
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
                            style: { type: "object" },
                            output_format: { type: "string" },
                            output_path: { type: "string" }
                        },
                        required: ["central_topic", "branches"]
                    }
                },
                {
                    name: "generate_architecture_diagram",
                    description: "Gera diagramas de arquitetura (C4 Model).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            c4_level: { type: "string", enum: ["C1-context", "C2-container", "C3-component", "C4-code"] },
                            system_name: { type: "string" },
                            description: { type: "string" },
                            elements: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: { type: "string" },
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        technology: { type: "string" },
                                        relationships: { type: "array" }
                                    },
                                    required: ["id", "type", "name", "description"]
                                }
                            },
                            style: { type: "object" },
                            output_format: { type: "string" },
                            output_path: { type: "string" }
                        },
                        required: ["c4_level", "system_name", "description", "elements"]
                    }
                },
                {
                    name: "generate_flowchart",
                    description: "Gera fluxogramas e diagramas de processo.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: { type: "string" },
                                        label: { type: "string" },
                                        next: { type: "array" },
                                        details: { type: "string" }
                                    },
                                    required: ["id", "type", "label"]
                                }
                            },
                            style: { type: "object" },
                            output_format: { type: "string" },
                            output_path: { type: "string" }
                        },
                        required: ["title", "steps"]
                    }
                },
                {
                    name: "export_diagram",
                    description: "Exporta diagramas (markdown/mermaid) para SVG ou PNG usando o Mermaid CLI.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            source_path: { type: "string" },
                            target_format: { type: "string", enum: ["svg", "png", "pdf"] },
                            target_path: { type: "string" },
                            options: { type: "object" }
                        },
                        required: ["source_path", "target_format"]
                    }
                }
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            let result;
            try {
                if (request.params.name === "generate_mindmap") {
                    result = executeMindmap(request.params.arguments);
                }
                else if (request.params.name === "generate_architecture_diagram") {
                    result = executeArchitecture(request.params.arguments);
                }
                else if (request.params.name === "generate_flowchart") {
                    result = executeFlowchart(request.params.arguments);
                }
                else if (request.params.name === "export_diagram") {
                    result = await executeExport(request.params.arguments);
                }
                else {
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                tool: request.params.name,
                                output: {
                                    file_path: result.file_path,
                                    format: result.format
                                },
                                preview: result.markdown
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
                                error: { message: error.message }
                            }, null, 2)
                        }
                    ],
                    isError: true
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Visual MCP server running on stdio");
    }
}
const server = new VisualServer();
server.run().catch(console.error);

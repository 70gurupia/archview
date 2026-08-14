"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class VisualServer {
    server;
    constructor() {
        this.server = new index_js_1.Server({
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
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
            // We will add tools here in the next issues
            ],
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            // Tool routing will go here
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error("Visual MCP server running on stdio");
    }
}
const server = new VisualServer();
server.run().catch(console.error);
//# sourceMappingURL=server.js.map
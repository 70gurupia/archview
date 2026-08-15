import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { assertSafePath } from './meta.js';
import { executeTraceExecution } from '../tools/trace-execution.js';
import { executeScanTopology } from '../tools/scan-topology.js';
import { executeTraceCallGraph } from '../tools/trace-callgraph.js';
import { getMetricsContentType, getMetricsAsText, recordHttpRequest, setSseConnections, getAggregatedStats } from './metrics.js';
let clients = [];
let clientIdCounter = 0;
let httpServer = null;
export function broadcastEvent(eventName, data) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        try {
            client.res.write(payload);
        }
        catch {
            // Ignora erro de socket fechado
        }
    });
}
export function createSseApp() {
    const app = express();
    app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
    // Middleware de medição e telemetria HTTP Prometheus
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const normalizedPath = req.route?.path || req.path;
            recordHttpRequest(req.method, normalizedPath, res.statusCode, duration);
        });
        next();
    });
    // Basic Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: { error: "Too many requests from this IP, please try again after 15 minutes" }
    });
    app.use('/api/', limiter);
    const outDir = path.join(process.cwd(), 'output');
    const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
    // Servir frontend estático compilado se existir
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist));
    }
    // Endpoint Padrão Prometheus (/metrics)
    app.get('/metrics', async (_req, res) => {
        try {
            res.setHeader('Content-Type', getMetricsContentType());
            const metricsText = await getMetricsAsText();
            res.send(metricsText);
        }
        catch (err) {
            res.status(500).send(err.message);
        }
    });
    // SSE Stream Endpoint
    app.get('/events', (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        const clientId = ++clientIdCounter;
        const newClient = { id: clientId, res };
        clients.push(newClient);
        setSseConnections(clients.length);
        res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);
        req.on('close', () => {
            clients = clients.filter(c => c.id !== clientId);
            setSseConnections(clients.length);
        });
    });
    // REST: List All Diagrams
    app.get('/api/diagrams', async (req, res) => {
        try {
            if (!fs.existsSync(outDir)) {
                return res.json([]);
            }
            const files = fs.readdirSync(outDir);
            const metaFiles = files.filter(f => f.endsWith('.meta.json'));
            const diagrams = [];
            for (const metaFile of metaFiles) {
                try {
                    const metaRaw = fs.readFileSync(path.join(outDir, metaFile), 'utf-8');
                    const meta = JSON.parse(metaRaw);
                    const mmdPath = path.join(outDir, meta.files.mermaid);
                    let content = '';
                    if (fs.existsSync(mmdPath)) {
                        content = fs.readFileSync(mmdPath, 'utf-8');
                    }
                    diagrams.push({
                        ...meta,
                        content
                    });
                }
                catch {
                    // Ignora arquivos corrompidos
                }
            }
            // Ordenar mais recentes primeiro
            diagrams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            res.json(diagrams);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // REST: Get Single Diagram by ID
    app.get('/api/diagrams/:id', (req, res) => {
        try {
            const id = String(req.params.id);
            if (!fs.existsSync(outDir)) {
                return res.status(404).json({ error: 'Diagram not found' });
            }
            const files = fs.readdirSync(outDir);
            const metaFile = files.find(f => f.startsWith(`${id}.meta.json`) || f.includes(id));
            if (!metaFile) {
                return res.status(404).json({ error: 'Diagram metadata not found' });
            }
            const metaRaw = fs.readFileSync(path.join(outDir, metaFile), 'utf-8');
            const meta = JSON.parse(metaRaw);
            const mmdPath = path.join(outDir, meta.files.mermaid);
            let content = '';
            if (fs.existsSync(mmdPath)) {
                content = fs.readFileSync(mmdPath, 'utf-8');
            }
            res.json({
                ...meta,
                content
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // REST: Update Diagram Content
    app.put('/api/diagrams/:id', bodyParser.json(), (req, res) => {
        try {
            const id = String(req.params.id);
            const { content } = req.body;
            if (!content || typeof content !== 'string') {
                return res.status(400).json({ error: 'Field "content" is required and must be string' });
            }
            if (!fs.existsSync(outDir)) {
                return res.status(404).json({ error: 'Diagram not found' });
            }
            const files = fs.readdirSync(outDir);
            const metaFile = files.find(f => f.startsWith(`${id}.meta.json`) || f.includes(id));
            if (!metaFile) {
                return res.status(404).json({ error: 'Diagram metadata not found' });
            }
            const metaPath = path.join(outDir, metaFile);
            const metaRaw = fs.readFileSync(metaPath, 'utf-8');
            const meta = JSON.parse(metaRaw);
            assertSafePath(meta.files.mermaid, outDir);
            const mmdPath = path.join(outDir, meta.files.mermaid);
            // Salvar novo conteúdo
            fs.writeFileSync(mmdPath, content, 'utf-8');
            meta.updated_at = new Date().toISOString();
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
            // Notificar clientes via SSE
            broadcastEvent('diagram.updated', {
                id: meta.id,
                updated_at: meta.updated_at
            });
            res.json({ success: true, diagram: { ...meta, content } });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // REST: Observability Stats Aggregated
    app.get('/api/observability/stats', async (_req, res) => {
        try {
            const stats = await getAggregatedStats();
            stats.sse_connections = clients.length;
            res.json(stats);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // REST: Health Check & System Status Enriquecido
    app.get('/api/health', async (_req, res) => {
        const stats = await getAggregatedStats();
        stats.sse_connections = clients.length;
        res.json({
            status: stats.health,
            server: 'archview',
            version: '4.0.0',
            connectedClients: clients.length,
            uptime: process.uptime(),
            memory: stats.memory,
            totalDiagrams: stats.total_diagrams
        });
    });
    // REST: Ingest Execution Trace
    app.post('/api/ingest/trace', bodyParser.json(), (req, res) => {
        try {
            const result = executeTraceExecution(req.body);
            res.status(201).json({
                success: true,
                diagram: result
            });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // REST: Scan Codebase Topology
    app.post('/api/codebase/scan', bodyParser.json(), (req, res) => {
        try {
            const result = executeScanTopology(req.body);
            res.json({
                success: true,
                diagram: result
            });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    // REST: Trace Call Graph
    app.post('/api/codebase/trace-call', bodyParser.json(), (req, res) => {
        try {
            const result = executeTraceCallGraph(req.body);
            res.json({
                success: true,
                diagram: result
            });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    return app;
}
export function startSseServer(port = 3001) {
    return new Promise((resolve, reject) => {
        if (httpServer) {
            return resolve(httpServer);
        }
        const app = createSseApp();
        const server = app.listen(port, () => {
            console.error(`[SSE/REST Server] Rodando na porta ${port} (http://localhost:${port})`);
            httpServer = server;
            resolve(server);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[SSE/REST Server] Porta ${port} em uso, assumindo servidor existente.`);
                resolve(server);
            }
            else {
                reject(err);
            }
        });
    });
}

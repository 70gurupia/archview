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
        res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);
        req.on('close', () => {
            clients = clients.filter(c => c.id !== clientId);
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
                return res.status(404).json({ error: 'Diagram not found' });
            }
            const metaRaw = fs.readFileSync(path.join(outDir, metaFile), 'utf-8');
            const meta = JSON.parse(metaRaw);
            const mmdPath = path.join(outDir, meta.files.mermaid);
            const content = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf-8') : '';
            res.json({ ...meta, content });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // Parse JSON bodies
    app.use(bodyParser.json());
    // REST: Save diagram edits
    app.put('/api/diagrams/:id', (req, res) => {
        try {
            const id = String(req.params.id);
            const { content } = req.body;
            if (!fs.existsSync(outDir)) {
                return res.status(404).json({ error: 'Diagram not found' });
            }
            const files = fs.readdirSync(outDir);
            const metaFile = files.find(f => f.startsWith(`${id}.meta.json`) || f.includes(id));
            if (!metaFile) {
                return res.status(404).json({ error: 'Diagram not found' });
            }
            const metaRaw = fs.readFileSync(path.join(outDir, metaFile), 'utf-8');
            const meta = JSON.parse(metaRaw);
            const mmdFilename = meta.files.mermaid;
            const mmdPath = path.join(outDir, mmdFilename);
            assertSafePath(mmdFilename, outDir);
            // Update modification time
            meta.updated_at = new Date().toISOString();
            fs.writeFileSync(path.join(outDir, metaFile), JSON.stringify(meta, null, 2), 'utf-8');
            // Save content
            fs.writeFileSync(mmdPath, content, 'utf-8');
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // REST: Health Check
    app.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            server: 'archview',
            version: '3.0.0',
            connectedClients: clients.length,
            uptime: process.uptime()
        });
    });
    // REST: Ingest Execution Trace
    app.post('/api/ingest/trace', (req, res) => {
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
    app.post('/api/codebase/scan', (req, res) => {
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
    app.post('/api/codebase/trace-call', (req, res) => {
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

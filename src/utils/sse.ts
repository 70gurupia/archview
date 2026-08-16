import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Server } from 'http';
import { DiagramMeta } from '../types/index.js';
import { assertSafePath } from './meta.js';
import { executeTraceExecution } from '../tools/trace-execution.js';
import { executeScanTopology } from '../tools/scan-topology.js';
import { executeTraceCallGraph } from '../tools/trace-callgraph.js';
import { executeExportHtmlReport } from '../tools/export-html.js';
import { generateStandaloneDiagramHtml } from '../engine/html-generator.js';
import {
  getMetricsContentType,
  getMetricsAsText,
  recordHttpRequest,
  setSseConnections,
  getAggregatedStats
} from './metrics.js';
import { KnowledgeGraphDB } from '../kg/db.js';
import { calculateCentrality, detectLouvainCommunities } from '../kg/algorithms.js';

interface SseClient {
  id: number;
  res: Response;
}

let clients: SseClient[] = [];
let clientIdCounter = 0;
let httpServer: Server | null = null;

export function broadcastEvent(eventName: string, data: any): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      // Ignora erro de socket fechado
    }
  }
}

function registerObservabilityRoutes(app: express.Express): void {
  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', getMetricsContentType());
      res.send(await getMetricsAsText());
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  app.get('/api/observability/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await getAggregatedStats();
      stats.sse_connections = clients.length;
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/health', async (_req: Request, res: Response) => {
    const stats = await getAggregatedStats();
    stats.sse_connections = clients.length;
    res.json({
      status: stats.health,
      server: 'archview',
      version: '6.0.0',
      connectedClients: clients.length,
      uptime: process.uptime(),
      memory: stats.memory,
      totalDiagrams: stats.total_diagrams
    });
  });
}

function registerSseStreamRoute(app: express.Express): void {
  app.get('/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const clientId = ++clientIdCounter;
    clients.push({ id: clientId, res });
    setSseConnections(clients.length);

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
      setSseConnections(clients.length);
    });
  });
}

function registerDiagramListRoute(app: express.Express, outDir: string): void {
  app.get('/api/diagrams', (_req: Request, res: Response) => {
    if (!fs.existsSync(outDir)) return res.json([]);
    const metaFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.meta.json'));
    const diagrams = [];

    for (const metaFile of metaFiles) {
      try {
        const metaRaw = fs.readFileSync(path.join(outDir, metaFile), 'utf-8');
        const meta: DiagramMeta = JSON.parse(metaRaw);
        const mmdPath = path.join(outDir, meta.files.mermaid);
        const content = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf-8') : '';
        diagrams.push({ ...meta, content });
      } catch {
        // Ignora arquivos corrompidos
      }
    }
    diagrams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(diagrams);
  });
}

function findDiagramMetaFile(outDir: string, id: string): string | undefined {
  if (!fs.existsSync(outDir)) return undefined;
  const metaFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.meta.json'));
  let decoded = id;
  try { decoded = decodeURIComponent(id); } catch {}

  const match = metaFiles.find(f => f.includes(id) || f.includes(decoded) || f.replace(/\.meta\.json$/, '') === id || f.replace(/\.meta\.json$/, '') === decoded);
  if (match) return match;

  for (const f of metaFiles) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf-8'));
      if (meta.id === id || meta.id === decoded) return f;
    } catch {}
  }
  return undefined;
}

function registerDiagramItemRoutes(app: express.Express, outDir: string): void {
  app.get('/api/diagrams/:id', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const targetMeta = findDiagramMetaFile(outDir, id);
      if (!targetMeta) return res.status(404).json({ error: 'Diagrama não encontrado' });

      const meta: DiagramMeta = JSON.parse(fs.readFileSync(path.join(outDir, targetMeta), 'utf-8'));
      const mmdPath = path.join(outDir, meta.files.mermaid);
      const content = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf-8') : '';
      res.json({ ...meta, content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/diagrams/:id', bodyParser.json(), (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: 'Campo "content" obrigatório' });

      const targetMeta = findDiagramMetaFile(outDir, id);
      if (!targetMeta) return res.status(404).json({ error: 'Diagrama não encontrado' });

      const metaPath = path.join(outDir, targetMeta);
      const meta: DiagramMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const mmdPath = path.join(outDir, meta.files.mermaid);

      fs.writeFileSync(mmdPath, content, 'utf-8');
      meta.updated_at = new Date().toISOString();
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

      broadcastEvent('diagram.updated', { id: meta.id, updated_at: meta.updated_at });
      res.json({ success: true, diagram: { ...meta, content } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

function registerDiagramHtmlRoutes(app: express.Express, outDir: string): void {
  app.get('/api/diagrams/:id/html', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const metaFile = findDiagramMetaFile(outDir, id);
      if (!metaFile) return res.status(404).send('Diagram metadata not found');

      const meta: DiagramMeta = JSON.parse(fs.readFileSync(path.join(outDir, metaFile), 'utf-8'));
      const mmdPath = path.join(outDir, meta.files.mermaid);
      const code = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf-8') : '';

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(generateStandaloneDiagramHtml(meta, code));
    } catch (err: any) {
      res.status(500).send(`Error generating HTML: ${err.message}`);
    }
  });

  app.get('/api/export/dashboard-html', (_req: Request, res: Response) => {
    try {
      const result = executeExportHtmlReport({ mode: 'dashboard' });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(fs.readFileSync(result.file_path, 'utf-8'));
    } catch (err: any) {
      res.status(500).send(`Error generating Dashboard HTML: ${err.message}`);
    }
  });
}

function registerDiagramRoutes(app: express.Express, outDir: string): void {
  registerDiagramListRoute(app, outDir);
  registerDiagramItemRoutes(app, outDir);
  registerDiagramHtmlRoutes(app, outDir);
}

function registerKgRoutes(app: express.Express): void {
  app.get('/api/kg/graph', (_req: Request, res: Response) => {
    try {
      const kg = new KnowledgeGraphDB();
      const nodes = kg.getAllNodes();
      const edges = kg.getAllEdges();
      const centrality = calculateCentrality(nodes, edges);
      const communities = detectLouvainCommunities(nodes, edges);
      res.json({ nodes, edges, centrality, communities });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/kg/nodes', (req: Request, res: Response) => {
    try {
      const kg = new KnowledgeGraphDB();
      const label = req.query.label ? String(req.query.label) : undefined;
      const nodes = kg.getAllNodes(label);
      res.json({ count: nodes.length, nodes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/kg/edges', (req: Request, res: Response) => {
    try {
      const kg = new KnowledgeGraphDB();
      const type = req.query.type ? String(req.query.type) : undefined;
      const edges = kg.getAllEdges(type);
      res.json({ count: edges.length, edges });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

function registerCodebaseRoutes(app: express.Express): void {
  app.post('/api/ingest/trace', bodyParser.json(), (req: Request, res: Response) => {
    try {
      const result = executeTraceExecution(req.body);
      res.status(201).json({ success: true, diagram: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/codebase/scan', bodyParser.json(), (req: Request, res: Response) => {
    try {
      const result = executeScanTopology(req.body);
      res.json({ success: true, diagram: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/codebase/trace-call', bodyParser.json(), (req: Request, res: Response) => {
    try {
      const result = executeTraceCallGraph(req.body);
      res.json({ success: true, diagram: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
}

export function createSseApp(): express.Express {
  const app = express();
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));

  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const normalizedPath = req.route?.path || req.path;
      recordHttpRequest(req.method, normalizedPath, res.statusCode, duration);
    });
    next();
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });
  app.use('/api/', limiter);

  const outDir = path.join(process.cwd(), 'output');
  const frontendDist = path.join(process.cwd(), 'frontend', 'dist');

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }

  registerObservabilityRoutes(app);
  registerSseStreamRoute(app);
  registerDiagramRoutes(app, outDir);
  registerKgRoutes(app);
  registerCodebaseRoutes(app);

  return app;
}

export function startSseServer(port = 3001): Promise<Server> {
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

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[SSE/REST Server] Porta ${port} em uso, assumindo servidor existente.`);
        resolve(server);
      } else {
        reject(err);
      }
    });
  });
}

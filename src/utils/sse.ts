import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Server } from 'http';
import { DiagramMeta } from '../types/index.js';
import { assertSafePath } from './meta.js';

interface SseClient {
  id: number;
  res: Response;
}

let clients: SseClient[] = [];
let clientIdCounter = 0;
let httpServer: Server | null = null;

export function broadcastEvent(eventName: string, data: any): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // Ignora erro de socket fechado
    }
  });
}

export function createSseApp(): express.Express {
  const app = express();
  app.use(cors());
  const outDir = path.join(process.cwd(), 'output');
  const frontendDist = path.join(process.cwd(), 'frontend', 'dist');

  // Servir frontend estático compilado se existir
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }

  // SSE Stream Endpoint
  app.get('/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const clientId = ++clientIdCounter;
    const newClient: SseClient = { id: clientId, res };
    clients.push(newClient);

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });
  });

  // REST: List All Diagrams
  app.get('/api/diagrams', async (req: Request, res: Response) => {
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
          const meta: DiagramMeta = JSON.parse(metaRaw);
          const mmdPath = path.join(outDir, meta.files.mermaid);
          let content = '';
          if (fs.existsSync(mmdPath)) {
            content = fs.readFileSync(mmdPath, 'utf-8');
          }

          diagrams.push({
            ...meta,
            content
          });
        } catch {
          // Ignora arquivos corrompidos
        }
      }

      // Ordenar mais recentes primeiro
      diagrams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(diagrams);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // REST: Get Single Diagram by ID
  app.get('/api/diagrams/:id', (req: Request, res: Response) => {
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
      const meta: DiagramMeta = JSON.parse(metaRaw);
      const mmdPath = path.join(outDir, meta.files.mermaid);
      const content = fs.existsSync(mmdPath) ? fs.readFileSync(mmdPath, 'utf-8') : '';

      res.json({ ...meta, content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Parse JSON bodies
  app.use(bodyParser.json());

  // REST: Save diagram edits
  app.put('/api/diagrams/:id', (req: Request, res: Response) => {
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
      const meta: DiagramMeta = JSON.parse(metaRaw);

      const mmdFilename = meta.files.mermaid;
      const mmdPath = path.join(outDir, mmdFilename);
      assertSafePath(mmdFilename, outDir);

      // Update modification time
      meta.updated_at = new Date().toISOString();
      fs.writeFileSync(path.join(outDir, metaFile), JSON.stringify(meta, null, 2), 'utf-8');

      // Save content
      fs.writeFileSync(mmdPath, content, 'utf-8');

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // REST: Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      server: 'mcp-visual-server',
      version: '2.0.0',
      connectedClients: clients.length,
      uptime: process.uptime()
    });
  });

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

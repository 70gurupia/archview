import { createServer } from 'http';
import { readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

const PORT = 3000;
const OUTPUT_DIR = join(process.cwd(), 'output');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mmd': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const parsedPath = rawUrl.split('?')[0];

    if (parsedPath === '/' || parsedPath === '/index.html' || parsedPath === '/dashboard') {
      const dashboardPath = join(OUTPUT_DIR, 'archview-dashboard.html');
      if (existsSync(dashboardPath)) {
        const html = await readFile(dashboardPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }

      // Se não houver dashboard compilado, lista os arquivos disponíveis
      const files = existsSync(OUTPUT_DIR) ? await readdir(OUTPUT_DIR) : [];
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      let indexHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ArchView Viewer</title>';
      indexHtml += '<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;}';
      indexHtml += 'a{display:block;padding:12px;margin:8px 0;background:#F0F9FF;border-radius:8px;text-decoration:none;color:#0284C7;font-weight:600;}';
      indexHtml += 'a:hover{background:#E0F2FE;}</style></head><body>';
      indexHtml += '<h1>ArchView v6.0 - Visualizador de Diagramas</h1>';
      for (const f of htmlFiles) {
        indexHtml += `<a href="/${f}">📊 ${f}</a>`;
      }
      indexHtml += '</body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(indexHtml);
    }

    if (parsedPath === '/api/diagrams') {
      if (!existsSync(OUTPUT_DIR)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify([]));
      }

      const files = await readdir(OUTPUT_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      const diagrams = [];

      for (const file of metaFiles) {
        try {
          const metaRaw = await readFile(join(OUTPUT_DIR, file), 'utf-8');
          const meta = JSON.parse(metaRaw);
          const mmdFile = meta.files?.mermaid || file.replace('.meta.json', '.mmd');
          const mmdPath = join(OUTPUT_DIR, mmdFile);
          const content = existsSync(mmdPath) ? await readFile(mmdPath, 'utf-8') : '';
          diagrams.push({ ...meta, content });
        } catch {
          // Ignora arquivos corrompidos
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(diagrams));
    }

    // Servir arquivos estáticos de output
    const safeFilename = basename(parsedPath);
    const targetFilePath = join(OUTPUT_DIR, safeFilename);

    if (existsSync(targetFilePath)) {
      const ext = extname(safeFilename);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileData = await readFile(targetFilePath);
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end(fileData);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - Diagrama não encontrado');
  } catch (error: any) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 - Erro no visualizador: ' + (error?.message || error));
  }
});

server.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`👀 Visualizador ArchView v6.0 rodando em: http://localhost:${PORT}`);
  console.log(`======================================================`);
});

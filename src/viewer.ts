import { createServer } from 'http';
import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';

const PORT = 3000;
const OUTPUT_DIR = join(process.cwd(), 'output');
const PUBLIC_DIR = join(process.cwd(), 'public');

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/' || req.url === '/index.html') {
      const html = await readFile(join(PUBLIC_DIR, 'index.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (req.url === '/api/diagrams') {
      // Lê todos os arquivos .md gerados
      const files = await readdir(OUTPUT_DIR);
      const mdFiles = files.filter(f => extname(f) === '.md');
      
      const diagrams = [];
      for (const file of mdFiles) {
        let content = await readFile(join(OUTPUT_DIR, file), 'utf-8');
        // Remove os blocos de crase do markdown para injetar puro no html
        content = content.replace(/```mermaid\n/g, '').replace(/```/g, '');
        
        diagrams.push({
          name: file.replace('.md', ''),
          content: content
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(diagrams));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`👀 Visualizador de Diagramas rodando em: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

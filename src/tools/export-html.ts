import fs from 'fs';
import path from 'path';
import { assertSafePath } from '../utils/meta.js';
import { generateStandaloneDiagramHtml, generateDashboardHtml } from '../engine/html-generator.js';
import { DiagramMeta } from '../types/index.js';

export interface ExportHtmlInput {
  diagram_id?: string;
  mode?: 'single' | 'dashboard';
  theme?: 'educational' | 'corporate' | 'minimal' | 'dark';
  output_path?: string;
}

export interface ExportHtmlResult {
  file_path: string;
  format: 'html';
  markdown: string;
  total_diagrams?: number;
  diagram_id?: string;
}

function loadAllDiagrams(outDir: string): Array<{ meta: DiagramMeta; code: string }> {
  const files = fs.readdirSync(outDir);
  const metaFiles = files.filter(f => f.endsWith('.meta.json'));
  const diagrams: Array<{ meta: DiagramMeta; code: string }> = [];

  for (const mf of metaFiles) {
    try {
      const metaPath = path.join(outDir, mf);
      const meta: DiagramMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const mmdFilename = meta.files?.mermaid || mf.replace(/\.meta\.json$/, '.mmd');
      const mmdPath = path.join(outDir, mmdFilename);

      if (fs.existsSync(mmdPath)) {
        const code = fs.readFileSync(mmdPath, 'utf-8');
        diagrams.push({ meta, code });
      }
    } catch {
      // Ignora metadados corrompidos
    }
  }
  return diagrams;
}

function exportDashboard(input: ExportHtmlInput, outDir: string): ExportHtmlResult {
  const diagrams = loadAllDiagrams(outDir);
  const dashboardHtml = generateDashboardHtml(diagrams);
  const targetFilename = input.output_path ? path.basename(input.output_path) : 'archview-dashboard.html';
  assertSafePath(targetFilename, outDir);
  const targetPath = path.join(outDir, targetFilename);

  fs.writeFileSync(targetPath, dashboardHtml, 'utf-8');

  return {
    file_path: targetPath,
    format: 'html',
    total_diagrams: diagrams.length,
    markdown: `### 📊 Dashboard Executivo HTML Gerado com Sucesso!\n- **Arquivo:** \`${targetPath}\`\n- **Total de Diagramas Agregados:** ${diagrams.length}\n- **Acesso:** Abra diretamente no seu navegador para navegação offline.`
  };
}

function findTargetMetaFile(outDir: string, diagramId?: string): string {
  const files = fs.readdirSync(outDir);
  const metaFiles = files.filter(f => f.endsWith('.meta.json'));

  if (diagramId) {
    const directMatch = metaFiles.find(f => f.includes(diagramId));
    if (directMatch) return directMatch;
  }

  if (metaFiles.length > 0) {
    return metaFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(outDir, a));
      const statB = fs.statSync(path.join(outDir, b));
      return statB.mtimeMs - statA.mtimeMs;
    })[0];
  }

  throw new Error('Nenhum diagrama encontrado para exportação em HTML.');
}

function exportSingleDiagram(input: ExportHtmlInput, outDir: string): ExportHtmlResult {
  const targetMetaFile = findTargetMetaFile(outDir, input.diagram_id);
  const metaPath = path.join(outDir, targetMetaFile);
  const meta: DiagramMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  if (input.theme) {
    meta.style.suggested_theme = input.theme;
  }

  const mmdFilename = meta.files?.mermaid || targetMetaFile.replace(/\.meta\.json$/, '.mmd');
  const mmdPath = path.join(outDir, mmdFilename);

  if (!fs.existsSync(mmdPath)) {
    throw new Error(`Arquivo de código Mermaid não encontrado: ${mmdFilename}`);
  }

  const code = fs.readFileSync(mmdPath, 'utf-8');
  const standaloneHtml = generateStandaloneDiagramHtml(meta, code);

  const targetFilename = input.output_path ? path.basename(input.output_path) : targetMetaFile.replace(/\.meta\.json$/, '.html');
  assertSafePath(targetFilename, outDir);
  const targetPath = path.join(outDir, targetFilename);

  fs.writeFileSync(targetPath, standaloneHtml, 'utf-8');

  return {
    file_path: targetPath,
    format: 'html',
    diagram_id: meta.id,
    markdown: `### 🌐 Diagrama HTML Autocontido Gerado!\n- **Título:** ${meta.title}\n- **Arquivo:** \`${targetPath}\`\n- **Tema:** ${meta.style.suggested_theme}\n- **Acesso:** Abra diretamente no navegador com duplo clique (100% offline).`
  };
}

export function executeExportHtmlReport(input: ExportHtmlInput = {}): ExportHtmlResult {
  const outDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (input.output_path) {
    assertSafePath(input.output_path, outDir);
  }

  const mode = input.mode || (input.diagram_id ? 'single' : 'dashboard');
  if (mode === 'dashboard') {
    return exportDashboard(input, outDir);
  }
  return exportSingleDiagram(input, outDir);
}

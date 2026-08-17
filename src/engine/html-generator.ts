import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiagramMeta } from '../types/index.js';
import { STANDALONE_HTML_TEMPLATE, DASHBOARD_HTML_TEMPLATE } from './html-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedMermaidBundle: string | null = null;

export function getMermaidBundle(): string {
  if (cachedMermaidBundle) {
    return cachedMermaidBundle;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'frontend/node_modules/mermaid/dist/mermaid.min.js'),
    path.resolve(process.cwd(), 'node_modules/mermaid/dist/mermaid.min.js'),
    path.resolve(__dirname, '../../frontend/node_modules/mermaid/dist/mermaid.min.js'),
    path.resolve(__dirname, '../node_modules/mermaid/dist/mermaid.min.js')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        let raw = fs.readFileSync(p, 'utf-8');
        // Corrige bug do esbuild em módulos estritos garantindo que globalThis.__esbuild_esm_mermaid_nm exista
        if (raw.includes('var __esbuild_esm_mermaid_nm;')) {
          raw = raw.replace(
            'var __esbuild_esm_mermaid_nm;',
            'var __esbuild_esm_mermaid_nm = globalThis.__esbuild_esm_mermaid_nm = globalThis.__esbuild_esm_mermaid_nm || {};'
          );
        }
        cachedMermaidBundle = raw;
        return cachedMermaidBundle;
      } catch {
        // Continue fallback
      }
    }
  }

  return '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Gera um arquivo HTML autocontido e interativo para um único diagrama.
 */
export function generateStandaloneDiagramHtml(meta: DiagramMeta, mermaidCode: string): string {
  const title = escapeHtml(meta.title || 'Diagrama ArchView');
  const description = escapeHtml(meta.description || 'Visualização interativa offline gerada pelo ArchView');
  const cleanCode = mermaidCode.trim().replace(/<\/script>/gi, '<\\/script>');
  const jsonMeta = JSON.stringify(meta, null, 2).replace(/<\/script>/gi, '<\\/script>');
  const bundle = getMermaidBundle();
  const scriptTag = bundle
    ? `<script>\n${bundle}\n</script>`
    : `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>`;

  return STANDALONE_HTML_TEMPLATE
    .replace(/__TITLE__/g, () => title)
    .replace(/__DESCRIPTION__/g, () => description)
    .replace(/__THEME__/g, () => meta.style?.suggested_theme || 'educational')
    .replace(/__CLEAN_CODE__/g, () => cleanCode)
    .replace(/__JSON_META__/g, () => jsonMeta)
    .replace(/__SCRIPT_TAG__/g, () => scriptTag);
}

/**
 * Gera um Dashboard Executivo Consolidado contendo todos os diagramas em uma única página navegável offline.
 */
export function generateDashboardHtml(diagrams: Array<{ meta: DiagramMeta; code: string }>): string {
  const jsonDiagrams = JSON.stringify(diagrams).replace(/<\/script>/gi, '<\\/script>');
  const bundle = getMermaidBundle();
  const scriptTag = bundle
    ? `<script>\n${bundle}\n</script>`
    : `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>`;

  return DASHBOARD_HTML_TEMPLATE
    .replace(/__JSON_DIAGRAMS__/g, () => jsonDiagrams)
    .replace(/__SCRIPT_TAG__/g, () => scriptTag);
}

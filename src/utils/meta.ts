
export function escapeMermaidHTML(input: string): string {
  if (!input) return input;
  // Basic escaping to prevent XSS payloads in mermaid syntax
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/on\w+=\S+/gi, '')
    .replace(/javascript:/gi, '');
}
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DiagramMeta, DiagramType, ToolExecutionResult } from '../types/index.js';
import { broadcastEvent } from './sse.js';

export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40) || 'diagram';
}

export function generateId(type: DiagramType, title: string): { id: string, baseFilename: string } {
  const slug = sanitizeSlug(title);
  const shortId = crypto.randomBytes(3).toString('hex');
  const baseFilename = `${type}-${slug}-${shortId}`;
  return { id: baseFilename, baseFilename };
}

export function assertSafePath(targetPath: string, outDir: string): void {
  const normalized = targetPath.replace(/\\/g, '/');
  if (normalized.includes('..') || /\.{2,}/.test(normalized)) {
    throw new Error(`Path traversal attempt detected. Multi-dot sequences are not allowed.`);
  }
  const resolved = path.resolve(outDir, normalized);
  if (!resolved.startsWith(outDir) || resolved === outDir) {
    throw new Error(`Path traversal attempt detected. Target must stay within output directory.`);
  }
}

export interface SaveDiagramOptions {
  type: DiagramType;
  title: string;
  description?: string;
  mermaidSyntax: string;
  suggestedTheme?: 'educational' | 'corporate' | 'minimal' | 'dark';
  nodeCount: number;
  maxDepth?: number;
  startTime: number;
  tags?: string[];
  outputPath?: string;
}

export function saveDiagramWithMeta(options: SaveDiagramOptions): ToolExecutionResult {
  const outDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (options.outputPath) {
    assertSafePath(options.outputPath, outDir);
  }

  const { id, baseFilename } = generateId(options.type, options.title);
  const mmdFilename = options.outputPath ? path.basename(options.outputPath, path.extname(options.outputPath)) + '.mmd' : `${baseFilename}.mmd`;
  const metaFilename = mmdFilename.replace(/\.mmd$/, '.meta.json');

  assertSafePath(mmdFilename, outDir);
  assertSafePath(metaFilename, outDir);

  const mmdPath = path.join(outDir, mmdFilename);
  const metaPath = path.join(outDir, metaFilename);

  // Write .mmd file (raw mermaid code)
  const sanitizedSyntax = escapeMermaidHTML(options.mermaidSyntax);
  fs.writeFileSync(mmdPath, sanitizedSyntax, 'utf-8');

  // Build meta object
  const now = new Date().toISOString();
  const meta: DiagramMeta = {
    schema_version: '2.0',
    id: id,
    type: options.type,
    title: options.title,
    description: options.description || '',
    source: 'claude-mcp',
    created_at: now,
    updated_at: now,
    files: {
      mermaid: mmdFilename,
      meta: metaFilename,
      svg: null,
      png: null
    },
    style: {
      suggested_theme: options.suggestedTheme || 'educational',
      applied_theme: null
    },
    stats: {
      node_count: options.nodeCount,
      max_depth: options.maxDepth,
      generation_time_ms: Date.now() - options.startTime
    },
    tags: options.tags || [options.type]
  };

  // Write meta.json
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  // Broadcast event to connected frontend clients via SSE
  broadcastEvent('diagram.created', {
    id: meta.id,
    type: meta.type,
    title: meta.title,
    created_at: meta.created_at,
    files: meta.files,
    style: meta.style
  });

  const markdown = `\`\`\`mermaid\n${options.mermaidSyntax}\n\`\`\``;

  return {
    file_path: mmdPath,
    meta_path: metaPath,
    format: 'mermaid',
    markdown,
    meta
  };
}

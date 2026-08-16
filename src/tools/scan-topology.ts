import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { CodebaseTopology, ParsedFile } from '../engine/types.js';
import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta, getDesignSystemClassDefs, getNodeClass } from '../utils/meta.js';

export interface ScanTopologyInput {
  path?: string;
  title?: string;
  description?: string;
  view_mode?: 'hybrid' | 'layered' | 'folders';
  direction?: 'TD' | 'LR';
  max_depth?: number;
  output_path?: string;
}

const LAYER_TITLES: Record<string, string> = {
  controller: '🎮 Controladores e Rotas',
  service: '⚙️ Serviços e Regras de Negócio',
  repository: '💾 Persistência e Banco de Dados',
  model: '💾 Persistência e Banco de Dados',
  middleware: '🛡️ Middlewares e Segurança',
  client: '📡 Clientes e Integrações',
  util: '🔧 Utilitários e Configurações',
  config: '🔧 Utilitários e Configurações'
};

const LAYER_ICONS: Record<string, string> = {
  controller: '🎮',
  service: '⚙️',
  repository: '💾',
  model: '📦',
  middleware: '🛡️',
  client: '📡',
  util: '🔧',
  config: '⚙️'
};

function getLayerIcon(layer?: string): string {
  return LAYER_ICONS[layer || 'other'] || '📄';
}

function sanitizeId(relPath: string): string {
  return 'file_' + relPath.replace(/[^a-zA-Z0-9_]/g, '_');
}

function renderTopologyFile(f: ParsedFile, indent = '    '): string {
  const id = sanitizeId(f.relativePath);
  const name = path.basename(f.relativePath);
  const isRepo = f.layer === 'repository';
  const isCtrl = f.layer === 'controller';
  const shape = isRepo ? '[(' : (isCtrl ? '([' : '[');
  const close = isRepo ? ')]' : (isCtrl ? '])' : ']');
  const icon = getLayerIcon(f.layer);
  return `${indent}${id}${shape}"<b>${icon} ${name}</b><br/><i>${f.language} • ${f.linesOfCode} loc</i>"${close}\n`;
}

function generateLayeredTopology(topology: CodebaseTopology, direction: string): string {
  let mermaid = `flowchart ${direction}\n`;
  const layerGroups: Record<string, ParsedFile[]> = {};

  for (const f of topology.files) {
    const title = LAYER_TITLES[f.layer || 'other'] || '📁 Outros Componentes';
    if (!layerGroups[title]) layerGroups[title] = [];
    layerGroups[title].push(f);
  }

  let groupIdx = 0;
  for (const [layerName, files] of Object.entries(layerGroups)) {
    if (files.length === 0) continue;
    groupIdx++;
    mermaid += `  subgraph sg_${groupIdx}[" ${layerName} "]\n`;
    for (const f of files) {
      mermaid += renderTopologyFile(f, '    ');
    }
    mermaid += `  end\n\n`;
  }
  return mermaid;
}

function generateDirectoryTopology(topology: CodebaseTopology, direction: string): string {
  let mermaid = `flowchart ${direction}\n`;
  const dirGroups: Record<string, ParsedFile[]> = {};

  for (const f of topology.files) {
    const dir = path.dirname(f.relativePath) || 'raiz';
    if (!dirGroups[dir]) dirGroups[dir] = [];
    dirGroups[dir].push(f);
  }

  let groupIdx = 0;
  for (const [dirName, files] of Object.entries(dirGroups)) {
    groupIdx++;
    mermaid += `  subgraph sg_${groupIdx}[" 📁 ${dirName} "]\n`;
    for (const f of files) {
      mermaid += renderTopologyFile(f, '    ');
    }
    mermaid += `  end\n\n`;
  }
  return mermaid;
}

export function generateTopologyMermaid(topology: CodebaseTopology, viewMode = 'hybrid', direction = 'TD'): string {
  let mermaid = viewMode === 'layered'
    ? generateLayeredTopology(topology, direction)
    : generateDirectoryTopology(topology, direction);

  const connectedPairs = new Set<string>();
  for (const call of topology.crossModuleCalls) {
    const fromId = sanitizeId(call.fromFile);
    const toId = sanitizeId(call.toFile);
    if (fromId === toId) continue;

    const pairKey = `${fromId}->${toId}`;
    if (!connectedPairs.has(pairKey)) {
      connectedPairs.add(pairKey);
      mermaid += `  ${fromId} -->|"${call.toSymbol}"| ${toId}\n`;
    }
  }

  mermaid += getDesignSystemClassDefs();
  for (const f of topology.files) {
    const id = sanitizeId(f.relativePath);
    const cls = getNodeClass(f.layer || 'other');
    if (cls !== 'default') {
      mermaid += `  class ${id} ${cls};\n`;
    }
  }

  return mermaid;
}

export function executeScanTopology(input: ScanTopologyInput): ToolExecutionResult {
  const startTime = Date.now();
  const targetPath = input.path ? path.resolve(process.cwd(), input.path) : process.cwd();
  const title = input.title || `Topologia: ${path.basename(targetPath)}`;

  const topology = scanCodebase(targetPath, {
    maxDepth: input.max_depth || 5
  });

  const mermaidSyntax = generateTopologyMermaid(topology, input.view_mode || 'hybrid', input.direction || 'TD');

  return saveDiagramWithMeta({
    type: 'architecture',
    title,
    description: input.description || `Varredura de topologia de ${topology.totalFiles} arquivos e ${topology.totalLinesOfCode} linhas de código.`,
    mermaidSyntax,
    suggestedTheme: 'corporate',
    nodeCount: topology.totalFiles,
    startTime,
    tags: ['codebase', 'topology', 'c4', 'architecture', 'scanner'],
    outputPath: input.output_path,
    targetDir: targetPath
  });
}

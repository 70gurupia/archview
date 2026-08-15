import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { CodebaseTopology } from '../engine/types.js';
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

export function generateTopologyMermaid(topology: CodebaseTopology, viewMode: string = 'hybrid', direction: string = 'TD'): string {
  let mermaid = `flowchart ${direction}\n`;

  if (viewMode === 'layered') {
    // 1. Group by Architectural Layer
    const layerGroups: { [layer: string]: typeof topology.files } = {
      '🎮 Controladores e Rotas': [],
      '⚙️ Serviços e Regras de Negócio': [],
      '💾 Persistência e Banco de Dados': [],
      '🛡️ Middlewares e Segurança': [],
      '📡 Clientes e Integrações': [],
      '🔧 Utilitários e Configurações': [],
      '📁 Outros Componentes': []
    };

    topology.files.forEach(f => {
      if (f.layer === 'controller') layerGroups['🎮 Controladores e Rotas'].push(f);
      else if (f.layer === 'service') layerGroups['⚙️ Serviços e Regras de Negócio'].push(f);
      else if (f.layer === 'repository' || f.layer === 'model') layerGroups['💾 Persistência e Banco de Dados'].push(f);
      else if (f.layer === 'middleware') layerGroups['🛡️ Middlewares e Segurança'].push(f);
      else if (f.layer === 'client') layerGroups['📡 Clientes e Integrações'].push(f);
      else if (f.layer === 'util' || f.layer === 'config') layerGroups['🔧 Utilitários e Configurações'].push(f);
      else layerGroups['📁 Outros Componentes'].push(f);
    });

    let groupIdx = 0;
    Object.entries(layerGroups).forEach(([layerName, files]) => {
      if (files.length === 0) return;
      groupIdx++;
      mermaid += `  subgraph sg_${groupIdx}[" ${layerName} "]\n`;
      files.forEach(f => {
        const id = sanitizeId(f.relativePath);
        const name = path.basename(f.relativePath);
        const shape = f.layer === 'repository' ? '[(' : (f.layer === 'controller' ? '([' : '[');
        const close = f.layer === 'repository' ? ')]' : (f.layer === 'controller' ? '])' : ']');
        const icon = getLayerIcon(f.layer);
        mermaid += `    ${id}${shape}"<b>${icon} ${name}</b><br/><i>${f.language} • ${f.linesOfCode} loc</i>"${close}\n`;
      });
      mermaid += `  end\n\n`;
    });
  } else {
    // 2. Hybrid / Folders View: Group by Directory
    const dirGroups: { [dir: string]: typeof topology.files } = {};

    topology.files.forEach(f => {
      const dir = path.dirname(f.relativePath) || 'raiz';
      if (!dirGroups[dir]) dirGroups[dir] = [];
      dirGroups[dir].push(f);
    });

    let groupIdx = 0;
    Object.entries(dirGroups).forEach(([dirName, files]) => {
      groupIdx++;
      mermaid += `  subgraph sg_${groupIdx}[" 📁 ${dirName} "]\n`;
      files.forEach(f => {
        const id = sanitizeId(f.relativePath);
        const name = path.basename(f.relativePath);
        const shape = f.layer === 'repository' ? '[(' : (f.layer === 'controller' ? '([' : '[');
        const close = f.layer === 'repository' ? ')]' : (f.layer === 'controller' ? '])' : ']');
        const icon = getLayerIcon(f.layer);
        mermaid += `    ${id}${shape}"<b>${icon} ${name}</b><br/><i>${f.language} • ${f.linesOfCode} loc</i>"${close}\n`;
      });
      mermaid += `  end\n\n`;
    });
  }

  // Define cross-module connections
  const connectedPairs = new Set<string>();
  topology.crossModuleCalls.forEach(call => {
    const fromId = sanitizeId(call.fromFile);
    const toId = sanitizeId(call.toFile);
    if (fromId === toId) return;

    const pairKey = `${fromId}->${toId}`;
    if (!connectedPairs.has(pairKey)) {
      connectedPairs.add(pairKey);
      mermaid += `  ${fromId} -->|"${call.toSymbol}"| ${toId}\n`;
    }
  });

  // Apply Design System ClassDefs & Node styling
  mermaid += getDesignSystemClassDefs();
  topology.files.forEach(f => {
    const id = sanitizeId(f.relativePath);
    const cls = getNodeClass(f.layer || 'other');
    if (cls !== 'default') {
      mermaid += `  class ${id} ${cls};\n`;
    }
  });

  return mermaid;
}

export function executeScanTopology(input: ScanTopologyInput): ToolExecutionResult {
  const startTime = Date.now();
  const targetDir = input.path || process.cwd();
  const topology = scanCodebase(targetDir, { maxDepth: input.max_depth || 6 });

  const title = input.title || `Topologia: ${topology.projectName}`;
  const viewMode = input.view_mode || 'hybrid';
  const direction = input.direction || 'TD';
  const mermaidSyntax = generateTopologyMermaid(topology, viewMode, direction);

  const frameworksStr = topology.frameworks.length > 0 ? ` [${topology.frameworks.join(', ')}]` : '';
  const description = input.description || `Mapeamento de ${topology.totalFiles} arquivos e ${topology.totalLinesOfCode} linhas de código${frameworksStr}`;

  return saveDiagramWithMeta({
    type: 'architecture',
    title,
    description,
    mermaidSyntax,
    suggestedTheme: 'corporate',
    nodeCount: topology.totalFiles,
    startTime,
    tags: ['codebase', 'topology', 'c4', 'arquitetura', ...topology.frameworks.map(f => f.toLowerCase())],
    outputPath: input.output_path
  });
}

function sanitizeId(relPath: string): string {
  return relPath.replace(/[^A-Za-z0-9_]/g, '_');
}

function getLayerIcon(layer?: string): string {
  switch (layer) {
    case 'controller': return '🎮';
    case 'service': return '⚙️';
    case 'repository': return '💾';
    case 'model': return '📦';
    case 'client': return '📡';
    case 'middleware': return '🛡️';
    case 'util': return '🔧';
    case 'config': return '⚙️';
    default: return '📄';
  }
}

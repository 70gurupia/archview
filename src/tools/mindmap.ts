import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta } from '../utils/meta.js';

export interface MindmapBranch {
  title: string;
  color?: string;
  sub_branches?: (string | MindmapBranch)[];
  icons?: string[];
}

export interface MindmapInput {
  central_topic: string;
  description?: string;
  branches: MindmapBranch[];
  style?: {
    palette?: 'educational' | 'corporate' | 'minimal' | 'dark';
    layout?: 'radial' | 'tree-left' | 'tree-right';
    font_family?: string;
    show_icons?: boolean;
  };
  output_path?: string;
}

export function generateMindmapMermaid(input: MindmapInput): { syntax: string, nodeCount: number, maxDepth: number } {
  let mermaid = `mindmap\n`;
  mermaid += `  root(("${input.central_topic}"))\n`;

  let totalNodes = 1;
  let maxBranchDepth = 1;

  const processBranch = (branch: MindmapBranch | string, depth: number) => {
    totalNodes++;
    if (depth > maxBranchDepth) maxBranchDepth = depth;
    const indent = '  '.repeat(depth + 1);

    if (typeof branch === 'string') {
      mermaid += `${indent}${branch}\n`;
    } else {
      let nodeText = branch.title;
      if (input.style?.show_icons !== false && branch.icons && branch.icons.length > 0) {
        nodeText = `${branch.icons.join(' ')} ${nodeText}`;
      }
      mermaid += `${indent}("${nodeText}")\n`;
      if (branch.sub_branches && branch.sub_branches.length > 0) {
        branch.sub_branches.forEach(sub => processBranch(sub, depth + 1));
      }
    }
  };

  input.branches.forEach(branch => processBranch(branch, 1));
  return { syntax: mermaid, nodeCount: totalNodes, maxDepth: maxBranchDepth };
}

export function executeMindmap(input: MindmapInput): ToolExecutionResult {
  const startTime = Date.now();

  if (!input.central_topic || !input.branches || input.branches.length === 0) {
    throw new Error('Validação: "central_topic" e ao menos um ramo em "branches" são obrigatórios.');
  }

  const { syntax, nodeCount, maxDepth } = generateMindmapMermaid(input);

  return saveDiagramWithMeta({
    type: 'mindmap',
    title: input.central_topic,
    description: input.description,
    mermaidSyntax: syntax,
    suggestedTheme: input.style?.palette || 'educational',
    nodeCount,
    maxDepth,
    startTime,
    tags: ['mapa-mental', 'educacional', 'resumo'],
    outputPath: input.output_path
  });
}

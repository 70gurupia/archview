import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta } from '../utils/meta.js';

export interface OrgchartNode {
  id: string;
  label: string;
  role: string;
  department?: string;
  level?: number;
  reports_to?: string | null;
  metadata?: {
    email?: string;
    team_size?: number;
  };
}

export interface OrgchartInput {
  title: string;
  description?: string;
  nodes: OrgchartNode[];
  style?: {
    color_by_level?: boolean;
    show_metadata?: boolean;
    layout?: 'vertical' | 'horizontal';
    palette?: 'educational' | 'corporate' | 'minimal' | 'dark';
  };
  output_path?: string;
}

export function detectCycle(nodes: OrgchartNode[]): boolean {
  const nodeMap = new Map<string, string | null>();
  nodes.forEach(n => nodeMap.set(n.id, n.reports_to || null));

  for (const node of nodes) {
    const visited = new Set<string>();
    let current: string | null | undefined = node.id;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = nodeMap.get(current);
    }
  }
  return false;
}

export function generateOrgchartMermaid(input: OrgchartInput): string {
  const direction = input.style?.layout === 'horizontal' ? 'LR' : 'TD';
  let mermaid = `graph ${direction}\n`;

  // Render nodes with structured HTML content
  input.nodes.forEach(node => {
    let cardContent = `<b>${node.label}</b><br/>${node.role}`;
    if (node.department) {
      cardContent += `<br/><i>${node.department}</i>`;
    }
    if (input.style?.show_metadata && node.metadata?.team_size) {
      cardContent += `<br/><small>Equipe: ${node.metadata.team_size} pessoas</small>`;
    }
    mermaid += `  ${node.id}["${cardContent}"]\n`;
  });

  // Render hierarchy connections
  input.nodes.forEach(node => {
    if (node.reports_to) {
      mermaid += `  ${node.reports_to} --> ${node.id}\n`;
    }
  });

  // Level-based styling classes
  mermaid += `\n  classDef default fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#1E293B,rx:6px,ry:6px;\n`;
  mermaid += `  classDef lvl0 fill:#1E40AF,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;\n`;
  mermaid += `  classDef lvl1 fill:#2563EB,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:6px,ry:6px;\n`;
  mermaid += `  classDef lvl2 fill:#DBEAFE,stroke:#60A5FA,stroke-width:1.5px,color:#1E40AF,rx:6px,ry:6px;\n`;
  mermaid += `  classDef lvl3 fill:#F1F5F9,stroke:#94A3B8,stroke-width:1.5px,color:#334155,rx:4px,ry:4px;\n`;

  // Apply classes to nodes based on level
  input.nodes.forEach(node => {
    const lvl = typeof node.level === 'number' ? Math.min(Math.max(node.level, 0), 3) : 2;
    mermaid += `  class ${node.id} lvl${lvl};\n`;
  });

  return mermaid;
}

export function executeOrgchart(input: OrgchartInput): ToolExecutionResult {
  const startTime = Date.now();

  if (!input.title || !input.nodes || input.nodes.length === 0) {
    throw new Error('Validação: "title" e ao menos um nó em "nodes" são obrigatórios.');
  }

  if (detectCycle(input.nodes)) {
    throw new Error('Validação de Hierarquia: Ciclo detectado nos nós do organograma.');
  }

  const mermaidSyntax = generateOrgchartMermaid(input);
  const maxLevel = Math.max(...input.nodes.map(n => n.level ?? 0), 0);

  return saveDiagramWithMeta({
    type: 'orgchart',
    title: input.title,
    description: input.description,
    mermaidSyntax,
    suggestedTheme: input.style?.palette || 'corporate',
    nodeCount: input.nodes.length,
    maxDepth: maxLevel + 1,
    startTime,
    tags: ['organograma', 'hierarquia', 'equipe'],
    outputPath: input.output_path
  });
}

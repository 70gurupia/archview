import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta, getSemanticIcon, getDesignSystemClassDefs, getNodeClass } from '../utils/meta.js';

export interface C4Relationship {
  target: string;
  description: string;
  technology?: string;
}

export interface C4Element {
  id: string;
  type: 'person' | 'system' | 'container' | 'component' | 'database' | 'queue' | 'external';
  name: string;
  description: string;
  technology?: string;
  group?: string;
  relationships?: C4Relationship[];
}

export interface ArchitectureInput {
  c4_level: 'C1-context' | 'C2-container' | 'C3-component' | 'C4-code';
  system_name: string;
  description?: string;
  elements: C4Element[];
  style?: {
    notation?: string;
    show_technology?: boolean;
    direction?: string;
    palette?: 'educational' | 'corporate' | 'minimal' | 'dark';
  };
  output_path?: string;
}

const ELEMENT_SHAPES: Record<string, [string, string]> = {
  person: ['([', '])'],
  database: ['[(', ')]'],
  queue: ['[[', ']]'],
  external: ['[/', '/]'],
  system: ['[', ']'],
  container: ['[', ']'],
  component: ['[', ']']
};

function renderFlowchartElement(el: C4Element, indent = '  '): string {
  const [open, close] = ELEMENT_SHAPES[el.type] || ['[', ']'];
  const tech = el.technology ? `<br/><i>${el.technology}</i>` : '';
  const icon = getSemanticIcon(el.type, el.name);
  return `${indent}${el.id}${open}"<b>${icon}${el.name}</b>${tech}<br/>${el.description}"${close}\n`;
}

function renderFlowchartRelationships(elements: C4Element[]): string {
  let mermaid = '';
  for (const el of elements) {
    for (const rel of (el.relationships || [])) {
      const targetEl = elements.find(e => e.id === rel.target);
      const isAsync = targetEl?.type === 'queue' || /event|queue|stream|sse|async|kafka|rabbit/i.test(rel.technology || '') || /event|ass[ií]ncrono|fila|stream/i.test(rel.description || '');
      const tech = rel.technology ? ` [${rel.technology}]` : '';
      const arrow = isAsync ? '-.->' : '-->';
      mermaid += `  ${el.id} ${arrow}|"${rel.description}${tech}"| ${rel.target}\n`;
    }
  }
  return mermaid;
}

function renderFlowchartNotation(input: ArchitectureInput): string {
  const dir = input.style?.direction || 'TD';
  let mermaid = `flowchart ${dir}\n`;

  const groups: Record<string, C4Element[]> = {};
  const ungrouped: C4Element[] = [];

  for (const el of input.elements) {
    if (el.group) {
      if (!groups[el.group]) groups[el.group] = [];
      groups[el.group].push(el);
    } else {
      ungrouped.push(el);
    }
  }

  let groupIdx = 0;
  for (const [groupName, elements] of Object.entries(groups)) {
    groupIdx++;
    mermaid += `  subgraph sg_${groupIdx}[" ${groupName} "]\n`;
    for (const el of elements) {
      mermaid += renderFlowchartElement(el, '    ');
    }
    mermaid += `  end\n\n`;
  }

  for (const el of ungrouped) {
    mermaid += renderFlowchartElement(el, '  ');
  }

  mermaid += renderFlowchartRelationships(input.elements);
  mermaid += getDesignSystemClassDefs();

  for (const el of input.elements) {
    const cls = getNodeClass(el.type);
    if (cls !== 'default') {
      mermaid += `  class ${el.id} ${cls};\n`;
    }
  }

  return mermaid;
}

const C4_TYPE_MACROS: Record<string, string> = {
  person: 'Person',
  system: 'System',
  container: 'Container',
  component: 'Component',
  database: 'ContainerDb',
  queue: 'ContainerQueue',
  external: 'System_Ext'
};

function renderC4Element(el: C4Element): string {
  const macro = C4_TYPE_MACROS[el.type] || 'Component';
  if (el.type === 'person' || el.type === 'system' || el.type === 'external') {
    return `  ${macro}(${el.id}, "${el.name}", "${el.description}")\n`;
  }
  return `  ${macro}(${el.id}, "${el.name}", "${el.technology || el.type}", "${el.description}")\n`;
}

function renderC4Notation(input: ArchitectureInput): string {
  let header = 'C4Context';
  if (input.c4_level === 'C2-container') header = 'C4Container';
  if (input.c4_level === 'C3-component') header = 'C4Component';

  let mermaid = `${header}\n  title ${input.system_name}\n`;

  for (const el of input.elements) {
    mermaid += renderC4Element(el);
  }

  for (const el of input.elements) {
    for (const rel of (el.relationships || [])) {
      if (rel.technology && input.style?.show_technology !== false) {
        mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}", "${rel.technology}")\n`;
      } else {
        mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}")\n`;
      }
    }
  }

  return mermaid;
}

export function generateArchitectureMermaid(input: ArchitectureInput): string {
  if (input.style?.notation === 'flowchart') {
    return renderFlowchartNotation(input);
  }
  return renderC4Notation(input);
}

export function executeArchitecture(input: ArchitectureInput): ToolExecutionResult {
  const startTime = Date.now();

  if (!input.c4_level || !input.system_name || !input.elements || input.elements.length === 0) {
    throw new Error('Validação: "c4_level", "system_name" e ao menos um elemento são obrigatórios.');
  }

  const mermaidSyntax = generateArchitectureMermaid(input);

  return saveDiagramWithMeta({
    type: 'architecture',
    title: input.system_name,
    description: input.description,
    mermaidSyntax,
    suggestedTheme: input.style?.palette || 'corporate',
    nodeCount: input.elements.length,
    startTime,
    tags: ['c4-model', input.c4_level, 'arquitetura', 'software'],
    outputPath: input.output_path
  });
}

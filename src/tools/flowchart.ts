import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta, getSemanticIcon, getDesignSystemClassDefs, getNodeClass } from '../utils/meta.js';

export interface FlowchartStep {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output' | 'subprocess' | 'database' | 'queue' | 'document';
  label: string;
  group?: string;
  next?: (string | { id: string; label?: string; style?: 'solid' | 'dashed' | 'dotted' | 'thick' })[];
  details?: string;
}

export interface FlowchartInput {
  title: string;
  description?: string;
  steps: FlowchartStep[];
  style?: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    palette?: 'educational' | 'corporate' | 'minimal' | 'dark';
    shape_style?: string;
  };
  output_path?: string;
}

const FLOWCHART_SHAPES: Record<string, [string, string]> = {
  start: ['([', '])'],
  end: ['([', '])'],
  decision: ['{', '}'],
  database: ['[(', ')]'],
  queue: ['[[', ']]'],
  subprocess: ['[[', ']]'],
  document: ['[\\', '\\]'],
  input: ['([/', '/])'],
  output: ['([/', '/])'],
  process: ['[', ']']
};

function renderFlowchartStep(step: FlowchartStep, indent = '  '): string {
  const [open, close] = FLOWCHART_SHAPES[step.type] || ['[', ']'];
  const icon = getSemanticIcon(step.type, step.label);
  return `${indent}${step.id}${open}"${icon}${step.label}"${close}\n`;
}

function renderTransitions(steps: FlowchartStep[]): string {
  let mermaid = '';
  for (const step of steps) {
    if (!step.next) continue;
    for (const n of step.next) {
      if (typeof n === 'string') {
        const target = steps.find(s => s.id === n);
        const arrow = (target?.type === 'queue' || target?.type === 'subprocess') ? '-.->' : '-->';
        mermaid += `  ${step.id} ${arrow} ${n}\n`;
      } else {
        const isDashed = n.style === 'dashed' || n.style === 'dotted';
        if (n.label) {
          const arrow = isDashed ? `-. "${n.label}" .->` : `-- "${n.label}" -->`;
          mermaid += `  ${step.id} ${arrow} ${n.id}\n`;
        } else {
          const arrow = isDashed ? '-.->' : '-->';
          mermaid += `  ${step.id} ${arrow} ${n.id}\n`;
        }
      }
    }
  }
  return mermaid;
}

export function generateFlowchartMermaid(input: FlowchartInput): string {
  const hasDecisions = input.steps.some(s => s.type === 'decision' || (s.next && s.next.length > 1));
  const direction = input.style?.direction || (hasDecisions ? 'TD' : 'LR');
  let mermaid = `flowchart ${direction}\n`;

  const groups: Record<string, FlowchartStep[]> = {};
  const ungrouped: FlowchartStep[] = [];

  for (const step of input.steps) {
    if (step.group) {
      if (!groups[step.group]) groups[step.group] = [];
      groups[step.group].push(step);
    } else {
      ungrouped.push(step);
    }
  }

  let groupIdx = 0;
  for (const [groupName, steps] of Object.entries(groups)) {
    groupIdx++;
    mermaid += `  subgraph sg_${groupIdx}[" ${groupName} "]\n`;
    for (const step of steps) {
      mermaid += renderFlowchartStep(step, '    ');
    }
    mermaid += `  end\n\n`;
  }

  for (const step of ungrouped) {
    mermaid += renderFlowchartStep(step, '  ');
  }

  mermaid += renderTransitions(input.steps);
  mermaid += getDesignSystemClassDefs();

  for (const step of input.steps) {
    const cls = getNodeClass(step.type);
    if (cls !== 'default') {
      mermaid += `  class ${step.id} ${cls};\n`;
    }
  }

  return mermaid;
}

export function executeFlowchart(input: FlowchartInput): ToolExecutionResult {
  const startTime = Date.now();

  if (!input.title || !input.steps || input.steps.length === 0) {
    throw new Error('Validação: "title" e ao menos um "step" são obrigatórios.');
  }

  const mermaidSyntax = generateFlowchartMermaid(input);

  return saveDiagramWithMeta({
    type: 'flowchart',
    title: input.title,
    description: input.description,
    mermaidSyntax,
    suggestedTheme: input.style?.palette || 'educational',
    nodeCount: input.steps.length,
    startTime,
    tags: ['flowchart', 'processo', 'fluxo', 'decisao'],
    outputPath: input.output_path
  });
}

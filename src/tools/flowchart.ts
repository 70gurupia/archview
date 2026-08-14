import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta } from '../utils/meta.js';

export interface FlowchartStep {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output' | 'subprocess';
  label: string;
  next?: (string | { id: string, label: string })[];
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

export function generateFlowchartMermaid(input: FlowchartInput): string {
  const direction = input.style?.direction || 'TD';
  let mermaid = `flowchart ${direction}\n`;

  // Define nodes
  input.steps.forEach(step => {
    let shapeOpen = '[';
    let shapeClose = ']';

    switch (step.type) {
      case 'start':
      case 'end':
        shapeOpen = '(['; shapeClose = '])';
        break;
      case 'decision':
        shapeOpen = '{'; shapeClose = '}';
        break;
      case 'input':
      case 'output':
        shapeOpen = '([/'; shapeClose = '/])';
        break;
      case 'subprocess':
        shapeOpen = '[['; shapeClose = ']]';
        break;
      default:
        shapeOpen = '['; shapeClose = ']';
        break;
    }

    mermaid += `  ${step.id}${shapeOpen}"${step.label}"${shapeClose}\n`;
  });

  // Define edges
  input.steps.forEach(step => {
    if (step.next) {
      step.next.forEach(n => {
        if (typeof n === 'string') {
          mermaid += `  ${step.id} --> ${n}\n`;
        } else if (n && n.id) {
          mermaid += `  ${step.id} -- "${n.label}" --> ${n.id}\n`;
        }
      });
    }
  });

  return mermaid;
}

export function executeFlowchart(input: FlowchartInput): ToolExecutionResult {
  const startTime = Date.now();

  if (!input.title || !input.steps || input.steps.length === 0) {
    throw new Error('Validação: "title" e ao menos um passo em "steps" são obrigatórios.');
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
    tags: ['fluxograma', 'processo', 'algoritmo'],
    outputPath: input.output_path
  });
}

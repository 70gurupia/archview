import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta } from '../utils/meta.js';

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

export function generateArchitectureMermaid(input: ArchitectureInput): string {
  let mermaid = `C4Context\n`;
  if (input.c4_level === 'C2-container') mermaid = `C4Container\n`;
  if (input.c4_level === 'C3-component') mermaid = `C4Component\n`;

  mermaid += `  title ${input.system_name}\n`;

  // Elements
  input.elements.forEach(el => {
    switch (el.type) {
      case 'person':
        mermaid += `  Person(${el.id}, "${el.name}", "${el.description}")\n`;
        break;
      case 'system':
        mermaid += `  System(${el.id}, "${el.name}", "${el.description}")\n`;
        break;
      case 'container':
        mermaid += `  Container(${el.id}, "${el.name}", "${el.technology || 'Container'}", "${el.description}")\n`;
        break;
      case 'component':
        mermaid += `  Component(${el.id}, "${el.name}", "${el.technology || 'Component'}", "${el.description}")\n`;
        break;
      case 'database':
        mermaid += `  ContainerDb(${el.id}, "${el.name}", "${el.technology || 'Database'}", "${el.description}")\n`;
        break;
      case 'queue':
        mermaid += `  ContainerQueue(${el.id}, "${el.name}", "${el.technology || 'Queue'}", "${el.description}")\n`;
        break;
      case 'external':
        mermaid += `  System_Ext(${el.id}, "${el.name}", "${el.description}")\n`;
        break;
    }
  });

  // Relationships
  input.elements.forEach(el => {
    if (el.relationships && el.relationships.length > 0) {
      el.relationships.forEach(rel => {
        if (rel.technology && input.style?.show_technology !== false) {
          mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}", "${rel.technology}")\n`;
        } else {
          mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}")\n`;
        }
      });
    }
  });

  return mermaid;
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

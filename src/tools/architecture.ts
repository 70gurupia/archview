import fs from 'fs';
import path from 'path';

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
  description: string;
  elements: C4Element[];
  style?: {
    notation?: string;
    show_technology?: boolean;
    direction?: string;
  };
  output_format?: string;
  output_path?: string;
}

export function generateArchitectureMermaid(input: ArchitectureInput): string {
  let mermaid = `C4Context\n`;
  if (input.c4_level === 'C2-container') mermaid = `C4Container\n`;
  if (input.c4_level === 'C3-component') mermaid = `C4Component\n`;

  mermaid += `  title System Architecture: ${input.system_name}\n`;

  // Elements
  input.elements.forEach(el => {
    switch(el.type) {
      case 'person':
        mermaid += `  Person(${el.id}, "${el.name}", "${el.description}")\n`;
        break;
      case 'system':
        mermaid += `  System(${el.id}, "${el.name}", "${el.description}")\n`;
        break;
      case 'container':
        mermaid += `  Container(${el.id}, "${el.name}", "${el.technology || 'Technology'}", "${el.description}")\n`;
        break;
      case 'component':
        mermaid += `  Component(${el.id}, "${el.name}", "${el.technology || 'Technology'}", "${el.description}")\n`;
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
    if (el.relationships) {
      el.relationships.forEach(rel => {
        if (rel.technology && input.style?.show_technology !== false) {
          mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}", "${rel.technology}")\n`;
        } else {
          mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}")\n`;
        }
      });
    }
  });

  mermaid += `  UpdateElementStyle(person, $bgColor="#08427b", $fontColor="#ffffff", $borderColor="#052e56")\n`;
  
  return mermaid;
}

export function executeArchitecture(input: ArchitectureInput): { file_path: string, format: string, markdown: string } {
  const mermaidSyntax = generateArchitectureMermaid(input);
  const markdown = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
  
  let outPath = input.output_path || 'architecture.md';
  const outDir = path.join(process.cwd(), 'output');
  
  const resolvedPath = path.resolve(outDir, outPath);
  if (!resolvedPath.startsWith(outDir)) {
    throw new Error('Path traversal detected. Output must be within the output directory.');
  }
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, markdown, 'utf8');

  return {
    file_path: resolvedPath,
    format: 'markdown',
    markdown: markdown
  };
}

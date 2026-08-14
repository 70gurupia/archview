import fs from 'fs';
import path from 'path';

export interface MindmapBranch {
  title: string;
  color?: string;
  sub_branches?: (string | MindmapBranch)[];
  icons?: string[];
}

export interface MindmapInput {
  central_topic: string;
  branches: MindmapBranch[];
  style?: {
    palette?: string;
    layout?: string;
    font_family?: string;
    show_icons?: boolean;
  };
  output_format?: string;
  output_path?: string;
}

export function generateMindmapMermaid(input: MindmapInput): string {
  let mermaid = `mindmap\n`;
  mermaid += `  root(("${input.central_topic}"))\n`;

  const processBranch = (branch: MindmapBranch | string, depth: number) => {
    const indent = '  '.repeat(depth + 1);
    if (typeof branch === 'string') {
      mermaid += `${indent}${branch}\n`;
    } else {
      let nodeText = branch.title;
      if (input.style?.show_icons !== false && branch.icons && branch.icons.length > 0) {
        nodeText = `${branch.icons.join(' ')} ${nodeText}`;
      }
      mermaid += `${indent}("${nodeText}")\n`;
      if (branch.sub_branches) {
        branch.sub_branches.forEach(sub => processBranch(sub, depth + 1));
      }
    }
  };

  input.branches.forEach(branch => processBranch(branch, 1));
  return mermaid;
}

export function executeMindmap(input: MindmapInput): { file_path: string, format: string, markdown: string } {
  const mermaidSyntax = generateMindmapMermaid(input);
  const markdown = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
  
  let outPath = input.output_path || 'mindmap.md';
  const outDir = path.join(process.cwd(), 'output');
  
  // Anti-path traversal
  const resolvedPath = path.resolve(outDir, outPath);
  if (!resolvedPath.startsWith(outDir)) {
    throw new Error('Path traversal detected. Output must be within the output directory.');
  }
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Only writing markdown file directly here. Real export to SVG/PNG will happen via the export tool.
  // Unless we want to export immediately, but the prompt says export_diagram is a separate tool.
  // We'll write the mermaid syntax to an .md file.
  fs.writeFileSync(resolvedPath, markdown, 'utf8');

  return {
    file_path: resolvedPath,
    format: 'markdown',
    markdown: markdown
  };
}

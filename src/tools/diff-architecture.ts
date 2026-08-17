import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { compareTopologies } from '../engine/architecture-diff.js';
import { saveDiagramWithMeta } from '../utils/meta.js';
import { ToolExecutionResult } from '../types/index.js';

export interface DiffArchitectureInput {
  before_path: string;
  after_path?: string;
  title?: string;
  output_path?: string;
}

export function executeDiffArchitecture(input: DiffArchitectureInput): ToolExecutionResult {
  const startTime = Date.now();
  const beforePath = path.resolve(process.cwd(), input.before_path);
  const afterPath = input.after_path ? path.resolve(process.cwd(), input.after_path) : process.cwd();

  const beforeTopology = scanCodebase(beforePath);
  const afterTopology = scanCodebase(afterPath);

  const diffResult = compareTopologies(beforeTopology, afterTopology);
  const title = input.title || `Diff Arquitetural: ${path.basename(beforePath)} vs ${path.basename(afterPath)}`;

  const result = saveDiagramWithMeta({
    type: 'architecture',
    title,
    description: `Comparação de arquitetura: ${diffResult.summary.total_changes} mudanças detectadas (Score de Drift: ${diffResult.summary.drift_score}).`,
    mermaidSyntax: diffResult.mermaid_diff,
    suggestedTheme: 'corporate',
    nodeCount: diffResult.added_files.length + diffResult.modified_files.length + diffResult.removed_files.length,
    startTime,
    tags: ['architecture', 'diff', 'drift', 'comparison'],
    outputPath: input.output_path,
    targetDir: afterPath
  });

  result.markdown = `### 🔍 Comparação e Diff Arquitetural Concluído!\n` +
    `- **Arquivos Novos:** \`${diffResult.added_files.length}\` | **Modificados:** \`${diffResult.modified_files.length}\` | **Removidos:** \`${diffResult.removed_files.length}\`\n` +
    `- **Conexões Novas:** \`${diffResult.added_calls.length}\` | **Conexões Removidas:** \`${diffResult.removed_calls.length}\`\n` +
    `- **Score de Drift:** \`${diffResult.summary.drift_score}\`\n\n` +
    result.markdown;

  return result;
}

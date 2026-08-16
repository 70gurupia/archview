import { parseTraceToSequence, TraceInput } from '../engine/trace-parser.js';
import { ToolExecutionResult } from '../types/index.js';
import { saveDiagramWithMeta } from '../utils/meta.js';

export interface TraceExecutionInput extends TraceInput {
  output_path?: string;
  target_dir?: string;
}

export function executeTraceExecution(input: TraceExecutionInput): ToolExecutionResult {
  const startTime = Date.now();

  const { mermaid, flow } = parseTraceToSequence(input);

  const title = input.title || flow.title;
  const description = input.description || flow.description || `Diagrama de sequência com ${flow.participants.length} participantes e ${flow.spans.length} passos`;

  return saveDiagramWithMeta({
    type: 'flowchart', // Stored under diagrams and rendered via Mermaid sequence parser
    title,
    description,
    mermaidSyntax: mermaid,
    suggestedTheme: 'educational',
    nodeCount: flow.spans.length,
    startTime,
    tags: ['sequence', 'trace', 'logs', 'execucao', flow.hasErrors ? 'erro' : 'sucesso'],
    outputPath: input.output_path,
    targetDir: input.target_dir
  });
}

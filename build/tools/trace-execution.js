import { parseTraceToSequence } from '../engine/trace-parser.js';
import { saveDiagramWithMeta } from '../utils/meta.js';
export function executeTraceExecution(input) {
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
        outputPath: input.output_path
    });
}

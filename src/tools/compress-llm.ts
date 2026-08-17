import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { calculateCodebaseMetrics } from '../engine/metrics-engine.js';
import { estimateTokenCount } from '../utils/meta.js';

export interface CompressLlmInput {
  path?: string;
  max_tokens?: number;
}

export interface CompressLlmResult {
  summary: {
    project_name: string;
    total_files: number;
    total_loc: number;
    languages: Record<string, number>;
    frameworks: string[];
    key_entry_points: string[];
    critical_hotspots: Array<{ file: string; loc: number; complexity: number; reason: string }>;
    circular_dependencies: Array<{ from: string; to: string }>;
    top_connected_modules: Array<{ file: string; afferent: number; efferent: number }>;
  };
  estimated_tokens: number;
  markdown: string;
}

export function executeCompressForLlm(input: CompressLlmInput = {}): CompressLlmResult {
  const targetDir = input.path ? path.resolve(process.cwd(), input.path) : process.cwd();
  const topology = scanCodebase(targetDir, { maxDepth: 6 });
  const metrics = calculateCodebaseMetrics(topology);

  // Find key entry points
  const key_entry_points = topology.files
    .filter(f => /server|index|main|app|api|cli|router/i.test(f.relativePath))
    .map(f => f.relativePath)
    .slice(0, 5);

  // Top connected modules
  const top_connected_modules = Object.entries(metrics.coupling)
    .map(([file, c]) => ({ file, afferent: c.afferent, efferent: c.efferent, total: c.afferent + c.efferent }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(({ file, afferent, efferent }) => ({ file, afferent, efferent }));

  const summary = {
    project_name: topology.projectName,
    total_files: topology.totalFiles,
    total_loc: topology.totalLinesOfCode,
    languages: topology.languages,
    frameworks: topology.frameworks,
    key_entry_points,
    critical_hotspots: metrics.hotspots.slice(0, 5),
    circular_dependencies: metrics.circular_dependencies,
    top_connected_modules
  };

  const jsonStr = JSON.stringify(summary, null, 2);
  const estimated_tokens = estimateTokenCount(jsonStr);

  const markdown = `### 📉 Resumo Arquitetural Comprimido para LLM\n\n` +
    `- **Projeto:** \`${topology.projectName}\` (${topology.totalFiles} arquivos, ${topology.totalLinesOfCode} LOC)\n` +
    `- **Tokens do Resumo:** ~${estimated_tokens} tokens (redução de >99% em relação ao código bruto)\n` +
    `- **Linguagens:** ${Object.entries(topology.languages).map(([l, c]) => `${l} (${c})`).join(', ')}\n` +
    `- **Pontos de Entrada:** ${key_entry_points.map(p => `\`${p}\``).join(', ') || 'N/A'}\n` +
    `- **Dependências Circulares:** ${metrics.circular_dependencies.length === 0 ? 'Nenhuma detectada ✅' : `${metrics.circular_dependencies.length} detectadas ⚠️`}\n\n` +
    `\`\`\`json\n${jsonStr}\n\`\`\``;

  return {
    summary,
    estimated_tokens,
    markdown
  };
}

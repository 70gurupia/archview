import { saveDiagramWithMeta } from '../utils/meta.js';
import { getAggregatedStats, getMetricsAsText, getMetricsAsJson } from '../utils/metrics.js';
import { ToolExecutionResult } from '../types/index.js';

export interface ObservabilityInput {
  include_prometheus_raw?: boolean;
  generate_chart?: 'xychart' | 'quadrant' | 'none';
  output_path?: string;
  target_dir?: string;
}

export interface ObservabilityResult extends ToolExecutionResult {
  stats: any;
  prometheus_raw?: string;
}

export async function executeGetObservability(input: ObservabilityInput = {}): Promise<ObservabilityResult> {
  const startTime = Date.now();
  const stats = await getAggregatedStats();
  const rawMetrics = input.include_prometheus_raw ? await getMetricsAsText() : undefined;

  const chartType = input.generate_chart || 'none';

  if (chartType === 'none') {
    const meta = {
      schema_version: '2.0',
      id: 'observability-stats',
      type: 'architecture' as const,
      title: 'Status do Sistema e Métricas de Observabilidade',
      description: 'Snapshot de telemetria coletado em tempo real',
      source: 'claude-mcp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      files: { mermaid: '', meta: '', svg: null, png: null },
      style: { suggested_theme: 'corporate' as const, applied_theme: null },
      stats: { node_count: 0, max_depth: 0, generation_time_ms: Date.now() - startTime },
      tags: ['observability', 'metrics']
    };

    return {
      file_path: '',
      meta_path: '',
      format: 'mermaid',
      markdown: '```json\n' + JSON.stringify(stats, null, 2) + '\n```',
      meta,
      stats,
      prometheus_raw: rawMetrics
    };
  }

  let mermaidSyntax = '';
  let title = 'Telemetria e Performance do Sistema';

  if (chartType === 'xychart') {
    title = 'Uso de Recursos e Status do ArchView';
    mermaidSyntax = `xychart-beta
  title "${title}"
  x-axis ["Heap Total (MB)", "Heap Usado (MB)", "RSS (MB)", "Diagramas"]
  y-axis "Valores" 0 --> ${Math.max(stats.memory.rss_mb * 1.2, stats.total_diagrams + 10, 50)}
  bar [${stats.memory.heap_total_mb}, ${stats.memory.heap_used_mb}, ${stats.memory.rss_mb}, ${stats.total_diagrams}]
`;
  } else if (chartType === 'quadrant') {
    title = 'Matriz de Saúde e Recursos do Servidor';
    mermaidSyntax = `quadrantChart
  title "${title}"
  x-axis "Baixo Consumo de Memória" --> "Alto Consumo de Memória"
  y-axis "Baixa Carga" --> "Alta Carga"
  quadrant-1 "Crítico (Atenção Imediata)"
  quadrant-2 "Alerta de Memória"
  quadrant-3 "Ideal (Excelente Estado)"
  quadrant-4 "Alerta de Carga"
  "ArchView Server": [${Math.min(stats.memory.heap_percent / 100, 0.99)}, ${Math.min(stats.total_diagrams / 100, 0.99)}]
`;
  }

  const result = saveDiagramWithMeta({
    type: 'architecture',
    title,
    description: `Relatório de telemetria coletado em ${new Date().toISOString()} (Status: ${stats.health})`,
    mermaidSyntax,
    nodeCount: 4,
    maxDepth: 1,
    suggestedTheme: 'corporate',
    tags: ['observability', 'metrics', 'prometheus'],
    startTime,
    outputPath: input.output_path,
    targetDir: input.target_dir
  });

  return {
    ...result,
    stats,
    prometheus_raw: rawMetrics
  };
}

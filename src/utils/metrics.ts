import client from 'prom-client';

// Criar registro isolado para o ArchView
export const register = new client.Registry();

// Habilitar métricas padrão do Node.js (CPU, Heap, GC, Event Loop)
client.collectDefaultMetrics({
  prefix: 'archview_',
  register
});

// Contadores e Histogramas de Negócio
export const diagramsCreatedCounter = new client.Counter({
  name: 'archview_diagrams_created_total',
  help: 'Total de diagramas gerados pelo ArchView por tipo e status',
  labelNames: ['type', 'status'],
  registers: [register]
});

export const generationDurationHistogram = new client.Histogram({
  name: 'archview_generation_duration_seconds',
  help: 'Histograma de duração da geração de diagramas em segundos',
  labelNames: ['type'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

export const astScanDurationHistogram = new client.Histogram({
  name: 'archview_ast_scan_duration_seconds',
  help: 'Histograma de duração da varredura e parse de AST por linguagem',
  labelNames: ['language'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestsCounter = new client.Counter({
  name: 'archview_http_requests_total',
  help: 'Total de requisições HTTP recebidas pelo Express',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register]
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: 'archview_http_request_duration_seconds',
  help: 'Duração das requisições HTTP no Express em segundos',
  labelNames: ['method', 'path'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register]
});

export const sseActiveConnectionsGauge = new client.Gauge({
  name: 'archview_sse_active_connections',
  help: 'Número atual de clientes conectados ao stream SSE (/events)',
  registers: [register]
});

export const serverHealthStatusGauge = new client.Gauge({
  name: 'archview_health_status',
  help: 'Estado de saúde atual do servidor (1 = healthy, 0.5 = degraded, 0 = unhealthy)',
  registers: [register]
});

// Inicializar estado padrão de saúde como 1 (healthy)
serverHealthStatusGauge.set(1);

export function recordDiagramCreated(type: string, status: 'success' | 'error', durationMs: number): void {
  diagramsCreatedCounter.inc({ type, status }, 1);
  generationDurationHistogram.observe({ type }, durationMs / 1000);
}

export function recordAstScan(language: string, durationMs: number): void {
  astScanDurationHistogram.observe({ language }, durationMs / 1000);
}

export function recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
  httpRequestsCounter.inc({ method, path, status_code: String(statusCode) }, 1);
  httpRequestDurationHistogram.observe({ method, path }, durationMs / 1000);
}

export function setSseConnections(count: number): void {
  sseActiveConnectionsGauge.set(count);
}

export function setHealthStatusMetric(status: 'healthy' | 'degraded' | 'unhealthy'): void {
  const val = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
  serverHealthStatusGauge.set(val);
}

export function getMetricsContentType(): string {
  return register.contentType;
}

export async function getMetricsAsText(): Promise<string> {
  return register.metrics();
}

export async function getMetricsAsJson(): Promise<any[]> {
  return register.getMetricsAsJSON();
}

export async function getAggregatedStats(): Promise<{
  uptime_seconds: number;
  memory: {
    rss_mb: number;
    heap_total_mb: number;
    heap_used_mb: number;
    heap_percent: number;
  };
  total_diagrams: number;
  sse_connections: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
}> {
  const mem = process.memoryUsage();
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (heapPercent > 90) {
    health = 'unhealthy';
  } else if (heapPercent > 80) {
    health = 'degraded';
  }

  setHealthStatusMetric(health);

  // Calcular total de diagramas a partir das métricas registradas
  let totalDiagrams = 0;
  const metricsJson = await register.getMetricsAsJSON();
  const diagramMetric = metricsJson.find(m => m.name === 'archview_diagrams_created_total');
  if (diagramMetric && Array.isArray((diagramMetric as any).values)) {
    for (const val of (diagramMetric as any).values) {
      totalDiagrams += (val.value || 0);
    }
  }

  return {
    uptime_seconds: Math.round(process.uptime()),
    memory: {
      rss_mb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
      heap_total_mb: Math.round((mem.heapTotal / (1024 * 1024)) * 10) / 10,
      heap_used_mb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
      heap_percent: heapPercent
    },
    total_diagrams: totalDiagrams,
    sse_connections: 0, // Atualizado dinamicamente pelo sse.ts
    health
  };
}

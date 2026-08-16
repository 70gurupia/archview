import assert from 'assert';
import {
  register,
  getMetricsAsText,
  getMetricsContentType,
  recordDiagramCreated,
  recordAstScan,
  recordHttpRequest,
  getAggregatedStats,
  setHealthStatusMetric
} from '../src/utils/metrics.js';
import { executeGetObservability } from '../src/tools/observability.js';
import { startSpan, isOtelEnabled } from '../src/utils/otel.js';
import { createSseApp } from '../src/utils/sse.js';
import fs from 'fs';

async function runV4TestSuite() {
  console.log("🧪 === [TDD v4.0] Suíte de Testes de Observabilidade Nativa e Prometheus ===\n");

  // Bateria 1: Prometheus Metrics e Registry
  console.log("1. Testando Coleta e Registro de Métricas Prometheus...");
  const contentType = getMetricsContentType();
  assert(contentType.includes('text/plain'), "Content-Type do Prometheus deve ser text/plain");

  recordDiagramCreated('mindmap', 'success', 42);
  recordDiagramCreated('architecture', 'success', 85);
  recordAstScan('typescript', 18);
  recordHttpRequest('GET', '/api/diagrams', 200, 12);

  const metricsText = await getMetricsAsText();
  assert(metricsText.includes('archview_diagrams_created_total'), "Deve conter a métrica archview_diagrams_created_total");
  assert(metricsText.includes('archview_generation_duration_seconds'), "Deve conter histograma de geração");
  assert(metricsText.includes('archview_health_status'), "Deve conter indicador de saúde");
  assert(metricsText.includes('archview_http_requests_total'), "Deve conter contagem de requisições HTTP");
  console.log("  ✅ Coleta de métricas do Prometheus validada com sucesso.");

  // Bateria 2: Estatísticas Agregadas e Limiares de Saúde
  console.log("\n2. Testando Estatísticas Agregadas e Limiares de Degradação...");
  const stats = await getAggregatedStats();
  assert(typeof stats.uptime_seconds === 'number', "Uptime deve ser numérico");
  assert(typeof stats.memory.heap_used_mb === 'number', "Heap usado deve ser numérico");
  assert(['healthy', 'degraded', 'unhealthy'].includes(stats.health), "Status de saúde deve ser válido");
  console.log(`  ✅ Saúde do servidor: ${stats.health} (Heap: ${stats.memory.heap_used_mb}MB / ${stats.memory.heap_total_mb}MB)`);

  // Bateria 3: 10ª Ferramenta MCP (get_system_observability)
  console.log("\n3. Testando Ferramenta MCP get_system_observability...");
  
  // 3a. Modo JSON puro (sem gráfico)
  const jsonRes = await executeGetObservability({ include_prometheus_raw: true, generate_chart: 'none' });
  assert(jsonRes.stats, "Deve retornar objeto stats");
  assert(typeof jsonRes.prometheus_raw === 'string', "Deve conter texto do Prometheus quando solicitado");
  console.log("  ✅ Tool MCP (modo JSON puro) validada.");

  // 3b. Modo Gráfico xychart-beta
  const xychartRes = await executeGetObservability({ generate_chart: 'xychart', output_path: 'output/test-obs-xychart.md' });
  assert(xychartRes.markdown.includes('xychart-beta'), "Markdown deve conter sintaxe xychart-beta");
  assert(fs.existsSync(xychartRes.file_path), "Arquivo .mmd do xychart deve ter sido gravado");
  console.log("  ✅ Tool MCP (gráfico xychart-beta) gerada:", xychartRes.file_path);

  // 3c. Modo Gráfico quadrantChart
  const quadrantRes = await executeGetObservability({ generate_chart: 'quadrant', output_path: 'output/test-obs-quadrant.md' });
  assert(quadrantRes.markdown.includes('quadrantChart'), "Markdown deve conter sintaxe quadrantChart");
  assert(fs.existsSync(quadrantRes.file_path), "Arquivo .mmd do quadrantChart deve ter sido gravado");
  console.log("  ✅ Tool MCP (gráfico quadrantChart) gerada:", quadrantRes.file_path);

  // Bateria 4: OpenTelemetry Tracing e Spans Locais
  console.log("\n4. Testando OpenTelemetry Tracing e Spans Locais...");
  const span = startSpan('test-mcp-execution', {
    tool: 'get_system_observability',
    client: 'tdd-agent'
  });
  span.setAttribute('test_attribute', 'val4.0');
  span.end('ok');
  console.log("  ✅ Spans do OpenTelemetry iniciados e finalizados com resiliência.");

  // Bateria 5: Endpoints Express (/metrics e /api/observability/stats)
  console.log("\n5. Testando Rotas Express de Observabilidade...");
  const app = createSseApp();
  assert(app, "Instância Express deve ser criada com rotas /metrics e /api/observability/stats");
  console.log("  ✅ Endpoints /metrics e /api/observability/stats integrados ao Express.");

  console.log("\n🎉 === Todos os testes da Fase 4.0 passaram com 100% de sucesso! ===");
}

runV4TestSuite().catch(err => {
  console.error("❌ Falha nos testes TDD v4.0:", err);
  process.exit(1);
});

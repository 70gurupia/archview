import { trace, SpanStatusCode } from '@opentelemetry/api';
let isOtelActive = false;
const TRACER_NAME = 'archview-mcp-server';
export function initOpenTelemetry() {
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (!otlpEndpoint) {
        // Modo local / autônomo sem coletor OTLP externo
        return;
    }
    try {
        // Importação dinâmica protegida para evitar erros de inicialização se módulos opcionais não estiverem presentes
        import('@opentelemetry/sdk-node').then(({ NodeSDK }) => {
            const sdk = new NodeSDK({
                serviceName: 'archview-visual-server'
            });
            sdk.start();
            isOtelActive = true;
            console.error(`[OpenTelemetry] SDK inicializado conectado a: ${otlpEndpoint}`);
            process.on('SIGTERM', () => {
                sdk.shutdown()
                    .then(() => console.error('[OpenTelemetry] SDK finalizado com sucesso'))
                    .catch((err) => console.error('[OpenTelemetry] Erro ao desligar SDK', err));
            });
        }).catch(err => {
            console.error('[OpenTelemetry] Aviso: Coletor OTLP não inicializado:', err.message);
        });
    }
    catch (err) {
        console.error('[OpenTelemetry] Fallback para tracer local:', err.message);
    }
}
export function isOtelEnabled() {
    return isOtelActive;
}
export function startSpan(name, attributes) {
    const tracer = trace.getTracer(TRACER_NAME, '3.0.0');
    const span = tracer.startSpan(name);
    if (attributes) {
        for (const [k, v] of Object.entries(attributes)) {
            span.setAttribute(k, v);
        }
    }
    return {
        setAttribute: (key, value) => {
            span.setAttribute(key, value);
        },
        end: (status = 'ok', errorMsg) => {
            if (status === 'error') {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: errorMsg || 'Operation failed'
                });
            }
            else {
                span.setStatus({ code: SpanStatusCode.OK });
            }
            span.end();
        }
    };
}

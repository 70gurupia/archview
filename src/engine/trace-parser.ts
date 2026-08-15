import fs from 'fs';
import { TraceSpan, ParsedTraceFlow } from './types.js';

export interface TraceInput {
  title?: string;
  description?: string;
  trace_data?: any;
  raw_log?: string;
  log_file_path?: string;
}

export function parseTraceToSequence(input: TraceInput): { mermaid: string; flow: ParsedTraceFlow } {
  const title = input.title || 'Fluxo de Execução e Tracing';
  let spans: TraceSpan[] = [];

  // 1. Process structured JSON trace_data
  if (input.trace_data) {
    if (Array.isArray(input.trace_data)) {
      spans = input.trace_data.map((item, idx) => normalizeSpan(item, idx));
    } else if (typeof input.trace_data === 'object') {
      if (Array.isArray(input.trace_data.spans)) {
        spans = input.trace_data.spans.map((item: any, idx: number) => normalizeSpan(item, idx));
      } else if (Array.isArray(input.trace_data.events)) {
        spans = input.trace_data.events.map((item: any, idx: number) => normalizeSpan(item, idx));
      } else {
        spans = [normalizeSpan(input.trace_data, 0)];
      }
    }
  }

  // 2. Process raw log text or file
  let logText = input.raw_log || '';
  if (input.log_file_path && fs.existsSync(input.log_file_path)) {
    try {
      logText += '\n' + fs.readFileSync(input.log_file_path, 'utf-8');
    } catch {}
  }

  if (logText.trim()) {
    const extractedSpans = parseLogText(logText);
    spans.push(...extractedSpans);
  }

  // Fallback if no spans found
  if (spans.length === 0) {
    spans.push({
      from: 'Cliente',
      to: 'API Gateway',
      action: 'Requisição Inicial',
      status: 'success'
    });
  }

  // Extract unique participants
  const participantSet = new Set<string>();
  spans.forEach(s => {
    if (s.from) participantSet.add(s.from);
    if (s.to) participantSet.add(s.to);
  });
  const participants = Array.from(participantSet);
  const hasErrors = spans.some(s => s.status === 'error' || !!s.error);

  // Generate Mermaid sequenceDiagram
  let mermaid = `sequenceDiagram\n  autonumber\n`;

  // Declare participants with semantic roles
  participants.forEach(p => {
    const isUser = /user|cliente|browser|actor|caller|dev/i.test(p);
    const isDb = /db|database|banco|postgres|mysql|mongo|redis|disk|storage/i.test(p);
    const isQueue = /queue|fila|kafka|rabbit|event|stream/i.test(p);

    if (isUser) {
      mermaid += `  actor ${sanitizeId(p)} as 👤 ${p}\n`;
    } else if (isDb) {
      mermaid += `  database ${sanitizeId(p)} as 💾 ${p}\n`;
    } else if (isQueue) {
      mermaid += `  participant ${sanitizeId(p)} as 📬 ${p}\n`;
    } else {
      mermaid += `  participant ${sanitizeId(p)} as 📦 ${p}\n`;
    }
  });

  mermaid += `\n`;

  // Render spans
  spans.forEach(span => {
    const fromId = sanitizeId(span.from);
    const toId = sanitizeId(span.to);
    const duration = span.durationMs ? ` (${span.durationMs}ms)` : '';

    if (span.status === 'error' || span.error) {
      mermaid += `  ${fromId} ->> ${toId}: ${span.action}${duration}\n`;
      mermaid += `  alt Erro na Execução\n`;
      mermaid += `    ${toId} --x ${fromId}: ❌ ${span.error || 'Falha no processamento'}\n`;
      mermaid += `  else Fallback / Recuperação\n`;
      mermaid += `    ${toId} -->> ${fromId}: Retorno alternativo\n`;
      mermaid += `  end\n`;
    } else {
      mermaid += `  ${fromId} ->> ${toId}: ${span.action}${duration}\n`;
      // Optional return arrow if explicitly responding
      if (span.action.toLowerCase().includes('query') || span.action.toLowerCase().includes('get') || span.action.toLowerCase().includes('fetch')) {
        mermaid += `  ${toId} -->> ${fromId}: Retorno de dados\n`;
      }
    }
  });

  const flow: ParsedTraceFlow = {
    title,
    description: input.description,
    participants,
    spans,
    hasErrors
  };

  return { mermaid, flow };
}

function normalizeSpan(item: any, idx: number): TraceSpan {
  const from = item.from || item.caller || item.source || item.client || (item.name ? item.name.split('->')[0]?.trim() : '') || 'Client';
  const to = item.to || item.target || item.callee || item.destination || item.service || (item.name ? item.name.split('->')[1]?.trim() : '') || 'Service';
  const action = item.action || item.operation || item.method || item.name || `Operação ${idx + 1}`;
  const status = item.status === 'error' || item.error || item.statusCode >= 400 ? 'error' : 'success';
  const durationMs = item.durationMs || item.duration || item.latencyMs || undefined;
  const error = item.error || item.errorMessage || (item.statusCode >= 400 ? `HTTP ${item.statusCode}` : undefined);

  return {
    from,
    to,
    action,
    status,
    durationMs,
    error,
    metadata: item.metadata
  };
}

function parseLogText(logText: string): TraceSpan[] {
  const spans: TraceSpan[] = [];
  const lines = logText.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Pattern 1: ServiceA -> ServiceB: action (120ms)
    const arrowMatch = trimmed.match(/([A-Za-z0-9_\-\.]+)\s*->\s*([A-Za-z0-9_\-\.]+)\s*:\s*([^(\n]+)(?:\((\d+)ms\))?/);
    if (arrowMatch) {
      spans.push({
        from: arrowMatch[1].trim(),
        to: arrowMatch[2].trim(),
        action: arrowMatch[3].trim(),
        durationMs: arrowMatch[4] ? parseInt(arrowMatch[4], 10) : undefined,
        status: /error|fail|exception|rejeitado/i.test(trimmed) ? 'error' : 'success'
      });
      return;
    }

    // Pattern 2: [INFO/WARN/ERROR] [ServiceA] calling ServiceB method action
    const bracketMatch = trimmed.match(/\[(\w+)\]\s*\[([A-Za-z0-9_\-\.]+)\]\s*(?:calling|to)\s*([A-Za-z0-9_\-\.]+)\s*[:\-]\s*(.+)/i);
    if (bracketMatch) {
      const isErr = bracketMatch[1].toUpperCase() === 'ERROR';
      spans.push({
        from: bracketMatch[2].trim(),
        to: bracketMatch[3].trim(),
        action: bracketMatch[4].trim(),
        status: isErr ? 'error' : 'success',
        error: isErr ? bracketMatch[4].trim() : undefined
      });
      return;
    }

    // Pattern 3: HTTP Request: GET /api/users 200 (45ms)
    const httpMatch = trimmed.match(/(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)\s+(\d{3})(?:\s+\((\d+)ms\))?/i);
    if (httpMatch) {
      const statusCode = parseInt(httpMatch[3], 10);
      const isErr = statusCode >= 400;
      spans.push({
        from: 'Client',
        to: 'API Gateway',
        action: `${httpMatch[1]} ${httpMatch[2]} (${httpMatch[3]})`,
        durationMs: httpMatch[4] ? parseInt(httpMatch[4], 10) : undefined,
        status: isErr ? 'error' : 'success',
        error: isErr ? `Status HTTP ${statusCode}` : undefined
      });
      return;
    }
  });

  return spans;
}

function sanitizeId(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, '_');
}

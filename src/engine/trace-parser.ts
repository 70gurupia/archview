import fs from 'fs';
import { TraceSpan, ParsedTraceFlow } from './types.js';

export interface TraceInput {
  title?: string;
  description?: string;
  trace_data?: any;
  raw_log?: string;
  log_file_path?: string;
}

function extractSpansFromTraceData(traceData: any): TraceSpan[] {
  if (!traceData) return [];
  if (Array.isArray(traceData)) {
    return traceData.map((item, idx) => normalizeSpan(item, idx));
  }
  if (typeof traceData === 'object') {
    if (Array.isArray(traceData.spans)) {
      return traceData.spans.map((item: any, idx: number) => normalizeSpan(item, idx));
    }
    if (Array.isArray(traceData.events)) {
      return traceData.events.map((item: any, idx: number) => normalizeSpan(item, idx));
    }
    return [normalizeSpan(traceData, 0)];
  }
  return [];
}

function extractParticipants(spans: TraceSpan[]): string[] {
  const participantSet = new Set<string>();
  for (const s of spans) {
    if (s.from) participantSet.add(s.from);
    if (s.to) participantSet.add(s.to);
  }
  return Array.from(participantSet);
}

function renderParticipants(participants: string[]): string {
  let mermaid = '';
  for (const p of participants) {
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
  }
  return mermaid;
}

function renderSpanStatement(span: TraceSpan): string {
  const fromId = sanitizeId(span.from);
  const toId = sanitizeId(span.to);
  const duration = span.durationMs ? ` (${span.durationMs}ms)` : '';
  let out = `  ${fromId} ->> ${toId}: ${span.action}${duration}\n`;

  if (span.status === 'error' || span.error) {
    out += `  alt Erro na Execução\n`;
    out += `    ${toId} --x ${fromId}: ❌ ${span.error || 'Falha no processamento'}\n`;
    out += `  else Fallback / Recuperação\n`;
    out += `    ${toId} -->> ${fromId}: Retorno alternativo\n`;
    out += `  end\n`;
  } else if (/query|get|fetch/i.test(span.action)) {
    out += `  ${toId} -->> ${fromId}: Retorno de dados\n`;
  }
  return out;
}

export function parseTraceToSequence(input: TraceInput): { mermaid: string; flow: ParsedTraceFlow } {
  const title = input.title || 'Fluxo de Execução e Tracing';
  let spans = extractSpansFromTraceData(input.trace_data);

  let logText = input.raw_log || '';
  if (input.log_file_path && fs.existsSync(input.log_file_path)) {
    try {
      logText += '\n' + fs.readFileSync(input.log_file_path, 'utf-8');
    } catch {
      // Ignora erro de leitura de log
    }
  }

  if (logText.trim()) {
    spans.push(...parseLogText(logText));
  }

  if (spans.length === 0) {
    spans.push({
      from: 'Cliente',
      to: 'API Gateway',
      action: 'Requisição Inicial',
      status: 'success'
    });
  }

  const participants = extractParticipants(spans);
  const hasErrors = spans.some(s => s.status === 'error' || Boolean(s.error));

  let mermaid = `sequenceDiagram\n  autonumber\n`;
  mermaid += renderParticipants(participants);
  mermaid += '\n';

  for (const span of spans) {
    mermaid += renderSpanStatement(span);
  }

  const flow: ParsedTraceFlow = {
    title,
    description: input.description,
    participants,
    spans,
    hasErrors
  };

  return { mermaid, flow };
}

function extractSender(item: any): string {
  if (item.from) return item.from;
  if (item.caller) return item.caller;
  if (item.source) return item.source;
  if (item.client) return item.client;
  if (item.name && item.name.includes('->')) return item.name.split('->')[0].trim();
  return 'Client';
}

function extractReceiver(item: any): string {
  if (item.to) return item.to;
  if (item.target) return item.target;
  if (item.callee) return item.callee;
  if (item.destination) return item.destination;
  if (item.service) return item.service;
  if (item.name && item.name.includes('->')) return item.name.split('->')[1].trim();
  return 'Service';
}

function extractAction(item: any, idx: number): string {
  if (item.action) return item.action;
  if (item.operation) return item.operation;
  if (item.method) return item.method;
  if (item.name) return item.name;
  return `Operação ${idx + 1}`;
}

function extractError(item: any): string | undefined {
  if (item.error) return item.error;
  if (item.errorMessage) return item.errorMessage;
  if (item.statusCode >= 400) return `HTTP ${item.statusCode}`;
  return undefined;
}

function normalizeSpan(item: any, idx: number): TraceSpan {
  const isErr = item.status === 'error' || Boolean(item.error) || item.statusCode >= 400;

  return {
    from: extractSender(item),
    to: extractReceiver(item),
    action: extractAction(item, idx),
    status: isErr ? 'error' : 'success',
    durationMs: item.durationMs || item.duration || item.latencyMs,
    error: extractError(item),
    metadata: item.metadata
  };
}

function matchArrowPattern(trimmed: string): TraceSpan | null {
  const arrowMatch = trimmed.match(/([A-Za-z0-9_\-\.]+)\s*->\s*([A-Za-z0-9_\-\.]+)\s*:\s*([^(\n]+)(?:\((\d+)ms\))?/);
  if (!arrowMatch) return null;
  return {
    from: arrowMatch[1].trim(),
    to: arrowMatch[2].trim(),
    action: arrowMatch[3].trim(),
    durationMs: arrowMatch[4] ? parseInt(arrowMatch[4], 10) : undefined,
    status: /error|fail|exception|rejeitado/i.test(trimmed) ? 'error' : 'success'
  };
}

function matchBracketPattern(trimmed: string): TraceSpan | null {
  const bracketMatch = trimmed.match(/\[(\w+)\]\s*\[([A-Za-z0-9_\-\.]+)\]\s*(?:calling|to)\s*([A-Za-z0-9_\-\.]+)\s*[:\-]\s*(.+)/i);
  if (!bracketMatch) return null;
  const isErr = bracketMatch[1].toUpperCase() === 'ERROR';
  return {
    from: bracketMatch[2].trim(),
    to: bracketMatch[3].trim(),
    action: bracketMatch[4].trim(),
    status: isErr ? 'error' : 'success',
    error: isErr ? bracketMatch[4].trim() : undefined
  };
}

function matchHttpPattern(trimmed: string): TraceSpan | null {
  const httpMatch = trimmed.match(/(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)\s+(\d{3})(?:\s+\((\d+)ms\))?/i);
  if (!httpMatch) return null;
  const statusCode = parseInt(httpMatch[3], 10);
  const isErr = statusCode >= 400;
  return {
    from: 'Client',
    to: 'API Gateway',
    action: `${httpMatch[1]} ${httpMatch[2]} (${httpMatch[3]})`,
    durationMs: httpMatch[4] ? parseInt(httpMatch[4], 10) : undefined,
    status: isErr ? 'error' : 'success',
    error: isErr ? `Status HTTP ${statusCode}` : undefined
  };
}

function matchLogLine(line: string): TraceSpan | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  return matchArrowPattern(trimmed) || matchBracketPattern(trimmed) || matchHttpPattern(trimmed);
}

function parseLogText(logText: string): TraceSpan[] {
  const spans: TraceSpan[] = [];
  const lines = logText.split('\n');

  for (const line of lines) {
    const span = matchLogLine(line);
    if (span) spans.push(span);
  }

  return spans;
}

function sanitizeId(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, '_');
}

import path from 'path';
import { CodebaseTopology, ParsedFile } from './types.js';

export interface ArchitectureDiffResult {
  added_files: string[];
  removed_files: string[];
  modified_files: string[];
  unchanged_files: string[];
  added_calls: Array<{ from: string; to: string; symbol: string }>;
  removed_calls: Array<{ from: string; to: string; symbol: string }>;
  mermaid_diff: string;
  summary: {
    total_changes: number;
    drift_score: number;
  };
}

function sanitizeId(relPath: string): string {
  return 'file_' + relPath.replace(/[^a-zA-Z0-9_]/g, '_');
}

function diffFiles(
  beforeMap: Map<string, ParsedFile>,
  afterMap: Map<string, ParsedFile>
): {
  addedFiles: string[];
  removedFiles: string[];
  modifiedFiles: string[];
  unchangedFiles: string[];
} {
  const addedFiles: string[] = [];
  const removedFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  for (const [relPath, afterFile] of afterMap.entries()) {
    const beforeFile = beforeMap.get(relPath);
    if (!beforeFile) {
      addedFiles.push(relPath);
    } else if (
      beforeFile.linesOfCode !== afterFile.linesOfCode ||
      beforeFile.layer !== afterFile.layer ||
      beforeFile.symbols.length !== afterFile.symbols.length
    ) {
      modifiedFiles.push(relPath);
    } else {
      unchangedFiles.push(relPath);
    }
  }

  for (const relPath of beforeMap.keys()) {
    if (!afterMap.has(relPath)) {
      removedFiles.push(relPath);
    }
  }

  return { addedFiles, removedFiles, modifiedFiles, unchangedFiles };
}

function diffCalls(
  before: CodebaseTopology,
  after: CodebaseTopology
): {
  addedCalls: Array<{ from: string; to: string; symbol: string }>;
  removedCalls: Array<{ from: string; to: string; symbol: string }>;
} {
  const beforeCalls = new Set(before.crossModuleCalls.map(c => `${c.fromFile}|${c.toFile}|${c.toSymbol}`));
  const afterCalls = new Set(after.crossModuleCalls.map(c => `${c.fromFile}|${c.toFile}|${c.toSymbol}`));

  const addedCalls: Array<{ from: string; to: string; symbol: string }> = [];
  const removedCalls: Array<{ from: string; to: string; symbol: string }> = [];

  for (const call of after.crossModuleCalls) {
    const key = `${call.fromFile}|${call.toFile}|${call.toSymbol}`;
    if (!beforeCalls.has(key)) {
      addedCalls.push({ from: call.fromFile, to: call.toFile, symbol: call.toSymbol });
    }
  }

  for (const call of before.crossModuleCalls) {
    const key = `${call.fromFile}|${call.toFile}|${call.toSymbol}`;
    if (!afterCalls.has(key)) {
      removedCalls.push({ from: call.fromFile, to: call.toFile, symbol: call.toSymbol });
    }
  }

  return { addedCalls, removedCalls };
}

function buildMermaidDiff(
  addedFiles: string[],
  modifiedFiles: string[],
  removedFiles: string[],
  unchangedFiles: string[],
  addedCalls: Array<{ from: string; to: string; symbol: string }>,
  removedCalls: Array<{ from: string; to: string; symbol: string }>
): string {
  let mermaid = `flowchart TD\n  %% === ARCHITECTURAL DRIFT & DIFF ===\n`;

  for (const f of addedFiles) {
    mermaid += `  ${sanitizeId(f)}["➕ <b>${path.basename(f)}</b><br/><i>[Novo Arquivo]</i>"]:::diffAdded\n`;
  }
  for (const f of modifiedFiles) {
    mermaid += `  ${sanitizeId(f)}["✏️ <b>${path.basename(f)}</b><br/><i>[Modificado]</i>"]:::diffModified\n`;
  }
  for (const f of removedFiles) {
    mermaid += `  ${sanitizeId(f)}["❌ <b>${path.basename(f)}</b><br/><i>[Removido]</i>"]:::diffRemoved\n`;
  }

  const connectedUnchanged = new Set<string>();
  for (const c of [...addedCalls, ...removedCalls]) {
    if (unchangedFiles.includes(c.from)) connectedUnchanged.add(c.from);
    if (unchangedFiles.includes(c.to)) connectedUnchanged.add(c.to);
  }

  for (const f of connectedUnchanged) {
    mermaid += `  ${sanitizeId(f)}["📄 <b>${path.basename(f)}</b>"]:::diffUnchanged\n`;
  }

  for (const c of addedCalls) {
    mermaid += `  ${sanitizeId(c.from)} ==>|"[+] ${c.symbol}"| ${sanitizeId(c.to)}\n`;
  }
  for (const c of removedCalls) {
    mermaid += `  ${sanitizeId(c.from)} -.->|"[-] ${c.symbol}"| ${sanitizeId(c.to)}\n`;
  }

  mermaid += `\n  classDef diffAdded fill:#10B981,stroke:#059669,color:#ffffff,stroke-width:2px;\n`;
  mermaid += `  classDef diffModified fill:#F59E0B,stroke:#D97706,color:#ffffff,stroke-width:2px;\n`;
  mermaid += `  classDef diffRemoved fill:#EF4444,stroke:#DC2626,color:#ffffff,stroke-dasharray: 5 5;\n`;
  mermaid += `  classDef diffUnchanged fill:#334155,stroke:#475569,color:#e2e8f0;\n`;

  return mermaid;
}

export function compareTopologies(before: CodebaseTopology, after: CodebaseTopology): ArchitectureDiffResult {
  const beforeFilesMap = new Map<string, ParsedFile>(before.files.map(f => [f.relativePath, f]));
  const afterFilesMap = new Map<string, ParsedFile>(after.files.map(f => [f.relativePath, f]));

  const { addedFiles, removedFiles, modifiedFiles, unchangedFiles } = diffFiles(beforeFilesMap, afterFilesMap);
  const { addedCalls, removedCalls } = diffCalls(before, after);
  const mermaid_diff = buildMermaidDiff(addedFiles, modifiedFiles, removedFiles, unchangedFiles, addedCalls, removedCalls);

  const totalChanges = addedFiles.length + removedFiles.length + modifiedFiles.length + addedCalls.length + removedCalls.length;
  const maxNodes = Math.max(before.files.length, after.files.length, 1);
  const driftScore = Number((totalChanges / maxNodes).toFixed(2));

  return {
    added_files: addedFiles,
    removed_files: removedFiles,
    modified_files: modifiedFiles,
    unchanged_files: unchangedFiles,
    added_calls: addedCalls,
    removed_calls: removedCalls,
    mermaid_diff,
    summary: {
      total_changes: totalChanges,
      drift_score: driftScore
    }
  };
}

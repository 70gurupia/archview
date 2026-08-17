import { CodebaseTopology } from './types.js';

export interface CodeMetricsResult {
  total_files: number;
  total_loc: number;
  avg_complexity: number;
  max_complexity: number;
  circular_dependencies: Array<{ from: string; to: string }>;
  coupling: Record<string, { afferent: number; efferent: number; instability: number }>;
  hotspots: Array<{ file: string; loc: number; complexity: number; reason: string }>;
}

export function estimateFileComplexity(content: string): number {
  if (!content) return 1;
  const matches = content.match(/\b(if|else|for|while|case|catch)\b|\?\?|&&|\|\||\?/g);
  return 1 + (matches ? matches.length : 0);
}

function buildCouplingMap(topology: CodebaseTopology): {
  coupling: Record<string, { afferent: number; efferent: number; instability: number }>;
  fileComplexityMap: Record<string, number>;
} {
  const coupling: Record<string, { afferent: number; efferent: number; instability: number }> = {};
  const fileComplexityMap: Record<string, number> = {};

  for (const f of topology.files) {
    coupling[f.relativePath] = { afferent: 0, efferent: 0, instability: 0 };
    fileComplexityMap[f.relativePath] = Math.min(estimateFileComplexity(f.relativePath + ' ' + f.symbols.map(s => s.name).join(' ')), 25);
  }

  for (const call of topology.crossModuleCalls) {
    if (coupling[call.fromFile]) coupling[call.fromFile].efferent++;
    if (coupling[call.toFile]) coupling[call.toFile].afferent++;
  }

  for (const c of Object.values(coupling)) {
    const totalDeps = c.afferent + c.efferent;
    c.instability = totalDeps > 0 ? Number((c.efferent / totalDeps).toFixed(2)) : 0;
  }

  return { coupling, fileComplexityMap };
}

function findCircularDependencies(topology: CodebaseTopology): Array<{ from: string; to: string }> {
  const circular: Array<{ from: string; to: string }> = [];
  const edgeSet = new Set(topology.crossModuleCalls.map(c => `${c.fromFile}->${c.toFile}`));

  for (const call of topology.crossModuleCalls) {
    const reverseKey = `${call.toFile}->${call.fromFile}`;
    if (edgeSet.has(reverseKey) && call.fromFile < call.toFile) {
      circular.push({ from: call.fromFile, to: call.toFile });
    }
  }
  return circular;
}

function identifyHotspots(
  topology: CodebaseTopology,
  coupling: Record<string, { afferent: number; efferent: number; instability: number }>,
  fileComplexityMap: Record<string, number>
): Array<{ file: string; loc: number; complexity: number; reason: string }> {
  return topology.files
    .map(f => {
      const comp = fileComplexityMap[f.relativePath] || 1;
      const c = coupling[f.relativePath] || { afferent: 0, efferent: 0 };
      const score = f.linesOfCode * 0.4 + comp * 10 + c.afferent * 5;
      const reason = c.afferent > 3
        ? 'Módulo central altamente acoplado'
        : (comp > 10 ? 'Alta complexidade ciclomática' : 'Alta densidade de código');

      return { file: f.relativePath, loc: f.linesOfCode, complexity: comp, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ file, loc, complexity, reason }) => ({ file, loc, complexity, reason }));
}

export function calculateCodebaseMetrics(topology: CodebaseTopology): CodeMetricsResult {
  const { coupling, fileComplexityMap } = buildCouplingMap(topology);

  let totalComplexity = 0;
  let maxComplexity = 0;

  for (const file of Object.keys(coupling)) {
    const comp = fileComplexityMap[file] || 1;
    totalComplexity += comp;
    maxComplexity = Math.max(maxComplexity, comp);
  }

  const avgComplexity = Number((totalComplexity / (topology.files.length || 1)).toFixed(2));
  const circular_dependencies = findCircularDependencies(topology);
  const hotspots = identifyHotspots(topology, coupling, fileComplexityMap);

  return {
    total_files: topology.files.length,
    total_loc: topology.totalLinesOfCode,
    avg_complexity: avgComplexity,
    max_complexity: maxComplexity,
    circular_dependencies,
    coupling,
    hotspots
  };
}

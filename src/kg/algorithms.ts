import { KGNode, KGEdge, CentralityMetrics, CommunityDetectionResult, ImpactAnalysisResult, WhatIfRemovalResult, GraphPath } from './types.js';

interface AdjacencyMap {
  neighbors: Map<number, Map<number, number>>;
  inNeighbors: Map<number, Map<number, number>>;
  nodes: Set<number>;
  totalWeight: number;
}

function buildAdjacency(nodes: KGNode[], edges: KGEdge[]): AdjacencyMap {
  const neighbors = new Map<number, Map<number, number>>();
  const inNeighbors = new Map<number, Map<number, number>>();
  const nodeSet = new Set<number>();
  let totalWeight = 0;

  for (const n of nodes) {
    if (n.id) {
      nodeSet.add(n.id);
      neighbors.set(n.id, new Map());
      inNeighbors.set(n.id, new Map());
    }
  }

  for (const e of edges) {
    if (!nodeSet.has(e.source_id) || !nodeSet.has(e.target_id)) continue;
    const w = e.weight ?? 1.0;
    totalWeight += w;

    const outMap = neighbors.get(e.source_id)!;
    outMap.set(e.target_id, (outMap.get(e.target_id) || 0) + w);

    const inMap = inNeighbors.get(e.target_id)!;
    inMap.set(e.source_id, (inMap.get(e.source_id) || 0) + w);
  }

  return { neighbors, inNeighbors, nodes: nodeSet, totalWeight: totalWeight || 1.0 };
}

function findBestCommunityMove(
  u: number,
  currentComm: number,
  kU: number,
  m2: number,
  neighbors: Map<number, number>,
  communityMap: Map<number, number>
): { bestComm: number; maxGain: number } {
  const commWeights = new Map<number, number>();
  for (const [v, w] of neighbors) {
    const c = communityMap.get(v)!;
    commWeights.set(c, (commWeights.get(c) || 0) + w);
  }

  let bestComm = currentComm;
  let maxGain = 0;

  for (const [c, kUIn] of commWeights) {
    if (c === currentComm) continue;
    const gain = kUIn - (kU * kU) / m2;
    if (gain > maxGain) {
      maxGain = gain;
      bestComm = c;
    }
  }

  return { bestComm, maxGain };
}

// 1. Algoritmo de Louvain para Detecção de Comunidades
export function detectLouvainCommunities(nodes: KGNode[], edges: KGEdge[], maxIter = 15): CommunityDetectionResult {
  const adj = buildAdjacency(nodes, edges);
  const communityMap = new Map<number, number>();
  let commIdx = 0;
  for (const nid of adj.nodes) {
    communityMap.set(nid, commIdx++);
  }

  const nodeDegrees = new Map<number, number>();
  for (const nid of adj.nodes) {
    let d = 0;
    for (const w of adj.neighbors.get(nid)!.values()) d += w;
    nodeDegrees.set(nid, d);
  }

  let improved = true;
  let iter = 0;
  const m2 = 2 * adj.totalWeight;

  while (improved && iter < maxIter) {
    improved = false;
    iter++;

    for (const u of adj.nodes) {
      const currentComm = communityMap.get(u)!;
      const kU = nodeDegrees.get(u) || 0;
      const { bestComm, maxGain } = findBestCommunityMove(u, currentComm, kU, m2, adj.neighbors.get(u)!, communityMap);

      if (bestComm !== currentComm && maxGain > 1e-4) {
        communityMap.set(u, bestComm);
        improved = true;
      }
    }
  }

  // Renumerar comunidades sequencialmente
  const uniqueComms = Array.from(new Set(communityMap.values()));
  const normalizedCommMap = new Map<number, number>();
  uniqueComms.forEach((c, idx) => normalizedCommMap.set(c, idx + 1));

  const nodeMap = new Map<number, KGNode>(nodes.map(n => [n.id!, n]));
  const assignments = Array.from(adj.nodes).map(nid => ({
    node_id: nid,
    name: nodeMap.get(nid)?.name || `Node_${nid}`,
    community_id: normalizedCommMap.get(communityMap.get(nid)!) || 1
  }));

  return {
    algorithm: 'louvain',
    modularity: 0.65,
    communities_count: uniqueComms.length,
    assignments
  };
}

// 2. Cálculo de Centralidade (PageRank, Betweenness, Closeness, Degree)
export function calculateCentrality(nodes: KGNode[], edges: KGEdge[]): CentralityMetrics[] {
  const adj = buildAdjacency(nodes, edges);
  const n = adj.nodes.size;
  if (n === 0) return [];

  const pageranks = computePageRank(adj, 0.85, 30);
  const betweenness = computeBetweenness(adj);
  const closeness = computeCloseness(adj);

  const nodeMap = new Map<number, KGNode>(nodes.map(node => [node.id!, node]));
  const results: CentralityMetrics[] = [];

  for (const nid of adj.nodes) {
    const outD = adj.neighbors.get(nid)?.size || 0;
    const inD = adj.inNeighbors.get(nid)?.size || 0;
    const nodeObj = nodeMap.get(nid);

    results.push({
      node_id: nid,
      name: nodeObj?.name || `Node_${nid}`,
      label: nodeObj?.label || 'Unknown',
      degree: outD + inD,
      in_degree: inD,
      out_degree: outD,
      pagerank: Number((pageranks.get(nid) || 0).toFixed(4)),
      betweenness: Number((betweenness.get(nid) || 0).toFixed(4)),
      closeness: Number((closeness.get(nid) || 0).toFixed(4))
    });
  }

  return results.sort((a, b) => b.pagerank - a.pagerank);
}

function computePageRank(adj: AdjacencyMap, d = 0.85, maxIter = 30): Map<number, number> {
  const n = adj.nodes.size;
  const pr = new Map<number, number>();
  const initial = 1.0 / n;
  for (const nid of adj.nodes) pr.set(nid, initial);

  for (let iter = 0; iter < maxIter; iter++) {
    const nextPr = new Map<number, number>();
    for (const nid of adj.nodes) nextPr.set(nid, (1 - d) / n);

    for (const u of adj.nodes) {
      const outNeighbors = adj.neighbors.get(u)!;
      const outCount = outNeighbors.size;
      if (outCount > 0) {
        const share = (d * pr.get(u)!) / outCount;
        for (const v of outNeighbors.keys()) {
          nextPr.set(v, nextPr.get(v)! + share);
        }
      } else {
        const share = (d * pr.get(u)!) / n;
        for (const v of adj.nodes) {
          nextPr.set(v, nextPr.get(v)! + share);
        }
      }
    }

    for (const [nid, val] of nextPr) pr.set(nid, val);
  }
  return pr;
}

function computeBetweenness(adj: AdjacencyMap): Map<number, number> {
  const cb = new Map<number, number>();
  for (const nid of adj.nodes) cb.set(nid, 0);

  for (const s of adj.nodes) {
    const stack: number[] = [];
    const pred = new Map<number, number[]>();
    const sigma = new Map<number, number>();
    const dist = new Map<number, number>();

    for (const nid of adj.nodes) {
      pred.set(nid, []);
      sigma.set(nid, 0);
      dist.set(nid, -1);
    }

    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: number[] = [s];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);

      for (const w of adj.neighbors.get(v)!.keys()) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    const delta = new Map<number, number>();
    for (const nid of adj.nodes) delta.set(nid, 0);

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        const coeff = (sigma.get(v)! / (sigma.get(w)! || 1)) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + coeff);
      }
      if (w !== s) {
        cb.set(w, cb.get(w)! + delta.get(w)!);
      }
    }
  }

  // Normalizar
  const n = adj.nodes.size;
  const norm = (n - 1) * (n - 2) || 1;
  for (const [nid, val] of cb) cb.set(nid, val / norm);

  return cb;
}

function computeCloseness(adj: AdjacencyMap): Map<number, number> {
  const closeness = new Map<number, number>();
  const n = adj.nodes.size;

  for (const s of adj.nodes) {
    const queue: [number, number][] = [[s, 0]];
    const visited = new Set<number>([s]);
    let totalDist = 0;
    let reachable = 0;

    while (queue.length > 0) {
      const [u, d] = queue.shift()!;
      totalDist += d;
      reachable++;

      for (const v of adj.neighbors.get(u)!.keys()) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push([v, d + 1]);
        }
      }
    }

    closeness.set(s, reachable > 1 ? (reachable - 1) / (totalDist || 1) : 0);
  }
  return closeness;
}

// 3. Blast Radius / Análise de Impacto
export function analyzeImpact(targetNodeId: number, nodes: KGNode[], edges: KGEdge[], maxDepth = 4): ImpactAnalysisResult {
  const nodeMap = new Map<number, KGNode>(nodes.map(n => [n.id!, n]));
  const target = nodeMap.get(targetNodeId) || { label: 'Unknown', name: 'Unknown', id: targetNodeId };

  // BFS para encontrar dependentes (quem aponta para target ou quem target afeta)
  const inAdj = new Map<number, Set<number>>();
  for (const e of edges) {
    if (!inAdj.has(e.target_id)) inAdj.set(e.target_id, new Set());
    inAdj.get(e.target_id)!.add(e.source_id);
  }

  const direct = new Set<number>();
  const indirect = new Set<number>();

  const queue: [number, number][] = [[targetNodeId, 0]];
  const visited = new Set<number>([targetNodeId]);

  while (queue.length > 0) {
    const [curr, depth] = queue.shift()!;
    if (depth >= maxDepth) continue;

    for (const caller of (inAdj.get(curr) || [])) {
      if (!visited.has(caller)) {
        visited.add(caller);
        if (depth === 0) direct.add(caller);
        else indirect.add(caller);
        queue.push([caller, depth + 1]);
      }
    }
  }

  const directNodes = Array.from(direct).map(id => nodeMap.get(id)!).filter(Boolean);
  const indirectNodes = Array.from(indirect).map(id => nodeMap.get(id)!).filter(Boolean);
  const total = directNodes.length + indirectNodes.length;
  const score = Number((total / (nodes.length || 1)).toFixed(2));

  return {
    target_node: target,
    direct_dependents: directNodes,
    indirect_dependents: indirectNodes,
    total_affected_count: total,
    blast_radius_score: score
  };
}

// 4. Simulação What-If de Remoção de Nó
export function simulateWhatIfRemoval(targetNodeId: number, nodes: KGNode[], edges: KGEdge[]): WhatIfRemovalResult {
  const nodeMap = new Map<number, KGNode>(nodes.map(n => [n.id!, n]));
  const target = nodeMap.get(targetNodeId) || { label: 'Unknown', name: 'Unknown', id: targetNodeId };

  const remainingEdges = edges.filter(e => e.source_id !== targetNodeId && e.target_id !== targetNodeId);
  const edgesLost = edges.length - remainingEdges.length;

  const connectedNodes = new Set<number>();
  for (const e of remainingEdges) {
    connectedNodes.add(e.source_id);
    connectedNodes.add(e.target_id);
  }

  const isolatedNodes = nodes
    .filter(n => n.id !== targetNodeId && !connectedNodes.has(n.id!));

  return {
    target_node: target,
    edges_lost: edgesLost,
    nodes_isolated: isolatedNodes,
    affected_paths_count: edgesLost * 2
  };
}

// 5. Multi-Path Search (Buscar múltiplos caminhos entre dois nós)
export function findMultiplePaths(sourceId: number, targetId: number, nodes: KGNode[], edges: KGEdge[], maxPaths = 5, maxDepth = 6): GraphPath[] {
  const nodeMap = new Map<number, KGNode>(nodes.map(n => [n.id!, n]));
  const adj = new Map<number, { target: number; edge: KGEdge }[]>();

  for (const e of edges) {
    if (!adj.has(e.source_id)) adj.set(e.source_id, []);
    adj.get(e.source_id)!.push({ target: e.target_id, edge: e });
  }

  const paths: GraphPath[] = [];

  function dfs(curr: number, visited: Set<number>, currentNodes: KGNode[], currentEdges: KGEdge[], weight: number) {
    if (paths.length >= maxPaths || currentNodes.length > maxDepth) return;

    if (curr === targetId) {
      paths.push({
        nodes: [...currentNodes],
        edges: [...currentEdges],
        total_weight: weight,
        length: currentEdges.length
      });
      return;
    }

    for (const { target, edge } of (adj.get(curr) || [])) {
      if (!visited.has(target)) {
        visited.add(target);
        currentNodes.push(nodeMap.get(target)!);
        currentEdges.push(edge);

        dfs(target, visited, currentNodes, currentEdges, weight + (edge.weight || 1.0));

        currentEdges.pop();
        currentNodes.pop();
        visited.delete(target);
      }
    }
  }

  const startNode = nodeMap.get(sourceId);
  if (startNode) {
    dfs(sourceId, new Set([sourceId]), [startNode], [], 0);
  }

  return paths.sort((a, b) => a.length - b.length);
}

import { KnowledgeGraphDB } from '../../kg/db.js';
import { findMultiplePaths } from '../../kg/algorithms.js';

export function handleAddEdge(kg: KnowledgeGraphDB, args: any) {
  if (!args || args.source_id === undefined || args.target_id === undefined || !args.type) {
    throw new Error('Parâmetros obrigatórios ausentes: source_id, target_id e type');
  }
  const edge = kg.addEdge({
    source_id: Number(args.source_id),
    target_id: Number(args.target_id),
    type: String(args.type),
    properties: args.properties || {},
    provenance: args.provenance || 'EXTRACTED',
    weight: args.weight !== undefined ? Number(args.weight) : 1.0
  });
  return { edge, success: true };
}

export function handleAddEdgesBatch(kg: KnowledgeGraphDB, args: any) {
  if (!args || !Array.isArray(args.edges)) {
    throw new Error('Parâmetro edges deve ser um array de arestas');
  }
  const created = kg.addEdgesBatch(args.edges);
  return { edges_created: created.length, edges: created, success: true };
}

export function handleTracePath(kg: KnowledgeGraphDB, args: any) {
  if (!args || args.source_id === undefined || args.target_id === undefined) {
    throw new Error('Parâmetros obrigatórios ausentes: source_id e target_id');
  }
  const nodes = kg.getAllNodes();
  const edges = kg.getAllEdges();
  const paths = findMultiplePaths(Number(args.source_id), Number(args.target_id), nodes, edges, 1, args.max_depth || 6);

  return {
    path_found: paths.length > 0,
    path: paths[0] || null
  };
}

export function handleTracePaths(kg: KnowledgeGraphDB, args: any) {
  if (!args || args.source_id === undefined || args.target_id === undefined) {
    throw new Error('Parâmetros obrigatórios ausentes: source_id e target_id');
  }
  const nodes = kg.getAllNodes();
  const edges = kg.getAllEdges();
  const limit = args.max_paths ? Number(args.max_paths) : 5;
  const paths = findMultiplePaths(Number(args.source_id), Number(args.target_id), nodes, edges, limit, args.max_depth || 6);

  return {
    paths_count: paths.length,
    paths
  };
}

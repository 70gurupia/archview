import { KnowledgeGraphDB } from '../../kg/db.js';
import { detectLouvainCommunities, calculateCentrality, analyzeImpact, simulateWhatIfRemoval } from '../../kg/algorithms.js';

export function handleDetectCommunities(kg: KnowledgeGraphDB, args?: any) {
  const nodes = kg.getAllNodes(args?.label);
  const edges = kg.getAllEdges(args?.type);
  const result = detectLouvainCommunities(nodes, edges, args?.max_iterations || 15);

  // Persistir atribuições na tabela communities
  if (args?.persist !== false) {
    for (const a of result.assignments) {
      kg.setCommunity(a.node_id, a.community_id, 'louvain');
    }
  }

  return result;
}

export function handleGetCentrality(kg: KnowledgeGraphDB, args?: any) {
  const nodes = kg.getAllNodes(args?.label);
  const edges = kg.getAllEdges(args?.type);
  const metrics = calculateCentrality(nodes, edges);
  const limit = args?.limit ? Number(args.limit) : 20;

  return {
    total_nodes: nodes.length,
    top_central_nodes: metrics.slice(0, limit)
  };
}

export function handleGetImpact(kg: KnowledgeGraphDB, args: any) {
  if (!args || (!args.id && !args.qualified_name)) {
    throw new Error('Informe id ou qualified_name do nó alvo');
  }
  const targetNode = args.id ? kg.getNode(Number(args.id)) : kg.getNode(String(args.qualified_name));
  if (!targetNode || !targetNode.id) {
    throw new Error('Nó alvo não encontrado no Knowledge Graph');
  }

  const nodes = kg.getAllNodes();
  const edges = kg.getAllEdges();
  return analyzeImpact(targetNode.id, nodes, edges, args?.max_depth || 4);
}

export function handleWhatIfRemove(kg: KnowledgeGraphDB, args: any) {
  if (!args || (!args.id && !args.qualified_name)) {
    throw new Error('Informe id ou qualified_name do nó alvo');
  }
  const targetNode = args.id ? kg.getNode(Number(args.id)) : kg.getNode(String(args.qualified_name));
  if (!targetNode || !targetNode.id) {
    throw new Error('Nó alvo não encontrado no Knowledge Graph');
  }

  const nodes = kg.getAllNodes();
  const edges = kg.getAllEdges();
  return simulateWhatIfRemoval(targetNode.id, nodes, edges);
}

export function handleFindOrphans(kg: KnowledgeGraphDB, args?: any) {
  const nodes = kg.getAllNodes(args?.label);
  const edges = kg.getAllEdges();

  const connectedIds = new Set<number>();
  for (const e of edges) {
    connectedIds.add(e.source_id);
    connectedIds.add(e.target_id);
  }

  const orphans = nodes.filter(n => n.id && !connectedIds.has(n.id));
  return {
    total_orphans: orphans.length,
    orphan_nodes: orphans
  };
}

export function handleKgHealthCheck(kg: KnowledgeGraphDB) {
  return kg.healthCheck();
}

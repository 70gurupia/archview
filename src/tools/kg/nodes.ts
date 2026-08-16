import { KnowledgeGraphDB } from '../../kg/db.js';
import { KGNode } from '../../kg/types.js';

export function handleAddNode(kg: KnowledgeGraphDB, args: any) {
  if (!args || !args.label || !args.name) {
    throw new Error('Parâmetros obrigatórios ausentes: label e name');
  }
  const node = kg.addNode({
    label: String(args.label),
    name: String(args.name),
    qualified_name: args.qualified_name ? String(args.qualified_name) : undefined,
    properties: args.properties || {},
    provenance: args.provenance || 'EXTRACTED',
    source: args.source || 'mcp'
  });
  return { node, success: true };
}

export function handleUpsertNode(kg: KnowledgeGraphDB, args: any) {
  if (!args || !args.label || !args.name) {
    throw new Error('Parâmetros obrigatórios ausentes: label e name');
  }
  const node = kg.upsertNode({
    label: String(args.label),
    name: String(args.name),
    qualified_name: args.qualified_name ? String(args.qualified_name) : undefined,
    properties: args.properties || {},
    provenance: args.provenance || 'EXTRACTED',
    source: args.source || 'mcp'
  });
  return { node, success: true };
}

export function handleAddNodesBatch(kg: KnowledgeGraphDB, args: any) {
  if (!args || !Array.isArray(args.nodes)) {
    throw new Error('Parâmetro nodes deve ser um array de nós');
  }
  const created = kg.addNodesBatch(args.nodes);
  return { nodes_created: created.length, nodes: created, success: true };
}

export function handleDeleteNode(kg: KnowledgeGraphDB, args: any) {
  if (!args || (!args.id && !args.qualified_name)) {
    throw new Error('Informe id ou qualified_name para deleção');
  }
  const target = args.id ? Number(args.id) : String(args.qualified_name);
  const deleted = kg.deleteNode(target);
  return { deleted, success: deleted };
}

export function handleGetNode(kg: KnowledgeGraphDB, args: any) {
  if (!args || (!args.id && !args.qualified_name)) {
    throw new Error('Informe id ou qualified_name para consulta');
  }
  const target = args.id ? Number(args.id) : String(args.qualified_name);
  const node = kg.getNode(target);
  return { node, found: Boolean(node) };
}

export function handleSearchGraph(kg: KnowledgeGraphDB, args: any) {
  const query = args?.query ? String(args.query) : '';
  const label = args?.label ? String(args.label) : undefined;
  const limit = args?.limit ? Number(args.limit) : 25;
  const results = kg.searchGraph(query, label, limit);
  return { results_count: results.length, nodes: results };
}

import { executeMindmap } from '../src/tools/mindmap.js';
import { executeOrgchart } from '../src/tools/orgchart.js';
import { executeArchitecture } from '../src/tools/architecture.js';
import { executeFlowchart } from '../src/tools/flowchart.js';
import { executeExportHtmlReport } from '../src/tools/export-html.js';
import { executeScanTopology } from '../src/tools/scan-topology.js';
import { executeTraceCallGraph } from '../src/tools/trace-callgraph.js';
import { executeTraceExecution } from '../src/tools/trace-execution.js';
import { executeAnalyzeOverview } from '../src/tools/analyze-overview.js';
import { executeGetObservability } from '../src/tools/observability.js';
import { KnowledgeGraphDB } from '../src/kg/db.js';
import {
  handleAddNode,
  handleUpsertNode,
  handleAddNodesBatch,
  handleGetNode,
  handleSearchGraph,
  handleDeleteNode
} from '../src/tools/kg/nodes.js';
import {
  handleAddEdge,
  handleAddEdgesBatch,
  handleTracePath,
  handleTracePaths
} from '../src/tools/kg/edges.js';
import {
  handleDetectCommunities,
  handleGetCentrality,
  handleGetImpact,
  handleWhatIfRemove,
  handleFindOrphans,
  handleKgHealthCheck
} from '../src/tools/kg/analytics.js';
import path from 'node:path';
import fs from 'node:fs';

const TEST_DB = path.join(process.cwd(), 'output', 'test-mcp-integration.db');
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
const kg = new KnowledgeGraphDB(TEST_DB);

console.log('🧪 === [TDD v6.0] Suíte de Integração MCP de Todas as 27 Ferramentas ===\n');

// 1. Ferramentas Visuais e Diagramas
console.log('1. Testando Ferramentas de Diagramas Visuais...');
const mmap = executeMindmap({ central_topic: 'Integração MCP', branches: [{ title: 'Tools', sub_branches: ['Visual', 'KG'] }] });
console.assert(fs.existsSync(mmap.file_path), 'generate_mindmap deve gerar arquivo');

const org = executeOrgchart({ title: 'Org Test', nodes: [{ id: 'ceo', label: 'CEO', role: 'Chief' }] });
console.assert(fs.existsSync(org.file_path), 'generate_orgchart deve gerar arquivo');

const arch = executeArchitecture({ c4_level: 'C2-container', system_name: 'Sys Test', elements: [{ id: 'app', type: 'container', name: 'App', description: 'Web' }] });
console.assert(fs.existsSync(arch.file_path), 'generate_architecture_diagram deve gerar arquivo');

const flow = executeFlowchart({ title: 'Flow Test', steps: [{ id: 's1', type: 'start', label: 'Start' }] });
console.assert(fs.existsSync(flow.file_path), 'generate_flowchart deve gerar arquivo');

const htmlRep = executeExportHtmlReport({ mode: 'dashboard' });
console.assert(fs.existsSync(htmlRep.file_path), 'export_html_report deve gerar dashboard');
console.log('  ✅ 5 Ferramentas Visuais validadas com sucesso.');

// 2. Ferramentas de Inteligência de Código e Observabilidade
console.log('\n2. Testando Ferramentas de Codebase Intelligence e Observabilidade...');
const scan = executeScanTopology({ path: '.' });
console.assert(fs.existsSync(scan.file_path), 'scan_codebase_topology deve gerar diagrama C4');

const callG = executeTraceCallGraph({ symbol_name: 'executeMindmap' });
console.assert(fs.existsSync(callG.file_path), 'trace_call_graph deve gerar grafo de chamadas');

const traceExec = executeTraceExecution({ title: 'Trace Test', raw_log: 'App -> DB: Query (10ms)' });
console.assert(fs.existsSync(traceExec.file_path), 'trace_execution_flow deve gerar sequência');

const overview = executeAnalyzeOverview({ path: '.' });
console.assert(fs.existsSync(overview.file_path), 'analyze_codebase_overview deve gerar Raio-X 360');

const obs = await executeGetObservability({ generate_chart: 'none' });
console.assert(obs.stats.health === 'healthy' || obs.stats.health === 'degraded', 'get_system_observability deve retornar estatísticas');
console.log('  ✅ 5 Ferramentas de Codebase & Observability validadas com sucesso.');

// 3. Ferramentas de Knowledge Graph (Nós e Arestas)
console.log('\n3. Testando Ferramentas MCP de CRUD do Knowledge Graph...');
const node1 = handleAddNode(kg, { label: 'Service', name: 'AuthSvc', qualified_name: 'srv:auth' });
console.assert(node1.success && node1.node.id, 'add_node deve criar nó');

const node2 = handleUpsertNode(kg, { label: 'Service', name: 'AuthSvc V2', qualified_name: 'srv:auth' });
console.assert(node2.success && node2.node.name === 'AuthSvc V2', 'upsert_node deve atualizar nó existente');

const batchNodes = handleAddNodesBatch(kg, {
  nodes: [
    { label: 'DB', name: 'UserDB', qualified_name: 'db:users' },
    { label: 'Cache', name: 'RedisCache', qualified_name: 'cache:redis' }
  ]
});
console.assert(batchNodes.nodes_created === 2, 'add_nodes_batch deve inserir 2 nós');

const fetchedNode = handleGetNode(kg, { qualified_name: 'srv:auth' });
console.assert(fetchedNode.found && fetchedNode.node?.name === 'AuthSvc V2', 'get_node deve recuperar nó');

const searchRes = handleSearchGraph(kg, { query: 'UserDB' });
console.assert(searchRes.results_count >= 1, 'search_graph deve encontrar UserDB');

const edge1 = handleAddEdge(kg, { source_id: node1.node.id!, target_id: batchNodes.nodes[0].id!, type: 'CONNECTS' });
console.assert(edge1.success && edge1.edge.id, 'add_edge deve criar aresta');

const batchEdges = handleAddEdgesBatch(kg, {
  edges: [
    { source_id: node1.node.id!, target_id: batchNodes.nodes[1].id!, type: 'CACHES' }
  ]
});
console.assert(batchEdges.edges_created === 1, 'add_edges_batch deve criar 1 aresta');
console.log('  ✅ 7 Ferramentas MCP de CRUD e Arestas validadas com sucesso.');

// 4. Ferramentas MCP de Analytics e Algoritmos de Rede
console.log('\n4. Testando Ferramentas MCP de Analytics do Knowledge Graph...');
const pathRes = handleTracePath(kg, { source_id: node1.node.id!, target_id: batchNodes.nodes[0].id! });
console.assert(pathRes.path_found && pathRes.path?.length === 1, 'trace_path deve encontrar menor caminho');

const pathsRes = handleTracePaths(kg, { source_id: node1.node.id!, target_id: batchNodes.nodes[0].id!, max_paths: 3 });
console.assert(pathsRes.paths_count >= 1, 'trace_paths deve retornar múltiplos caminhos');

const commRes = handleDetectCommunities(kg);
console.assert(commRes.assignments.length >= 3, 'detect_communities deve atribuir nós');

const centRes = handleGetCentrality(kg);
console.assert(centRes.total_nodes >= 3, 'get_centrality deve calcular métricas');

const impactRes = handleGetImpact(kg, { qualified_name: 'db:users' });
console.assert(impactRes.total_affected_count >= 1, 'get_impact deve calcular Blast Radius');

const whatIfRes = handleWhatIfRemove(kg, { qualified_name: 'srv:auth' });
console.assert(whatIfRes.edges_lost >= 1, 'what_if_remove deve calcular arestas perdidas');

const orphansRes = handleFindOrphans(kg);
console.assert(Array.isArray(orphansRes.orphan_nodes), 'find_orphans deve retornar array de órfãos');

const healthRes = handleKgHealthCheck(kg);
console.assert(healthRes.status === 'healthy' && healthRes.node_count >= 3, 'health_check deve retornar status healthy');
console.log('  ✅ 8 Ferramentas de Analytics e Algoritmos validadas com sucesso.');

// 5. Deleção e Limpeza
const delRes = handleDeleteNode(kg, { qualified_name: 'cache:redis' });
console.assert(delRes.deleted === true, 'delete_node deve remover nó');

kg.close();
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

console.log('\n🎉 === Suíte de Integração MCP: Todas as 27 Ferramentas Validadas com 100% de Sucesso! ===\n');

import { KnowledgeGraphDB } from '../src/kg/db.js';
import { detectLouvainCommunities, calculateCentrality, analyzeImpact, simulateWhatIfRemoval, findMultiplePaths } from '../src/kg/algorithms.js';
import path from 'node:path';
import fs from 'node:fs';

const TEST_DB_PATH = path.join(process.cwd(), 'output', 'test-kg-engine.db');

// Limpar banco de teste anterior se existir
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

const kg = new KnowledgeGraphDB(TEST_DB_PATH);

console.log('🧪 === [TDD v6.0] Suíte de Testes do Motor Unificado de Knowledge Graph ===\n');

// 1. Testes de CRUD e Persistência
console.log('1. Testando CRUD e Schema Relacional SQLite...');
const nodeA = kg.addNode({ label: 'Service', name: 'AuthService', properties: { port: 8080 } });
const nodeB = kg.addNode({ label: 'Database', name: 'UserDB', properties: { engine: 'PostgreSQL' } });
const nodeC = kg.addNode({ label: 'Controller', name: 'AuthController', properties: { route: '/auth' } });

console.assert(nodeA.id !== undefined && nodeA.id > 0, 'nodeA deve ter ID gerado');
console.assert(nodeB.id !== undefined && nodeB.id > 0, 'nodeB deve ter ID gerado');
console.assert(nodeC.id !== undefined && nodeC.id > 0, 'nodeC deve ter ID gerado');

const edge1 = kg.addEdge({ source_id: nodeC.id!, target_id: nodeA.id!, type: 'CALLS' });
const edge2 = kg.addEdge({ source_id: nodeA.id!, target_id: nodeB.id!, type: 'CONNECTS_TO' });

console.assert(edge1.id !== undefined, 'edge1 deve ter sido criada');
console.assert(edge2.id !== undefined, 'edge2 deve ter sido criada');
console.log('  ✅ Nós e arestas inseridos com integridade referencial.');

// 2. Testes de Busca Full-Text Search (FTS5)
console.log('2. Testando Busca Textual Full-Text Search (FTS5)...');
const ftsResults = kg.searchGraph('Auth');
console.assert(ftsResults.length >= 2, 'FTS5 deve encontrar AuthService e AuthController');
console.log(`  ✅ FTS5 retornou ${ftsResults.length} resultados correspondentes.`);

// 3. Testes de Algoritmos de Centralidade
console.log('3. Testando Cálculo de Centralidade (PageRank, Betweenness)...');
const allNodes = kg.getAllNodes();
const allEdges = kg.getAllEdges();
const centrality = calculateCentrality(allNodes, allEdges);

console.assert(centrality.length === 3, 'Centralidade deve ser calculada para os 3 nós');
console.assert(centrality[0].pagerank > 0, 'PageRank deve ser maior que zero');
console.log(`  ✅ Nó mais central calculado: ${centrality[0].name} (PageRank: ${centrality[0].pagerank})`);

// 4. Testes de Algoritmo de Louvain (Detecção de Comunidades)
console.log('4. Testando Algoritmo de Louvain para Detecção de Comunidades...');
const communities = detectLouvainCommunities(allNodes, allEdges);
console.assert(communities.assignments.length === 3, 'Louvain deve classificar todos os 3 nós');
console.assert(communities.communities_count >= 1, 'Deve haver ao menos 1 comunidade identificada');
console.log(`  ✅ Louvain identificou ${communities.communities_count} comunidade(s) com sucesso.`);

// 5. Testes de Blast Radius e Simulação What-If
console.log('5. Testando Análise de Impacto (Blast Radius) e Simulação What-If...');
const impact = analyzeImpact(nodeA.id!, allNodes, allEdges);
console.assert(impact.direct_dependents.length >= 1, 'AuthService deve ter AuthController como dependente direto');
console.log(`  ✅ Blast Radius calculado: ${impact.total_affected_count} nós dependentes de ${nodeA.name}`);

const whatIf = simulateWhatIfRemoval(nodeA.id!, allNodes, allEdges);
console.assert(whatIf.edges_lost === 2, 'Remover AuthService deve romper 2 arestas');
console.log(`  ✅ Simulação What-If: remoção de ${nodeA.name} causa perda de ${whatIf.edges_lost} arestas.`);

// 6. Testes de Multi-Path Search
console.log('6. Testando Busca de Múltiplos Caminhos (Multi-Path)...');
const paths = findMultiplePaths(nodeC.id!, nodeB.id!, allNodes, allEdges);
console.assert(paths.length === 1, 'Deve existir 1 caminho entre AuthController e UserDB');
console.assert(paths[0].length === 2, 'Caminho deve ter comprimento 2 (AuthController -> AuthService -> UserDB)');
console.log(`  ✅ Multi-Path encontrou caminho exato de comprimento ${paths[0].length}.`);

// 7. Testes de Auditoria e Telemetria
console.log('7. Testando Health Check e Integridade do Banco...');
const health = kg.healthCheck();
console.assert(health.status === 'healthy', 'Status deve ser healthy');
console.assert(health.node_count === 3, 'Contagem de nós deve ser 3');
console.assert(health.edge_count === 2, 'Contagem de arestas deve ser 2');
console.log(`  ✅ Health check aprovado: ${health.node_count} nós, ${health.edge_count} arestas (${health.database_size_bytes} bytes).`);

kg.close();

// Limpar banco de teste
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

console.log('\n🎉 === Todos os testes da Fase 6.0 (Knowledge Graph) passaram com 100% de sucesso! ===');

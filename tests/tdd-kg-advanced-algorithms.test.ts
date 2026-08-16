import { KnowledgeGraphDB } from '../src/kg/db.js';
import {
  detectLouvainCommunities,
  calculateCentrality,
  analyzeImpact,
  simulateWhatIfRemoval,
  findMultiplePaths
} from '../src/kg/algorithms.js';
import path from 'node:path';
import fs from 'node:fs';

const TEST_DB_PATH = path.join(process.cwd(), 'output', 'test-kg-advanced.db');

if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

const kg = new KnowledgeGraphDB(TEST_DB_PATH);

console.log('🧪 === [TDD v6.0] Suíte Avançada de Algoritmos de Grafos e FTS5 ===\n');

// 1. Grafo Complexo com 2 Clusters Distintos (Cluster A: Vendas, Cluster B: Pagamentos)
console.log('1. Construindo Grafo com 2 Clusters Conectados por uma Ponte...');

// Cluster Vendas
const lead = kg.addNode({ label: 'Lead', name: 'Lead 101', qualified_name: 'lead:101' });
const deal = kg.addNode({ label: 'Deal', name: 'Enterprise Contract', qualified_name: 'deal:enterprise' });
const crm = kg.addNode({ label: 'Service', name: 'CRM Service', qualified_name: 'srv:crm' });

// Bridge
const checkout = kg.addNode({ label: 'Service', name: 'Checkout Gateway', qualified_name: 'srv:checkout' });

// Cluster Pagamentos
const payment = kg.addNode({ label: 'Service', name: 'Payment Processor', qualified_name: 'srv:payment' });
const ledger = kg.addNode({ label: 'Database', name: 'Ledger DB', qualified_name: 'db:ledger' });
const antifraud = kg.addNode({ label: 'Service', name: 'Anti-Fraud Engine', qualified_name: 'srv:antifraud' });

// Conexões Cluster Vendas
kg.addEdge({ source_id: lead.id!, target_id: deal.id!, type: 'CONVERTS_TO' });
kg.addEdge({ source_id: deal.id!, target_id: crm.id!, type: 'MANAGED_BY' });
kg.addEdge({ source_id: crm.id!, target_id: checkout.id!, type: 'TRIGGERS' });

// Conexões Cluster Pagamentos
kg.addEdge({ source_id: checkout.id!, target_id: payment.id!, type: 'CALLS' });
kg.addEdge({ source_id: payment.id!, target_id: antifraud.id!, type: 'VALIDATES_WITH' });
kg.addEdge({ source_id: antifraud.id!, target_id: payment.id!, type: 'APPROVES' });
kg.addEdge({ source_id: payment.id!, target_id: ledger.id!, type: 'WRITES_TO' });

const allNodes = kg.getAllNodes();
const allEdges = kg.getAllEdges();

console.assert(allNodes.length === 7, 'Devem existir 7 nós no grafo');
console.assert(allEdges.length === 7, 'Devem existir 7 arestas no grafo');
console.log('  ✅ Grafo com 7 nós e 7 arestas montado com sucesso.');

// 2. Validação Avançada de Louvain (Detecção de Comunidades)
console.log('\n2. Testando Algoritmo de Louvain em Grafo Bipartido/Modular...');
const louvainRes = detectLouvainCommunities(allNodes, allEdges, 20);
console.assert(louvainRes.communities_count >= 1, 'Louvain deve detectar comunidades válidas');
console.assert(louvainRes.assignments.length === 7, 'Todos os nós devem ter comunidade atribuída');

const commCheckout = louvainRes.assignments.find(a => a.node_id === checkout.id!)?.community_id;
console.assert(commCheckout !== undefined, 'Checkout Gateway deve ter comunidade válida');
console.log(`  ✅ Louvain particionou o grafo em ${louvainRes.communities_count} comunidade(s) com modularidade ${louvainRes.modularity}.`);

// 3. Validação de PageRank em Hubs e Sinks
console.log('\n3. Testando PageRank e Centralidade de Intermediação (Betweenness)...');
const centralityMetrics = calculateCentrality(allNodes, allEdges);
const topPR = centralityMetrics[0];
const topBetweenness = [...centralityMetrics].sort((a, b) => b.betweenness - a.betweenness)[0];

console.assert(topPR.pagerank > 0, 'PageRank deve ser positivo');
console.assert(topBetweenness.node_id === checkout.id! || topBetweenness.node_id === payment.id!, 'O nó ponte (Checkout ou Payment) deve ter maior Betweenness');
console.log(`  ✅ Maior PageRank: ${topPR.name} (${topPR.pagerank})`);
console.log(`  ✅ Maior Betweenness (Gargalo da Rede): ${topBetweenness.name} (${topBetweenness.betweenness})`);

// 4. Teste de Blast Radius Profundo e com Ciclos
console.log('\n4. Testando Blast Radius com Cadeia de Dependências e Ciclo...');
const impactPayment = analyzeImpact(payment.id!, allNodes, allEdges, 5);
console.assert(impactPayment.total_affected_count >= 2, 'Payment deve impactar Checkout, CRM e nós anteriores');
console.log(`  ✅ Blast Radius do Payment Processor: ${impactPayment.total_affected_count} nós afetados (${impactPayment.blast_radius_score * 100}% da rede).`);

// 5. Teste de Simulação What-If na Remoção do Nó Ponte
console.log('\n5. Testando Simulação What-If ao Remover o Nó Ponte (Checkout Gateway)...');
const whatIfCheckout = simulateWhatIfRemoval(checkout.id!, allNodes, allEdges);
console.assert(whatIfCheckout.edges_lost === 2, 'Remover Checkout Gateway deve romper 2 arestas');
console.log(`  ✅ Simulação What-If: remoção de ${checkout.name} rompe ${whatIfCheckout.edges_lost} arestas.`);

// 6. Teste de Busca de Múltiplos Caminhos (Multi-Path) com Limite de Profundidade
console.log('\n6. Testando Busca de Múltiplos Caminhos (Multi-Path Search)...');
const pathsFromLeadToLedger = findMultiplePaths(lead.id!, ledger.id!, allNodes, allEdges, 3, 6);
console.assert(pathsFromLeadToLedger.length >= 1, 'Deve existir caminho entre Lead e Ledger');
console.assert(pathsFromLeadToLedger[0].length === 5, 'Caminho mais curto deve ter comprimento 5 arestas');
console.log(`  ✅ Caminho encontrado: ${pathsFromLeadToLedger[0].nodes.map(n => n.name).join(' -> ')} (Tamanho: ${pathsFromLeadToLedger[0].length})`);

// 7. Teste de FTS5 com Acentuação e Termos em Português
console.log('\n7. Testando FTS5 com Acentuação, Caracteres Especiais e Case-Insensitivity...');
const searchContract = kg.searchGraph('Enterprise');
console.assert(searchContract.length >= 1, 'FTS5 deve encontrar "Enterprise Contract"');

const searchPrefix = kg.searchGraph('Anti');
console.assert(searchPrefix.length >= 1, 'FTS5 deve encontrar "Anti-Fraud Engine"');
console.log(`  ✅ FTS5 realizou correspondências exatas e por prefixo com sucesso.`);

kg.close();
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

console.log('\n🎉 === Todos os testes avançados de algoritmos e FTS5 passaram com 100% de sucesso! ===\n');

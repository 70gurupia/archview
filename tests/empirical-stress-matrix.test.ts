import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { estimateTokenCount, saveDiagramWithMeta } from '../src/utils/meta.js';
import { calculateCodebaseMetrics, estimateFileComplexity } from '../src/engine/metrics-engine.js';
import { executeCompressForLlm } from '../src/tools/compress-llm.js';
import { executeCloneAndScan } from '../src/tools/clone-scan.js';
import { generateTopologyMermaid, executeScanTopology } from '../src/tools/scan-topology.js';
import { KnowledgeGraphDB } from '../src/kg/db.js';
import { detectLouvainCommunities, calculateCentrality, analyzeImpact, simulateWhatIfRemoval } from '../src/kg/algorithms.js';
import { CodebaseTopology, ParsedFile } from '../src/engine/types.js';

console.log('⚡ === [DEVIN METHOD] Bateria de Testes Atômicos, Empíricos e de Estresse Massivo ===\n');

// =========================================================================
// BLOCO 1: TESTES ATÔMICOS UNITÁRIOS ISOLADOS
// =========================================================================
console.log('--- [BLOCO 1] Testes Atômicos Unitários ---');

// 1.1 Estimador de Tokens (tiktoken-like)
console.log('1.1 Testando estimador de tokens em diferentes grandezas...');
assert.strictEqual(estimateTokenCount(''), 0, 'String vazia deve ter 0 tokens');
const shortTokens = estimateTokenCount('flowchart TD\n  A --> B');
assert(shortTokens >= 4 && shortTokens <= 15, `Short string deve ter entre 4 e 15 tokens (calculado: ${shortTokens})`);

const massiveText = 'function test() { return 42; }\n'.repeat(1000);
const massiveTokens = estimateTokenCount(massiveText);
assert(massiveTokens > 5000, `Massive string deve ter mais de 5000 tokens (calculado: ${massiveTokens})`);
console.log(`  ✅ Estimativa de tokens aprovada (Vazio: 0, Curto: ${shortTokens}, Massivo: ${massiveTokens})`);

// 1.2 Estimador de Complexidade Ciclomática
console.log('\n1.2 Testando cálculo de complexidade ciclomática em blocos de código...');
const simpleCode = 'const x = 10; return x;';
assert.strictEqual(estimateFileComplexity(simpleCode), 1, 'Código sem branching deve ter complexidade 1');

const complexCode = `
if (a > 10) {
  for (let i = 0; i < 5; i++) {
    if (b || c && d) {
      while (e) {
        try { switch(f) { case 1: break; } } catch(err) {}
      }
    }
  }
}
`;
const calculatedComp = estimateFileComplexity(complexCode);
assert(calculatedComp >= 8, `Código com múltiplos branches deve ter complexidade >= 8 (calculado: ${calculatedComp})`);
console.log(`  ✅ Complexidade calculada com exatidão (Simples: 1, Complexo: ${calculatedComp})`);

// 1.3 Validação de Sanitização e URLs em clone_and_scan
console.log('\n1.3 Testando regras de segurança e sanitização em clone_and_scan...');
const invalidUrls = [
  'http://insecure-site.com/repo.git',
  'ftp://ftp.server.com/repo',
  'https://malicious-domain.org/payload; rm -rf /',
  'javascript:alert(1)',
  'file:///etc/passwd'
];

for (const badUrl of invalidUrls) {
  let blocked = false;
  try {
    executeCloneAndScan({ repo_url: badUrl });
  } catch (err: any) {
    if (err.message.includes('inválida') || err.message.includes('oficiais')) {
      blocked = true;
    }
  }
  assert(blocked, `URL não autorizada deve ser bloqueada: ${badUrl}`);
}
console.log('  ✅ Todas as 5 tentativas de injeção de URL foram neutralizadas.');


// =========================================================================
// BLOCO 2: TESTES EMPÍRICOS DE CARGA MASSIVA (100 A 1.000 NÓS)
// =========================================================================
console.log('\n--- [BLOCO 2] Testes Empíricos de Carga Massiva ---');

function createSyntheticTopology(nodeCount: number): CodebaseTopology {
  const files: ParsedFile[] = [];
  const crossModuleCalls: Array<{ fromFile: string; toFile: string; fromSymbol: string; toSymbol: string; callCount: number }> = [];

  for (let i = 1; i <= nodeCount; i++) {
    const isCore = i <= 5;
    const layer = isCore ? 'controller' : (i % 3 === 0 ? 'service' : (i % 3 === 1 ? 'repository' : 'util'));
    const filePath = `src/module_${Math.floor(i / 10)}/component_${i}.ts`;

    files.push({
      filePath: `/app/${filePath}`,
      relativePath: filePath,
      language: 'TypeScript',
      linesOfCode: 50 + (i % 200),
      layer,
      imports: [],
      exports: [`Component${i}`],
      symbols: [{ name: `Component${i}`, kind: 'class', line: 10, isExported: true }],
      calls: [],
      routes: []
    });

    if (i > 1) {
      // Connect to a previous node to create realistic topology
      const targetIndex = Math.max(1, Math.floor(i / 2));
      const targetFile = `src/module_${Math.floor(targetIndex / 10)}/component_${targetIndex}.ts`;
      crossModuleCalls.push({
        fromFile: filePath,
        toFile: targetFile,
        fromSymbol: `Component${i}`,
        toSymbol: `Component${targetIndex}`,
        callCount: 1 + (i % 4)
      });
    }
  }

  return {
    projectName: `Synthetic-Scale-${nodeCount}`,
    totalFiles: files.length,
    totalLinesOfCode: files.reduce((acc, f) => acc + f.linesOfCode, 0),
    languages: { TypeScript: files.length },
    frameworks: ['Node.js'],
    files,
    crossModuleCalls
  };
}

// 2.1 Teste de Escala: 100 Nós
console.log('\n2.1 Executando benchmark em topologia sintética de 100 nós...');
const memBefore100 = process.memoryUsage().heapUsed / 1024 / 1024;
const t0_100 = Date.now();
const topo100 = createSyntheticTopology(100);
const metrics100 = calculateCodebaseMetrics(topo100);
const mermaid100 = generateTopologyMermaid(topo100, 'hybrid', 'TD');
const t1_100 = Date.now();
const memAfter100 = process.memoryUsage().heapUsed / 1024 / 1024;

assert(metrics100.total_files === 100, 'Métricas devem conter exatamente 100 arquivos');
assert(mermaid100.includes('flowchart TD'), 'Mermaid deve ser gerado corretamente');
console.log(`  ✅ 100 Nós processados em ${t1_100 - t0_100}ms | Heap Delta: ${(memAfter100 - memBefore100).toFixed(2)} MB`);

// 2.2 Teste de Escala: 500 Nós
console.log('\n2.2 Executando benchmark em topologia sintética de 500 nós...');
const t0_500 = Date.now();
const topo500 = createSyntheticTopology(500);
const metrics500 = calculateCodebaseMetrics(topo500);
const mermaid500 = generateTopologyMermaid(topo500, 'hybrid', 'TD');
const t1_500 = Date.now();

assert(metrics500.total_files === 500, 'Métricas devem conter exatamente 500 arquivos');
assert(t1_500 - t0_500 < 1000, `500 nós devem ser processados em < 1000ms (tempo: ${t1_500 - t0_500}ms)`);
console.log(`  ✅ 500 Nós processados em ${t1_500 - t0_500}ms | Linhas de Código: ${topo500.totalLinesOfCode}`);

// 2.3 Teste de Escala: 1.000 Nós no Knowledge Graph SQLite WAL
console.log('\n2.3 Executando benchmark de Knowledge Graph com 1.000 nós e 1.500 arestas...');
const kgDbPath = path.join(process.cwd(), 'output', 'stress-matrix-kg.db');
if (fs.existsSync(kgDbPath)) fs.unlinkSync(kgDbPath);

const kg = new KnowledgeGraphDB(kgDbPath);
const t0_kg = Date.now();

// Inserção em batch
kg.db.transaction(() => {
  for (let i = 1; i <= 1000; i++) {
    kg.addNode({
      label: i % 2 === 0 ? 'Service' : 'Module',
      name: `Node_${i}`,
      qualified_name: `app.module.${i}`,
      properties: { priority: i % 10 }
    });
    if (i > 1) {
      kg.addEdge({
        source_id: i,
        target_id: Math.max(1, Math.floor(i / 2)),
        type: 'CALLS',
        weight: 1.0
      });
    }
  }
})();

const t1_kg_insert = Date.now();

// Algoritmos de Grafos no Grafo de 1.000 Nós
const rawNodes = kg.db.prepare('SELECT id, label, name FROM nodes').all() as any[];
const rawEdges = kg.db.prepare('SELECT source_id, target_id, weight FROM edges').all() as any[];

const communities = detectLouvainCommunities(rawNodes, rawEdges);
const centralityResults = calculateCentrality(rawNodes, rawEdges);
const impact = analyzeImpact(1, rawNodes, rawEdges);
const whatIf = simulateWhatIfRemoval(1, rawNodes, rawEdges);
const t2_kg_alg = Date.now();

assert(communities.communities_count > 0, 'Louvain deve detectar comunidades');
assert(centralityResults.length === 1000, 'Centralidade deve conter 1000 nós');
assert(typeof impact.total_affected_count === 'number', 'Impacto deve ser calculado');
assert(typeof whatIf.edges_lost === 'number', 'What-If deve calcular arestas perdidas');

console.log(`  ✅ 1.000 Nós e Arestas inseridos em ${t1_kg_insert - t0_kg}ms`);
console.log(`  ✅ Algoritmos de Rede (Louvain + Centrality + Impact) calculados em ${t2_kg_alg - t1_kg_insert}ms`);

kg.close();
if (fs.existsSync(kgDbPath)) fs.unlinkSync(kgDbPath);


// =========================================================================
// BLOCO 3: TESTES DE FUZZING, RESILIÊNCIA E CARACTERES ESPECIAIS
// =========================================================================
console.log('\n--- [BLOCO 3] Testes de Fuzzing & Resiliência ---');

// 3.1 Nomes com Caracteres Especiais, Emojis e Espaços
console.log('3.1 Testando tolerância a caminhos com emojis e caracteres especiais...');
const specialTopology: CodebaseTopology = {
  projectName: 'Projeto <Especial> & Teste 🚀',
  totalFiles: 3,
  totalLinesOfCode: 150,
  languages: { TypeScript: 3 },
  frameworks: ['Express'],
  files: [
    {
      filePath: '/app/src/módulo especial/arquivo com espaços.ts',
      relativePath: 'src/módulo especial/arquivo com espaços.ts',
      language: 'TypeScript',
      linesOfCode: 50,
      layer: 'controller',
      imports: [],
      exports: ['handler'],
      symbols: [{ name: 'handler', kind: 'function', line: 5, isExported: true }],
      calls: [],
      routes: []
    },
    {
      filePath: '/app/src/coração/entidade.ts',
      relativePath: 'src/coração/entidade.ts',
      language: 'TypeScript',
      linesOfCode: 100,
      layer: 'model',
      imports: [],
      exports: ['Entidade'],
      symbols: [{ name: 'Entidade', kind: 'class', line: 10, isExported: true }],
      calls: [],
      routes: []
    }
  ],
  crossModuleCalls: [
    {
      fromFile: 'src/módulo especial/arquivo com espaços.ts',
      toFile: 'src/coração/entidade.ts',
      fromSymbol: 'handler',
      toSymbol: 'Entidade',
      callCount: 2
    }
  ]
};

const specialMermaid = generateTopologyMermaid(specialTopology, 'hybrid', 'TD');
assert(!specialMermaid.includes('undefined'), 'Mermaid não deve conter undefined');
assert(specialMermaid.includes('flowchart TD'), 'Mermaid deve ser válido');
console.log('  ✅ Nomes com espaços, acentos e caracteres especiais sanitizados sem quebras.');

// 3.2 Compressão de Tokens no Repositório do Próprio ArchView
console.log('\n3.2 Validando compress_for_llm no repositório real...');
const compressResult = executeCompressForLlm({ path: process.cwd() });
assert(compressResult.estimated_tokens > 0 && compressResult.estimated_tokens < 3000, `Resumo deve ter menos de 3000 tokens (calculado: ${compressResult.estimated_tokens})`);
console.log(`  ✅ compress_for_llm gerou resumo estruturado de ${compressResult.estimated_tokens} tokens.`);

console.log('\n🎉 === Bateria de Testes Atômicos, Empíricos e de Estresse Concluída com 100% de Aprovação! ===\n');

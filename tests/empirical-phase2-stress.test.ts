import assert from 'node:assert';
import { AstCache } from '../src/engine/ast-cache.js';
import { lintArchitecture } from '../src/engine/rule-engine.js';
import { compareTopologies } from '../src/engine/architecture-diff.js';
import { CodebaseTopology, ParsedFile } from '../src/engine/types.js';

console.log('⚡ === [DEVIN METHOD - FASE 2] Bateria de Testes Empíricos de Carga e Estresse Massivo ===\n');

// 1. Benchmark de Cache Incremental com 1.000 Arquivos
console.log('1. Testando Benchmark de Cache com 1.000 arquivos...');
const cache = new AstCache();
const contents: string[] = [];

for (let i = 1; i <= 1000; i++) {
  const content = `export class Service_${i} { execute() { return ${i * 2}; } }`;
  contents.push(content);
  const parsed: ParsedFile = {
    filePath: `/app/src/service_${i}.ts`,
    relativePath: `src/service_${i}.ts`,
    language: 'TypeScript',
    linesOfCode: 20 + (i % 100),
    layer: i % 2 === 0 ? 'service' : 'controller',
    imports: [],
    exports: [`Service_${i}`],
    symbols: [{ name: `Service_${i}`, kind: 'class', line: 1, isExported: true }],
    calls: [],
    routes: []
  };
  cache.set(`src/service_${i}.ts`, content, parsed);
}

assert.strictEqual(cache.size(), 1000, 'Cache deve conter 1000 entradas');

// Mede tempo de 1.000 Cache Hits
const t0_hit = Date.now();
for (let i = 1; i <= 1000; i++) {
  const hit = cache.get(`src/service_${i}.ts`, contents[i - 1]);
  assert(hit !== null, `Entrada ${i} deve resultar em Cache Hit`);
}
const t1_hit = Date.now();
console.log(`  ✅ 1.000 Consultas de Cache Hit executadas em ${t1_hit - t0_hit}ms (Latência média: ${((t1_hit - t0_hit) / 1000).toFixed(4)}ms por arquivo)`);


// 2. Benchmark de Linter Arquitetural em Topologia de 1.000 Nós
console.log('\n2. Testando Linter Arquitetural em Topologia de 1.000 nós...');
const syntheticFiles: ParsedFile[] = [];
const syntheticCalls: Array<{ fromFile: string; toFile: string; fromSymbol: string; toSymbol: string; callCount: number }> = [];

for (let i = 1; i <= 1000; i++) {
  const layer = i <= 300 ? 'controller' : (i <= 700 ? 'service' : 'repository');
  const filePath = `src/module_${Math.floor(i / 10)}/comp_${i}.ts`;

  syntheticFiles.push({
    filePath: `/app/${filePath}`,
    relativePath: filePath,
    language: 'TypeScript',
    linesOfCode: 50,
    layer,
    imports: [],
    exports: [`Comp${i}`],
    symbols: [{ name: `Comp${i}`, kind: 'class', line: 1, isExported: true }],
    calls: [],
    routes: []
  });

  if (i > 1) {
    const target = Math.max(1, Math.floor(i / 2));
    syntheticCalls.push({
      fromFile: filePath,
      toFile: `src/module_${Math.floor(target / 10)}/comp_${target}.ts`,
      fromSymbol: `Comp${i}`,
      toSymbol: `Comp${target}`,
      callCount: 1
    });
  }
}

const largeTopology: CodebaseTopology = {
  projectName: 'Large-Scale-1000',
  totalFiles: 1000,
  totalLinesOfCode: 50000,
  languages: { TypeScript: 1000 },
  frameworks: ['Express'],
  files: syntheticFiles,
  crossModuleCalls: syntheticCalls
};

const t0_lint = Date.now();
const largeLint = lintArchitecture(largeTopology);
const t1_lint = Date.now();

assert.strictEqual(largeLint.total_rules, 3, 'Deve avaliar 3 regras padrão');
console.log(`  ✅ Linter avaliou 1.000 nós e dependências em ${t1_lint - t0_lint}ms (Violações: ${largeLint.violations_count})`);


// 3. Benchmark de Comparação e Diffing entre duas Topologias de 1.000 Nós
console.log('\n3. Testando Comparador e Diffing em 1.000 nós...');
const modifiedFiles = [...syntheticFiles.slice(0, 950)]; // 50 removidos
for (let i = 1001; i <= 1050; i++) { // 50 adicionados
  modifiedFiles.push({
    filePath: `/app/src/new_module/new_comp_${i}.ts`,
    relativePath: `src/new_module/new_comp_${i}.ts`,
    language: 'TypeScript',
    linesOfCode: 60,
    layer: 'service',
    imports: [],
    exports: [`NewComp${i}`],
    symbols: [{ name: `NewComp${i}`, kind: 'class', line: 1, isExported: true }],
    calls: [],
    routes: []
  });
}

const afterLargeTopology: CodebaseTopology = {
  projectName: 'Large-Scale-1000-Modified',
  totalFiles: modifiedFiles.length,
  totalLinesOfCode: 51000,
  languages: { TypeScript: modifiedFiles.length },
  frameworks: ['Express'],
  files: modifiedFiles,
  crossModuleCalls: syntheticCalls.slice(0, 900)
};

const t0_diff = Date.now();
const largeDiff = compareTopologies(largeTopology, afterLargeTopology);
const t1_diff = Date.now();

assert.strictEqual(largeDiff.added_files.length, 50, 'Deve detectar 50 arquivos adicionados');
assert.strictEqual(largeDiff.removed_files.length, 50, 'Deve detectar 50 arquivos removidos');
assert(largeDiff.mermaid_diff.includes('flowchart TD'), 'Deve gerar diagrama Mermaid válido');
console.log(`  ✅ Diffing de 1.000 nós executado em ${t1_diff - t0_diff}ms (Mudanças totais detectadas: ${largeDiff.summary.total_changes})`);

console.log('\n🎉 === Bateria de Testes Empíricos e de Estresse da Fase 2 Concluída com 100% de Aprovação! ===\n');

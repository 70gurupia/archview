import assert from 'node:assert';
import { AstCache } from '../src/engine/ast-cache.js';
import { lintArchitecture, ArchitectureRule } from '../src/engine/rule-engine.js';
import { compareTopologies } from '../src/engine/architecture-diff.js';
import { executeLintArchitecture } from '../src/tools/lint-architecture.js';
import { executeDiffArchitecture } from '../src/tools/diff-architecture.js';
import { CodebaseTopology, ParsedFile } from '../src/engine/types.js';

console.log('🧪 === [TDD v7.1] Suíte de Testes da Fase 2: Cache AST, Rule Engine e Architecture Diff ===\n');

// 1. Teste do Cache Incremental de AST (SHA-256)
console.log('1. Testando Cache Incremental de AST...');
const cache = new AstCache();
const sampleContent = 'export class UserService { getUser() { return 1; } }';
const sampleParsed: ParsedFile = {
  filePath: '/app/src/user.service.ts',
  relativePath: 'src/user.service.ts',
  language: 'TypeScript',
  linesOfCode: 1,
  layer: 'service',
  imports: [],
  exports: ['UserService'],
  symbols: [{ name: 'UserService', kind: 'class', line: 1, isExported: true }],
  calls: [],
  routes: []
};

// Cache Miss
const miss = cache.get('src/user.service.ts', sampleContent);
assert.strictEqual(miss, null, 'Primeira consulta deve resultar em Cache Miss (null)');

// Cache Set & Hit
cache.set('src/user.service.ts', sampleContent, sampleParsed);
const hit = cache.get('src/user.service.ts', sampleContent);
assert.notStrictEqual(hit, null, 'Segunda consulta com mesmo conteúdo deve resultar em Cache Hit');
assert.strictEqual(hit?.exports[0], 'UserService', 'Dados recuperados do cache devem ser idênticos');

// Cache Invalidation on Content Change
const modifiedContent = sampleContent + '\n// alterado';
const invalidation = cache.get('src/user.service.ts', modifiedContent);
assert.strictEqual(invalidation, null, 'Conteúdo alterado deve invalidar o cache automaticamente');
console.log('  ✅ Cache Incremental SHA-256: Miss, Hit e Invalidação validados com sucesso.');


// 2. Teste do Motor de Regras Arquiteturais (Rule Engine / Linter)
console.log('\n2. Testando Motor de Regras Arquiteturais (Rule Engine)...');
const violationTopology: CodebaseTopology = {
  projectName: 'Test-Violations',
  totalFiles: 3,
  totalLinesOfCode: 150,
  languages: { TypeScript: 3 },
  frameworks: ['Express'],
  files: [
    {
      filePath: '/app/src/user.controller.ts',
      relativePath: 'src/user.controller.ts',
      language: 'TypeScript',
      linesOfCode: 50,
      layer: 'controller',
      imports: [],
      exports: ['UserController'],
      symbols: [{ name: 'UserController', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    },
    {
      filePath: '/app/src/user.repository.ts',
      relativePath: 'src/user.repository.ts',
      language: 'TypeScript',
      linesOfCode: 100,
      layer: 'repository',
      imports: [],
      exports: ['UserRepository'],
      symbols: [{ name: 'UserRepository', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    }
  ],
  crossModuleCalls: [
    {
      fromFile: 'src/user.controller.ts',
      toFile: 'src/user.repository.ts',
      fromSymbol: 'UserController',
      toSymbol: 'UserRepository',
      callCount: 1
    }
  ]
};

const customRules: ArchitectureRule[] = [
  {
    id: 'RULE-001',
    name: 'Proibir Chamada Direta Controller -> Repository',
    type: 'forbidden_layer_call',
    severity: 'error',
    params: { from_layer: 'controller', to_layer: 'repository' }
  }
];

const lintResult = lintArchitecture(violationTopology, customRules);
assert.strictEqual(lintResult.passed, false, 'Topologia com chamada proibida deve reprovar no linter');
assert.strictEqual(lintResult.violations_count, 1, 'Deve conter exatamente 1 violação');
assert.strictEqual(lintResult.violations[0].rule_id, 'RULE-001', 'Violação deve corresponder à RULE-001');
console.log(`  ✅ Linter de Arquitetura detectou violação de camada com sucesso: ${lintResult.violations[0].message}`);


// 3. Teste do Diff Visual de Arquitetura (Architecture Diff)
console.log('\n3. Testando Comparador e Diff Visual de Arquitetura...');
const baseTopology: CodebaseTopology = {
  projectName: 'Base-Version',
  totalFiles: 2,
  totalLinesOfCode: 100,
  languages: { TypeScript: 2 },
  frameworks: ['Node.js'],
  files: [
    {
      filePath: '/app/src/moduleA.ts',
      relativePath: 'src/moduleA.ts',
      language: 'TypeScript',
      linesOfCode: 50,
      layer: 'service',
      imports: [],
      exports: ['ModuleA'],
      symbols: [{ name: 'ModuleA', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    },
    {
      filePath: '/app/src/moduleB.ts',
      relativePath: 'src/moduleB.ts',
      language: 'TypeScript',
      linesOfCode: 50,
      layer: 'service',
      imports: [],
      exports: ['ModuleB'],
      symbols: [{ name: 'ModuleB', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    }
  ],
  crossModuleCalls: []
};

const nextTopology: CodebaseTopology = {
  projectName: 'Next-Version',
  totalFiles: 2,
  totalLinesOfCode: 150,
  languages: { TypeScript: 2 },
  frameworks: ['Node.js'],
  files: [
    {
      filePath: '/app/src/moduleA.ts',
      relativePath: 'src/moduleA.ts',
      language: 'TypeScript',
      linesOfCode: 90, // Modificado
      layer: 'service',
      imports: [],
      exports: ['ModuleA'],
      symbols: [{ name: 'ModuleA', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    },
    {
      filePath: '/app/src/moduleC.ts', // Novo (moduleB foi removido)
      relativePath: 'src/moduleC.ts',
      language: 'TypeScript',
      linesOfCode: 60,
      layer: 'controller',
      imports: [],
      exports: ['ModuleC'],
      symbols: [{ name: 'ModuleC', kind: 'class', line: 1, isExported: true }],
      calls: [],
      routes: []
    }
  ],
  crossModuleCalls: [
    {
      fromFile: 'src/moduleC.ts',
      toFile: 'src/moduleA.ts',
      fromSymbol: 'ModuleC',
      toSymbol: 'ModuleA',
      callCount: 1
    }
  ]
};

const diff = compareTopologies(baseTopology, nextTopology);
assert.strictEqual(diff.added_files.length, 1, 'Deve detectar 1 arquivo adicionado (moduleC)');
assert.strictEqual(diff.removed_files.length, 1, 'Deve detectar 1 arquivo removido (moduleB)');
assert.strictEqual(diff.modified_files.length, 1, 'Deve detectar 1 arquivo modificado (moduleA)');
assert.strictEqual(diff.added_calls.length, 1, 'Deve detectar 1 nova conexão');
assert(diff.mermaid_diff.includes('diffAdded'), 'Mermaid Diff deve incluir estilo diffAdded');
assert(diff.mermaid_diff.includes('diffRemoved'), 'Mermaid Diff deve incluir estilo diffRemoved');
assert(diff.mermaid_diff.includes('diffModified'), 'Mermaid Diff deve incluir estilo diffModified');
console.log(`  ✅ Architecture Diff gerou mapa visual com sucesso (Adicionados: ${diff.added_files.length}, Modificados: ${diff.modified_files.length}, Removidos: ${diff.removed_files.length})`);


// 4. Teste de Execução das Ferramentas MCP
console.log('\n4. Testando Ferramenta MCP lint_architecture no repositório atual...');
const lintToolResult = executeLintArchitecture({ path: process.cwd() });
assert.strictEqual(lintToolResult.success, true, 'lint_architecture deve executar com sucesso');
assert(lintToolResult.markdown.includes('Relatório de Linter Arquitetural'), 'Markdown deve conter cabeçalho');
console.log(`  ✅ Ferramenta MCP lint_architecture validada no repositório: ${lintToolResult.summary.passed ? 'APROVADO' : 'VIOLAÇÕES ENCONTRADAS'}`);

console.log('\n🎉 === Todos os testes TDD da Fase 2 (v7.1) passaram com 100% de sucesso! ===\n');

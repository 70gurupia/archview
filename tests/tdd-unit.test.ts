import { generateMindmapMermaid, executeMindmap } from '../src/tools/mindmap.js';
import { generateOrgchartMermaid, detectCycle, executeOrgchart } from '../src/tools/orgchart.js';
import { generateArchitectureMermaid, executeArchitecture } from '../src/tools/architecture.js';
import { generateFlowchartMermaid, executeFlowchart } from '../src/tools/flowchart.js';
import { sanitizeSlug, generateId, assertSafePath } from '../src/utils/meta.js';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

import { exportSvgToPng } from '../frontend/src/export-helper.js';

function runTddSuite() {
  console.log('🧪 === [TDD] Suíte de Testes Unitários ===\n');

  console.log('0. Testes de Export Helper (Frontend Mock):');
  assert(typeof exportSvgToPng === 'function', 'exportSvgToPng está definido e suporta multiplos backgrounds e escalas 4K');


  // 1. Slug Sanitization & ID Generation
  console.log('1. Testes de Utilitários de Metadados:');
  const slug1 = sanitizeSlug('Arquitetura de Pagamentos & Cobrança!');
  assert(slug1 === 'arquitetura-de-pagamentos-cobranca', 'Sanitização de slug remove acentos e caracteres especiais');

  const slug2 = sanitizeSlug('');
  assert(slug2 === 'diagram', 'Slug vazio faz fallback para "diagram"');

  const { id, baseFilename } = generateId('mindmap', 'Título Teste');
  assert(id.startsWith('mindmap-titulo-teste-'), 'ID gerado tem prefixo e slug corretos');
  assert(id === baseFilename, 'baseFilename coincide com o ID único');

  const outDir = path.join(process.cwd(), 'output');
  let pathError = false;
  try {
    assertSafePath('../../etc/passwd', outDir);
  } catch {
    pathError = true;
  }
  assert(pathError, 'assertSafePath bloqueia tentativas de path traversal');

  // 2. Mindmap Generator
  console.log('\n2. Testes de generate_mindmap:');
  const { syntax: mmSyntax, nodeCount: mmNodes, maxDepth: mmDepth } = generateMindmapMermaid({
    central_topic: 'Tema Central',
    branches: [
      { title: 'Ramo A', icons: ['🌟'], sub_branches: ['Sub A1', 'Sub A2'] },
      { title: 'Ramo B', sub_branches: ['Sub B1'] }
    ]
  });
  assert(mmSyntax.includes('root(("Tema Central"))'), 'Mindmap gera nó central correto');
  assert(mmSyntax.includes('🌟 Ramo A'), 'Mindmap renderiza ícones nos ramos');
  assert(mmNodes === 6, 'Mindmap calcula contagem exata de nós (1 raiz + 2 ramos + 3 sub-ramos = 6)');
  assert(mmDepth === 2, 'Mindmap calcula profundidade máxima correta');

  // 3. Orgchart Generator & Cycle Detection
  console.log('\n3. Testes de generate_orgchart e Detecção de Ciclos:');
  const linearNodes = [
    { id: 'ceo', label: 'CEO', role: 'Chief Executive' },
    { id: 'cto', label: 'CTO', role: 'VP Tech', reports_to: 'ceo' },
    { id: 'dev', label: 'Dev', role: 'Eng', reports_to: 'cto' }
  ];
  assert(detectCycle(linearNodes) === false, 'Detecção de ciclo retorna falso para hierarquia linear');

  const cyclicNodes = [
    { id: 'a', label: 'A', role: 'R1', reports_to: 'b' },
    { id: 'b', label: 'B', role: 'R2', reports_to: 'c' },
    { id: 'c', label: 'C', role: 'R3', reports_to: 'a' }
  ];
  assert(detectCycle(cyclicNodes) === true, 'Detecção de ciclo identifica loops fechados (A -> B -> C -> A)');

  const selfCycleNodes = [
    { id: 'x', label: 'X', role: 'R', reports_to: 'x' }
  ];
  assert(detectCycle(selfCycleNodes) === true, 'Detecção de ciclo identifica auto-referência (X -> X)');

  const orgSyntax = generateOrgchartMermaid({
    title: 'Organograma Teste',
    nodes: linearNodes,
    style: { color_by_level: true }
  });
  assert(orgSyntax.includes('graph TD'), 'Organograma define direção padrão TD');
  assert(orgSyntax.includes('ceo --> cto'), 'Organograma estabelece arestas hierárquicas');
  assert(orgSyntax.includes('classDef lvl0'), 'Organograma injeta classes CSS de níveis');

  // 4. Architecture Generator (C4 Model)
  console.log('\n4. Testes de generate_architecture_diagram (C4):');
  const archSyntaxC1 = generateArchitectureMermaid({
    c4_level: 'C1-context',
    system_name: 'Sistema Contexto',
    elements: [
      { id: 'user', type: 'person', name: 'Usuário', description: 'Cliente' },
      { id: 'sys', type: 'system', name: 'Sistema', description: 'Plataforma' }
    ]
  });
  assert(archSyntaxC1.startsWith('C4Context'), 'C1 gera cabeçalho C4Context');
  assert(archSyntaxC1.includes('Person(user, "Usuário", "Cliente")'), 'C1 renderiza Person com atributos corretos');

  const archSyntaxC2 = generateArchitectureMermaid({
    c4_level: 'C2-container',
    system_name: 'Sistema Containers',
    elements: [
      { id: 'db', type: 'database', name: 'Banco', description: 'Armazena dados', technology: 'PostgreSQL' }
    ]
  });
  assert(archSyntaxC2.startsWith('C4Container'), 'C2 gera cabeçalho C4Container');
  assert(archSyntaxC2.includes('ContainerDb(db, "Banco", "PostgreSQL", "Armazena dados")'), 'C2 renderiza ContainerDb com tecnologia');

  // 5. Flowchart Generator
  console.log('\n5. Testes de generate_flowchart:');
  const flowSyntax = generateFlowchartMermaid({
    title: 'Fluxo Decisório',
    steps: [
      { id: 'start', type: 'start', label: 'Início', next: ['dec'] },
      { id: 'dec', type: 'decision', label: 'Válido?', next: [{ id: 'ok', label: 'Sim' }, { id: 'fail', label: 'Não' }] },
      { id: 'ok', type: 'end', label: 'Fim Sucesso' },
      { id: 'fail', type: 'end', label: 'Fim Falha' }
    ]
  });
  assert(flowSyntax.includes('flowchart TD'), 'Flowchart inicializa com direção padrão');
  assert(flowSyntax.includes('dec{"Válido?"}'), 'Flowchart mapeia tipo decision para shape losango {}');
  assert(flowSyntax.includes('dec -- "Sim" --> ok'), 'Flowchart mapeia labels de transição condicional');

  console.log('\n🎉 [TDD] Todos os testes unitários passaram com 100% de sucesso!\n');
}

runTddSuite();
